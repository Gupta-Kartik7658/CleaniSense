import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.complaint_status_history import ComplaintStatusHistory
from app.models.complaint_category import ComplaintCategory
from app.models.municipality import Municipality
from app.repositories.complaint import complaint_repository
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate
from app.constants.enums import ComplaintStatus, UserRole

# Allowed state machine transitions mapping
ALLOWED_TRANSITIONS: Dict[str, List[str]] = {
    ComplaintStatus.DRAFT.value: [ComplaintStatus.SUBMITTED.value],
    ComplaintStatus.SUBMITTED.value: [
        ComplaintStatus.AI_VALIDATION_COMPLETED.value,
        ComplaintStatus.REJECTED.value
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
        category = db.query(ComplaintCategory).filter(
            ComplaintCategory.id == obj_in.category_id,
            ComplaintCategory.is_active == True
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected complaint category is invalid or inactive"
            )
            
        # Validate municipality existence if provided
        if obj_in.municipality_id:
            municipality = db.query(Municipality).filter(
                Municipality.id == obj_in.municipality_id,
                Municipality.is_active == True
            ).first()
            if not municipality:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected municipality is invalid or inactive"
                )

        complaint = complaint_repository.create(db, obj_in, user_id)
        
        # Add initial status timeline history entry
        # Standard status when creating is 'submitted' as citizen posts it
        # (Though they can also save as draft, let's set initial status based on request context, default submitted)
        complaint.status = ComplaintStatus.SUBMITTED.value
        db.add(complaint)
        db.commit()
        
        # Create timeline entry
        self._add_status_history_entry(db, complaint.id, complaint.status, "Complaint submitted", user_id)
        
        # Optional: trigger notification dispatch hook (will be populated in Notification Phase 6)
        self._dispatch_notification_hook(db, complaint, "SUBMITTED")

        return complaint

    def get_complaint(self, db: Session, id: uuid.UUID, user_id: uuid.UUID, user_role: str) -> Complaint:
        """
        Retrieves a complaint after validating access permissions.
        """
        complaint = complaint_repository.get(db, id)
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )
            
        # Check permissions: citizens can only view their own complaints
        if user_role == UserRole.CITIZEN.value and complaint.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this complaint"
            )
            
        return complaint

    def list_complaints(self, db: Session, user_id: uuid.UUID, page: int, page_size: int) -> dict:
        """
        Returns a paginated list of active complaints for a user.
        """
        return complaint_repository.list_by_user(db, user_id, page, page_size)

    def get_history(
        self,
        db: Session,
        user_id: uuid.UUID,
        status_filter: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20
    ) -> dict:
        """
        Returns advanced query result list for user complaint history.
        """
        # Validate status if provided
        if status_filter and status_filter not in [s.value for s in ComplaintStatus]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter value: {status_filter}"
            )
            
        return complaint_repository.list_history(
            db, user_id, status_filter, category_id, search, sort_by, sort_order, page, page_size
        )

    def update_complaint(
        self, db: Session, id: uuid.UUID, obj_in: ComplaintUpdate, user_id: uuid.UUID
    ) -> Complaint:
        """
        Updates basic details of a complaint if it is still in draft or submitted status.
        """
        complaint = complaint_repository.get(db, id)
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )
            
        # Ownership check
        if complaint.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this complaint"
            )
            
        # Restrict edit based on status
        if complaint.status not in [ComplaintStatus.DRAFT.value, ComplaintStatus.SUBMITTED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Complaints cannot be modified once they transition to state: {complaint.status}"
            )

        # Validate category if updating
        if obj_in.category_id:
            category = db.query(ComplaintCategory).filter(
                ComplaintCategory.id == obj_in.category_id,
                ComplaintCategory.is_active == True
            ).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected complaint category is invalid or inactive"
                )

        # Validate municipality if updating
        if obj_in.municipality_id:
            municipality = db.query(Municipality).filter(
                Municipality.id == obj_in.municipality_id,
                Municipality.is_active == True
            ).first()
            if not municipality:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected municipality is invalid or inactive"
                )

        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Update geo_point coordinate representation if lat/lng are updated
        if "latitude" in update_data or "longitude" in update_data:
            lat = update_data.get("latitude", complaint.latitude)
            lng = update_data.get("longitude", complaint.longitude)
            update_data["geo_point"] = f"POINT({lng} {lat})"

        return complaint_repository.update(db, complaint, update_data)

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
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this complaint"
            )
            
        # Status constraint check
        if complaint.status not in [ComplaintStatus.DRAFT.value, ComplaintStatus.SUBMITTED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Complaints cannot be deleted once they transition to state: {complaint.status}"
            )

        return complaint_repository.soft_delete(db, complaint, user_id)

    def transition_status(
        self,
        db: Session,
        id: uuid.UUID,
        next_status: str,
        remarks: Optional[str],
        changed_by: uuid.UUID,
        resolution_data: Optional[dict] = None
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{current_status}' to '{next_status}'"
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

        # Transition status
        complaint.status = next_status
        complaint.updated_at = datetime.now(timezone.utc)
        db.add(complaint)
        db.commit()
        
        # Log history entry
        self._add_status_history_entry(db, complaint.id, next_status, remarks, changed_by)
        
        # Trigger notification hook
        self._dispatch_notification_hook(db, complaint, next_status.upper())

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

complaint_service = ComplaintService()
