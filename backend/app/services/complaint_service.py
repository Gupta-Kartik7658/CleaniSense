import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.complaint import Complaint
from app.models.complaint_status_history import ComplaintStatusHistory
from app.models.complaint_category import ComplaintCategory
from app.models.municipality import Municipality
from app.repositories.complaint import complaint_repository
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate
from app.constants.enums import ComplaintStatus, UserRole
from app.services.severity_service import severity_service

logger = logging.getLogger("uvicorn")

# Allowed state machine transitions mapping
ALLOWED_TRANSITIONS: Dict[str, List[str]] = {
    ComplaintStatus.DRAFT.value: [
        ComplaintStatus.SUBMITTED.value,
        ComplaintStatus.AI_VERIFICATION_IN_PROGRESS.value
    ],
    ComplaintStatus.SUBMITTED.value: [
        ComplaintStatus.AI_VALIDATION_COMPLETED.value,
        ComplaintStatus.REJECTED.value
    ],
    ComplaintStatus.AI_VERIFICATION_IN_PROGRESS.value: [
        ComplaintStatus.AI_VALIDATION_COMPLETED.value,
        ComplaintStatus.REJECTED.value,
        ComplaintStatus.MUNICIPALITY_ACCEPTED.value
    ],
    ComplaintStatus.AI_VALIDATION_COMPLETED.value: [
        ComplaintStatus.MUNICIPALITY_ACCEPTED.value,
        ComplaintStatus.REJECTED.value
    ],
    ComplaintStatus.MUNICIPALITY_ACCEPTED.value: [ComplaintStatus.OFFICER_ASSIGNED.value],
    ComplaintStatus.OFFICER_ASSIGNED.value: [ComplaintStatus.IN_PROGRESS.value],
    ComplaintStatus.IN_PROGRESS.value: [ComplaintStatus.INSPECTION_COMPLETED.value],
    ComplaintStatus.INSPECTION_COMPLETED.value: [
        ComplaintStatus.RESOLVED.value,
        ComplaintStatus.REJECTED.value
    ],
    ComplaintStatus.RESOLVED.value: [ComplaintStatus.ARCHIVED.value],
    ComplaintStatus.REJECTED.value: [ComplaintStatus.ARCHIVED.value],
    ComplaintStatus.ARCHIVED.value: []
}

class ComplaintService:
    def create_complaint(
        self, db: Session, obj_in: ComplaintCreate, user_id: uuid.UUID
    ) -> Complaint:
        """
        Creates a complaint and logs the initial status timeline event.
        """
        # Validate category existence
        logger.info(f"[ComplaintService] Validating category={obj_in.category_id}")
        category = db.query(ComplaintCategory).filter(
            ComplaintCategory.id == obj_in.category_id,
            ComplaintCategory.is_active == True
        ).first()
        if not category:
            logger.warning(f"[ComplaintService] Invalid category_id={obj_in.category_id} — not found or inactive")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected complaint category is invalid or inactive"
            )
            
        # Validate municipality existence if provided
        if obj_in.municipality_id:
            logger.info(f"[ComplaintService] Validating municipality={obj_in.municipality_id}")
            municipality = db.query(Municipality).filter(
                Municipality.id == obj_in.municipality_id,
                Municipality.is_active == True
            ).first()
            if not municipality:
                logger.warning(f"[ComplaintService] Invalid municipality_id={obj_in.municipality_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected municipality is invalid or inactive"
                )

        complaint = complaint_repository.create(db, obj_in, user_id)
        logger.info(f"[ComplaintService] Complaint persisted — id={complaint.id}")
        
        # Add initial status timeline history entry
        # Standard status when creating is 'submitted' as citizen posts it
        complaint.status = ComplaintStatus.SUBMITTED.value
        db.add(complaint)
        db.commit()
        
        # Create timeline entry
        self._add_status_history_entry(db, complaint.id, complaint.status, "Complaint submitted", user_id)
        from app.services.weather_service import weather_service
        from app.services.hotspot_service import hotspot_service

        weather_service.enrich_complaint(db, complaint)
        complaint = severity_service.calculate_and_apply(db, complaint)
        hotspot_service.refresh_for_complaint(db, complaint)
        
        # Optional: trigger notification dispatch hook
        self._dispatch_notification_hook(db, complaint, "SUBMITTED")

        logger.info(f"[ComplaintService] Complaint fully created — id={complaint.id} status={complaint.status}")
        return complaint

    def apply_image_analysis_to_complaint(
        self,
        db: Session,
        complaint: Complaint,
        image_content: bytes,
        content_type: str,
    ) -> Complaint:
        """
        Runs category-aware CV analysis for image attachments and recalculates
        the SRS severity score.
        """
        if complaint.category and "noise" in complaint.category.name.lower():
            logger.info(
                "[ComplaintService] Skipping image analysis for noise complaint=%s",
                complaint.id,
            )
            return complaint

        from app.services.pollution_image_service import pollution_image_service

        category_name = complaint.category.name if complaint.category else None
        analysis_result = pollution_image_service.analyze(
            image_content,
            category_name=category_name,
        )
        analysis = analysis_result.to_dict()
        from app.services.gemini_vision_service import gemini_vision_service

        gemini_analysis = gemini_vision_service.analyze_image(
            image_content=image_content,
            mime_type=content_type,
            category_name=category_name,
            local_analysis=analysis,
        )
        if gemini_analysis:
            analysis["ai_confidence_score"] = gemini_analysis["confidence_score"]
            analysis["gemini_analysis"] = gemini_analysis

        complaint = severity_service.calculate_and_apply(
            db=db,
            complaint=complaint,
            image_analysis=analysis,
        )
        from app.services.hotspot_service import hotspot_service
        hotspot_service.refresh_for_complaint(db, complaint)
        return complaint

    def get_complaint(self, db: Session, id: uuid.UUID, current_user: User) -> Complaint:
        """
        Retrieves a complaint after validating access permissions.
        """
        complaint = complaint_repository.get(db, id)
        if not complaint:
            logger.warning(f"[ComplaintService] Complaint not found — id={id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )
            
        # Check permissions: citizens can only view their own complaints
        if current_user.role == UserRole.CITIZEN.value:
            if complaint.user_id != current_user.id:
                logger.warning(
                    f"[ComplaintService] Permission denied — user={current_user.id} tried to access "
                    f"complaint={id} owned by user={complaint.user_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view this complaint"
                )
        # Check permissions: municipal staff can only view complaints from their own municipality
        elif current_user.role in [UserRole.MUNICIPALITY_OFFICER.value, UserRole.MUNICIPALITY_ADMIN.value]:
            if complaint.municipality_id != current_user.municipality_id:
                logger.warning(
                    f"[ComplaintService] Permission denied — municipal user={current_user.id} tried to access "
                    f"complaint={id} assigned to municipality={complaint.municipality_id} "
                    f"but user belongs to municipality={current_user.municipality_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view complaints from other municipalities"
                )

        # Generate fresh public URLs for any attachments (signed URLs for Supabase)
        from app.services.storage_service import storage_service
        storage_service.enrich_attachments(complaint)

        return complaint

    def list_complaints(self, db: Session, user_id: uuid.UUID, page: int, page_size: int) -> dict:
        """
        Returns a paginated list of active complaints for a user.
        """
        return complaint_repository.list_by_user(db, user_id, page, page_size)

    def get_history(
        self,
        db: Session,
        current_user: User,
        status_filter: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20
    ) -> dict:
        """
        Returns advanced query result list for user or municipal complaint history.
        """
        # Validate status if provided
        if status_filter and status_filter not in [s.value for s in ComplaintStatus]:
            logger.warning(f"[ComplaintService] Invalid status filter: '{status_filter}'")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter value: {status_filter}"
            )
            
        # Determine filtering based on user role
        user_id_filter = None
        municipality_id_filter = None
        
        if current_user.role == UserRole.CITIZEN.value:
            user_id_filter = current_user.id
        elif current_user.role in [UserRole.MUNICIPALITY_OFFICER.value, UserRole.MUNICIPALITY_ADMIN.value]:
            municipality_id_filter = current_user.municipality_id
        # super_admin gets all (no filters)

        return complaint_repository.list_history(
            db=db,
            user_id=user_id_filter,
            municipality_id=municipality_id_filter,
            status=status_filter,
            category_id=category_id,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size
        )

    def update_complaint(
        self, db: Session, id: uuid.UUID, obj_in: ComplaintUpdate, current_user: User
    ) -> Complaint:
        """
        Updates basic details or status/assignment properties based on role constraints.
        """
        complaint = complaint_repository.get(db, id)
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )

        from app.schemas.complaint import ComplaintCitizenUpdate, ComplaintMunicipalityUpdate

        data_keys = obj_in.model_dump(exclude_unset=True).keys()
        mun_fields = {"status", "severity", "assigned_department", "assigned_officer", "resolution", "remarks"}
        cit_fields = {
            "title",
            "description",
            "category_id",
            "location_name",
            "latitude",
            "longitude",
            "area_affected_sqm",
            "population_affected",
            "duration_hours",
            "survey_data",
        }

        if current_user.role == UserRole.CITIZEN.value:
            # 1. Reject municipal field updates
            if any(k in mun_fields for k in data_keys):
                logger.warning(f"[ComplaintService] Citizen update blocked — tried to edit municipal fields: {data_keys}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Citizens are not permitted to modify municipal dashboard action fields."
                )

            # Validate against Citizen schema
            validated = ComplaintCitizenUpdate.model_validate(obj_in.model_dump(exclude_unset=True))
            
            # 2. Ownership check
            if complaint.user_id != current_user.id:
                logger.warning(f"[ComplaintService] Update denied — user={current_user.id} complaint={id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to modify this complaint"
                )
                
            # 3. Restrict edit based on status
            if complaint.status not in [ComplaintStatus.DRAFT.value, ComplaintStatus.SUBMITTED.value]:
                logger.warning(f"[ComplaintService] Update denied — complaint={id} status={complaint.status}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Complaints cannot be modified once they transition to state: {complaint.status}"
                )

            # Validate category if updating
            if validated.category_id:
                category = db.query(ComplaintCategory).filter(
                    ComplaintCategory.id == validated.category_id,
                    ComplaintCategory.is_active == True
                ).first()
                if not category:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Selected complaint category is invalid or inactive"
                    )

            update_data = validated.model_dump(exclude_unset=True)
            if "latitude" in update_data or "longitude" in update_data:
                lat = update_data.get("latitude", complaint.latitude)
                lng = update_data.get("longitude", complaint.longitude)
                update_data["geo_point"] = f"POINT({lng} {lat})"

            complaint = complaint_repository.update(db, complaint, update_data)
            from app.services.weather_service import weather_service
            from app.services.hotspot_service import hotspot_service

            if "latitude" in update_data or "longitude" in update_data:
                weather_service.enrich_complaint(db, complaint)
            complaint = severity_service.calculate_and_apply(db, complaint)
            hotspot_service.refresh_for_complaint(db, complaint)
            return complaint

        elif current_user.role in [UserRole.MUNICIPALITY_OFFICER.value, UserRole.MUNICIPALITY_ADMIN.value]:
            # 1. Reject citizen field updates
            if any(k in cit_fields for k in data_keys):
                logger.warning(f"[ComplaintService] Municipal update blocked — tried to edit citizen fields: {data_keys}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Municipal staff are not permitted to modify citizen reporting details."
                )

            # Validate against Municipality schema
            validated = ComplaintMunicipalityUpdate.model_validate(obj_in.model_dump(exclude_unset=True))

            # 2. Tenancy check
            if complaint.municipality_id != current_user.municipality_id:
                logger.warning(
                    f"[ComplaintService] Municipal update blocked — user={current_user.id} "
                    f"tried to update complaint={id} of municipality={complaint.municipality_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view or modify complaints from other municipalities"
                )

            # 3. Process severity/priority
            if validated.severity is not None:
                complaint.severity = validated.severity

            # 4. Process assignments
            if validated.assigned_department is not None:
                complaint.assigned_department = validated.assigned_department
            if validated.assigned_officer is not None:
                complaint.assigned_officer = validated.assigned_officer

            db.add(complaint)
            db.commit()

            # 5. Process status transition state machine rules
            if validated.status is not None:
                resolution_payload = None
                if validated.resolution:
                    resolution_payload = validated.resolution.model_dump(exclude_unset=True)
                
                complaint = self.transition_status(
                    db=db,
                    id=id,
                    next_status=validated.status,
                    remarks=validated.remarks,
                    changed_by=current_user.id,
                    resolution_data=resolution_payload,
                    assignment_data={
                        "department": validated.assigned_department,
                        "officer_name": validated.assigned_officer
                    } if (validated.assigned_department or validated.assigned_officer) else None
                )

            return complaint

        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Role does not have permission to update complaints."
            )

    def cancel_complaint(self, db: Session, id: uuid.UUID, user_id: uuid.UUID) -> Complaint:
        """
        Soft-deletes a complaint if in draft or submitted status.
        """
        complaint = complaint_repository.get(db, id)
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )
            
        # Ownership check
        if complaint.user_id != user_id:
            logger.warning(f"[ComplaintService] Delete denied — user={user_id} complaint={id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this complaint"
            )
            
        # Status constraint check
        if complaint.status not in [ComplaintStatus.DRAFT.value, ComplaintStatus.SUBMITTED.value]:
            logger.warning(f"[ComplaintService] Delete denied — complaint={id} status={complaint.status}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Complaints cannot be deleted once they transition to state: {complaint.status}"
            )

        logger.info(f"[ComplaintService] Soft-deleting complaint={id}")
        return complaint_repository.soft_delete(db, complaint, user_id)

    def transition_status(
        self,
        db: Session,
        id: uuid.UUID,
        next_status: str,
        remarks: Optional[str],
        changed_by: uuid.UUID,
        resolution_data: Optional[dict] = None,
        assignment_data: Optional[dict] = None
    ) -> Complaint:
        """
        Transitions a complaint through the state machine.
        """
        complaint = complaint_repository.get(db, id)
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )

        current_status = complaint.status
        allowed_next = ALLOWED_TRANSITIONS.get(current_status, [])
        
        if next_status not in allowed_next:
            logger.warning(
                f"[ComplaintService] Invalid transition — complaint={id} "
                f"from='{current_status}' to='{next_status}' allowed={allowed_next}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{current_status}' to '{next_status}'"
            )

        logger.info(
            f"[ComplaintService] Transitioning complaint={id} "
            f"from='{current_status}' to='{next_status}' by={changed_by}"
        )

        # If transitioning to resolved, require and create resolution report
        if next_status == ComplaintStatus.RESOLVED.value:
            if not resolution_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Resolution details are required when resolving a complaint"
                )
            
            from app.models.resolution_report import ResolutionReport
            resolution = ResolutionReport(
                complaint_id=id,
                summary=resolution_data.get("summary", ""),
                department=resolution_data.get("department", "Environmental Board"),
                officer_name=resolution_data.get("officer_name", "Officer"),
                actions=resolution_data.get("actions", ""),
                before_image_url=resolution_data.get("before_image_url"),
                after_image_url=resolution_data.get("after_image_url"),
                date_resolved=datetime.now(timezone.utc)
            )
            db.add(resolution)
            logger.info(f"[ComplaintService] Resolution report created for complaint={id}")

        # If transitioning to officer assigned, save assignment details
        if next_status == ComplaintStatus.OFFICER_ASSIGNED.value:
            if assignment_data:
                complaint.assigned_department = assignment_data.get("department")
                complaint.assigned_officer = assignment_data.get("officer_name")
                logger.info(
                    f"[ComplaintService] Assigned complaint={id} to "
                    f"dept='{complaint.assigned_department}' officer='{complaint.assigned_officer}'"
                )

        # Transition status
        complaint.status = next_status
        complaint.updated_at = datetime.now(timezone.utc)
        db.add(complaint)
        db.commit()
        
        # Log history entry
        self._add_status_history_entry(db, complaint.id, next_status, remarks, changed_by)
        
        # Trigger notification hook
        self._dispatch_notification_hook(db, complaint, next_status.upper())

        logger.info(f"[ComplaintService] Transition complete — complaint={id} status={next_status}")
        return complaint

    def _add_status_history_entry(
        self, db: Session, complaint_id: uuid.UUID, status_str: str, remarks: Optional[str], changed_by: uuid.UUID
    ) -> ComplaintStatusHistory:
        """
        Private helper to append a status change timeline entry.
        """
        history_entry = ComplaintStatusHistory(
            complaint_id=complaint_id,
            status=status_str,
            remarks=remarks,
            changed_by=changed_by
        )
        db.add(history_entry)
        db.commit()
        db.refresh(history_entry)
        return history_entry

    def _dispatch_notification_hook(self, db: Session, complaint: Complaint, notification_type: str):
        """
        Inter-service trigger to dispatch a user notification on complaint events.
        """
        from app.services.notification_service import notification_service
        
        short_id = str(complaint.id)[:8]
        
        templates = {
            "SUBMITTED": {
                "title": f"Report #{short_id} submitted successfully",
                "message": "Your environmental complaint has been registered and is pending review."
            },
            "AI_VALIDATION_COMPLETED": {
                "title": f"AI verification completed for #{short_id}",
                "message": "AI has processed and verified the details of your environmental complaint."
            },
            "MUNICIPALITY_ACCEPTED": {
                "title": f"Municipality accepted report #{short_id}",
                "message": "The municipal authority has accepted your complaint and is reviewing remediation steps."
            },
            "OFFICER_ASSIGNED": {
                "title": f"Field officer assigned to #{short_id}",
                "message": "A field officer has been assigned to inspect the reported location."
            },
            "IN_PROGRESS": {
                "title": f"Work in progress on #{short_id}",
                "message": "Active field work has begun to resolve your reported complaint."
            },
            "INSPECTION_COMPLETED": {
                "title": f"Inspection completed for #{short_id}",
                "message": "The site inspection is finished and resolution evidence is being processed."
            },
            "RESOLVED": {
                "title": f"Report #{short_id} has been resolved",
                "message": "The reported environmental concern has been successfully resolved. Tap to view details."
            },
            "REJECTED": {
                "title": f"Report #{short_id} was rejected",
                "message": "Your complaint was rejected by municipal review."
            }
        }
        
        tpl = templates.get(notification_type)
        if not tpl:
            return
            
        title = tpl["title"]
        message = tpl["message"]
        
        # If there are remarks in the timeline, append them to the message
        if complaint.timeline:
            latest_history = complaint.timeline[-1]
            if latest_history.remarks:
                message += f" Remarks: {latest_history.remarks}"

        notification_service.create_notification(
            db=db,
            user_id=complaint.user_id,
            complaint_id=complaint.id,
            title=title,
            message=message,
            notification_type=notification_type
        )

    def get_municipal_overview(self, db: Session, municipality_id: uuid.UUID) -> dict:
        """
        Returns stats counts grouped logically for the municipality.
        """
        status_counts = complaint_repository.count_by_status(db, municipality_id=municipality_id)
        
        # Calculate stats
        total_reports = sum(status_counts.values())
        resolved_reports = status_counts.get(ComplaintStatus.RESOLVED.value, 0)
        
        active_statuses = [
            ComplaintStatus.MUNICIPALITY_ACCEPTED.value,
            ComplaintStatus.OFFICER_ASSIGNED.value,
            ComplaintStatus.IN_PROGRESS.value,
            ComplaintStatus.INSPECTION_COMPLETED.value
        ]
        active_reports = sum(status_counts.get(status, 0) for status in active_statuses)
        
        pending_statuses = [
            ComplaintStatus.SUBMITTED.value,
            ComplaintStatus.AI_VALIDATION_COMPLETED.value
        ]
        pending_reports = sum(status_counts.get(status, 0) for status in pending_statuses)
        
        return {
            "total_reports": total_reports,
            "active_reports": active_reports,
            "resolved_reports": resolved_reports,
            "pending_reports": pending_reports
        }

    def get_recent_municipal_complaints(self, db: Session, municipality_id: uuid.UUID) -> list:
        """
        Retrieves the 5 most recent complaints assigned to the municipality.
        """
        return db.query(Complaint).filter(
            Complaint.municipality_id == municipality_id,
            Complaint.is_deleted == False
        ).order_by(desc(Complaint.created_at)).limit(5).all()

    def get_recent_municipal_activity(self, db: Session, municipality_id: uuid.UUID) -> list:
        """
        Retrieves the 10 most recent status changes in the municipality.
        """
        return complaint_repository.get_recent_activity(db, municipality_id, limit=10)

def verify_complaint_pipeline(complaint_id: uuid.UUID, raw_files: list, user_id: uuid.UUID):
    """
    Asynchronous background task to enrich weather, run image analysis,
    recalculate severity score, refresh hotspots, transition status, and notify the user.
    """
    from app.database.session import SessionLocal
    from app.services.weather_service import weather_service
    from app.services.hotspot_service import hotspot_service
    from app.services.severity_service import severity_service
    from app.api.v1.routers.admin import load_system_settings
    from app.services.storage_service import storage_service
    from app.models.complaint import Complaint
    from app.models.municipality import Municipality
    
    db = SessionLocal()
    try:
        logger.info(f"[verify_complaint_pipeline] Starting verification for complaint={complaint_id}")
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            logger.error(f"[verify_complaint_pipeline] Complaint not found: {complaint_id}")
            return
            
        # 0. Upload files and populate image_data_list in the background thread
        image_data_list = []
        for filename, content, content_type in raw_files:
            try:
                logger.info(f"[verify_complaint_pipeline] Uploading file={filename} to storage")
                attachment = storage_service.upload_attachment(
                    db=db,
                    complaint_id=complaint_id,
                    file_content=content,
                    filename=filename,
                    content_type=content_type or "image/jpeg",
                    file_size_bytes=len(content)
                )
                if attachment.file_type == "image":
                    image_data_list.append((attachment.id, content, content_type or "image/jpeg"))
            except Exception as e:
                logger.exception(f"[verify_complaint_pipeline] File upload failed for {filename}: {e}")
            
        # Refresh local DB session copy of complaint to catch relations
        db.refresh(complaint)

        # 1. Weather enrichment
        try:
            weather_service.enrich_complaint(db, complaint)
            logger.info(f"[verify_complaint_pipeline] Weather enriched for complaint={complaint_id}")
        except Exception as e:
            logger.exception(f"[verify_complaint_pipeline] Weather enrichment failed: {e}")
            
        # 2. Image analysis (pollution & Gemini vision)
        for attachment_id, image_content, content_type in image_data_list:
            try:
                logger.info(f"[verify_complaint_pipeline] Analyzing image attachment={attachment_id}")
                complaint = complaint_service.apply_image_analysis_to_complaint(
                    db=db,
                    complaint=complaint,
                    image_content=image_content,
                    content_type=content_type
                )
            except Exception as e:
                logger.exception(f"[verify_complaint_pipeline] Image analysis failed for attachment={attachment_id}: {e}")
                
        # 3. Fallback severity calculation if no images analyzed
        if not image_data_list:
            try:
                complaint = severity_service.calculate_and_apply(db, complaint)
                logger.info(f"[verify_complaint_pipeline] Baseline severity calculated for complaint={complaint_id}")
            except Exception as e:
                logger.exception(f"[verify_complaint_pipeline] Baseline severity calculation failed: {e}")
                
        # 4. Refresh hotspots
        try:
            hotspot_service.refresh_for_complaint(db, complaint)
            logger.info(f"[verify_complaint_pipeline] Hotspots refreshed for complaint={complaint_id}")
        except Exception as e:
            logger.exception(f"[verify_complaint_pipeline] Hotspot refresh failed: {e}")
            
        # 5. Transition to AI_VALIDATION_COMPLETED
        complaint.status = ComplaintStatus.AI_VALIDATION_COMPLETED.value
        complaint.updated_at = datetime.now(timezone.utc)
        db.add(complaint)
        db.commit()
        
        complaint_service._add_status_history_entry(
            db, 
            complaint.id, 
            ComplaintStatus.AI_VALIDATION_COMPLETED.value, 
            "AI verification completed successfully", 
            user_id
        )
        complaint_service._dispatch_notification_hook(db, complaint, "AI_VALIDATION_COMPLETED")
        logger.info(f"[verify_complaint_pipeline] Complaint={complaint_id} transitioned to AI_VALIDATION_COMPLETED")
        
        # 6. Check auto-forward toggle
        settings = load_system_settings(db)
        auto_forward = settings.get("general", {}).get("autoForwardToMunicipality", False)
        
        if auto_forward:
            logger.info(f"[verify_complaint_pipeline] Auto-forward enabled, forwarding complaint={complaint_id}")
            # Assign a default active municipality if none exists
            if not complaint.municipality_id:
                default_mun = db.query(Municipality).filter(Municipality.is_active == True).first()
                if default_mun:
                    complaint.municipality_id = default_mun.id
                    db.add(complaint)
                    db.commit()
                    logger.info(f"[verify_complaint_pipeline] Assigned default municipality={default_mun.name} to complaint={complaint_id}")
            
            complaint.status = ComplaintStatus.MUNICIPALITY_ACCEPTED.value
            complaint.updated_at = datetime.now(timezone.utc)
            db.add(complaint)
            db.commit()
            
            complaint_service._add_status_history_entry(
                db,
                complaint.id,
                ComplaintStatus.MUNICIPALITY_ACCEPTED.value,
                "Complaint automatically forwarded to municipality",
                user_id
            )
            complaint_service._dispatch_notification_hook(db, complaint, "MUNICIPALITY_ACCEPTED")
            logger.info(f"[verify_complaint_pipeline] Complaint={complaint_id} auto-forwarded to municipality")
            
    except Exception as e:
        logger.exception(f"[verify_complaint_pipeline] Error in background verification: {e}")
    finally:
        db.close()

complaint_service = ComplaintService()
