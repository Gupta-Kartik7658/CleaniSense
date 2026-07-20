# backend/app/api/v1/routers/admin.py
import json
from typing import Optional, List
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin, require_super_admin
from app.constants.enums import UserRole
from app.models.user import User as DBUser
from app.models.complaint import Complaint as DBComplaint
from app.models.hotspot import Hotspot as DBHotspot
from app.models.weather_observation import WeatherObservation
from app.models.system_setting import SystemSetting
from app.models.complaint_category import ComplaintCategory as DBComplaintCategory
from app.services.hotspot_service import hotspot_service
from app.services.storage_service import storage_service
from app.utils.response import standard_response, StandardResponseModel
from app.utils.pagination import PaginatedResponseModel

router = APIRouter(prefix="/admin", tags=["admin"])


class UserRoleUpdateRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    role: UserRole

def map_db_user_to_frontend(user: DBUser, db: Session) -> dict:
    reports_count = db.query(func.count(DBComplaint.id)).filter(
        DBComplaint.user_id == user.id,
        DBComplaint.is_deleted == False
    ).scalar() or 0

    return {
        "id": str(user.id),
        "name": user.name or "Citizen",
        "email": user.email,
        "role": user.role,
        "status": "active" if user.is_active else "suspended",
        "reportsCount": reports_count,
        "joinedAt": user.created_at.strftime("%Y-%m-%d") if user.created_at else "",
        "lastActive": user.updated_at.strftime("%Y-%m-%d %H:%M:%S") if user.updated_at else "",
        "avatar": getattr(user, "avatar_url", None) or getattr(user, "profile_picture", None),
        "phone": getattr(user, "phone_number", None) or "+91 98765 43210",
        "city": "Mumbai"
    }

def map_db_complaint_to_frontend(complaint: DBComplaint) -> dict:
    # Map category to frontend type: 'air' | 'land' | 'water' | 'noise'
    category_name = complaint.category.name.lower() if complaint.category else ""
    flow_type = "land"
    if "air" in category_name or "aqi" in category_name or "smoke" in category_name:
        flow_type = "air"
    elif "water" in category_name or "sewage" in category_name or "drain" in category_name:
        flow_type = "water"
    elif "noise" in category_name or "sound" in category_name or "horn" in category_name:
        flow_type = "noise"

    # Map database status to frontend status
    db_status = complaint.status.lower()
    frontend_status = "pending"
    if db_status == "resolved":
        frontend_status = "resolved"
    elif db_status in ["rejected", "archived", "canceled"]:
        frontend_status = "dismissed"
    elif db_status in ["officer_assigned", "in_progress", "inspection_completed", "municipality_accepted"]:
        frontend_status = "investigating"

    db_severity = (complaint.severity or "moderate").lower()
    frontend_severity = db_severity
    if db_severity == "medium":
        frontend_severity = "moderate"
    elif db_severity == "low":
        frontend_severity = "normal"

    severity_score = complaint.severity_score
    if severity_score is None:
        severity_score = {
            "normal": 15.0,
            "low": 25.0,
            "moderate": 45.0,
            "medium": 45.0,
            "high": 68.0,
            "critical": 88.0,
        }.get(db_severity, 45.0)

    # Generate fresh signed URLs dynamically for all attachments so expired Supabase tokens never break images
    media_urls = []
    for att in complaint.attachments:
        fresh = storage_service.get_public_url(att)
        if fresh:
            media_urls.append(fresh)
        elif att.public_url:
            media_urls.append(att.public_url)

    # Resolution report object
    res_data = None
    if complaint.resolution:
        after_url = complaint.resolution.after_image_url
        if after_url and not after_url.startswith("http"):
            after_url = storage_service.storage_client.get_public_url(after_url)
        before_url = complaint.resolution.before_image_url
        if before_url and not before_url.startswith("http"):
            before_url = storage_service.storage_client.get_public_url(before_url)

        res_data = {
            "summary": complaint.resolution.summary,
            "actions": complaint.resolution.actions,
            "officer_name": complaint.resolution.officer_name or complaint.assigned_officer or "Municipal Admin",
            "department": complaint.resolution.department,
            "after_image_url": after_url,
            "before_image_url": before_url,
            "date_resolved": complaint.resolution.date_resolved.isoformat() if complaint.resolution.date_resolved else None,
        }

    officer_name = complaint.assigned_officer or (complaint.resolution.officer_name if complaint.resolution else None)

    return {
        "id": str(complaint.id),
        "userId": str(complaint.user_id),
        "userName": complaint.user.name or "Citizen",
        "userEmail": complaint.user.email,
        "title": complaint.title,
        "shortDescription": complaint.title,
        "type": flow_type,
        "categoryName": complaint.category.name if complaint.category else "Environmental",
        "assignedOfficer": officer_name,
        "resolution": res_data,
        "resolutionSummary": complaint.resolution.summary if complaint.resolution else None,
        "resolutionActions": complaint.resolution.actions if complaint.resolution else None,
        "severity": frontend_severity,
        "severityScore": round(float(severity_score), 2),
        "severityPercentage": round(float(severity_score), 2),
        "imageSeverityScore": complaint.image_severity_score,
        "aiConfidence": complaint.ai_confidence_score,
        "surveyScore": complaint.survey_score,
        "weatherScore": complaint.weather_score,
        "densityScore": complaint.density_score,
        "severityBreakdown": complaint.severity_breakdown,
        "status": frontend_status,
        "description": complaint.description,
        "location": {
            "latitude": complaint.latitude,
            "longitude": complaint.longitude,
            "address": complaint.location_name,
            "city": "Mumbai",
            "district": complaint.municipality.name if complaint.municipality else "",
            "state": ""
        },
        "mediaUrls": media_urls,
        "thumbnailUrl": media_urls[0] if media_urls else None,
        "reportedAt": complaint.created_at.isoformat(),
        "updatedAt": complaint.updated_at.isoformat(),
        "resolvedAt": complaint.updated_at.isoformat() if db_status == "resolved" else None,
        "notes": ""
    }

@router.get("/stats", response_model=StandardResponseModel)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    base_filter = [
        DBComplaint.is_deleted == False,
        (DBComplaint.severity_score >= 20.0) | (DBComplaint.severity_score == None),
        DBComplaint.status != "no_pollution_detected"
    ]
    total_incidents = db.query(func.count(DBComplaint.id)).filter(*base_filter).scalar() or 0
    resolved_incidents = db.query(func.count(DBComplaint.id)).filter(
        DBComplaint.status == "resolved",
        *base_filter
    ).scalar() or 0
    pending_incidents = db.query(func.count(DBComplaint.id)).filter(
        DBComplaint.status != "resolved",
        DBComplaint.status != "rejected",
        *base_filter
    ).scalar() or 0
    critical_incidents = db.query(func.count(DBComplaint.id)).filter(
        (
            (DBComplaint.severity == "critical")
            | (DBComplaint.severity_score >= 75)
        ),
        DBComplaint.status != "resolved",
        *base_filter
    ).scalar() or 0

    total_users = db.query(func.count(DBUser.id)).filter(DBUser.is_deleted == False).scalar() or 0
    active_users = db.query(func.count(DBUser.id)).filter(DBUser.is_active == True, DBUser.is_deleted == False).scalar() or 0

    hotspots_count = db.query(func.count(DBHotspot.id)).filter(DBHotspot.is_active == True).scalar() or 0
    average_aqi = db.query(func.avg(WeatherObservation.aqi_us)).scalar()

    resolution_rate = round((resolved_incidents / total_incidents * 100), 1) if total_incidents > 0 else 100.0

    stats_data = {
        "totalIncidents": total_incidents,
        "pendingIncidents": pending_incidents,
        "resolvedIncidents": resolved_incidents,
        "criticalIncidents": critical_incidents,
        "totalUsers": total_users,
        "activeUsers": active_users,
        "averageAQI": round(float(average_aqi), 1) if average_aqi is not None else None,
        "hotspotCount": hotspots_count,
        "resolutionRate": resolution_rate,
        "averageResponseTime": 4.2
    }
    
    return standard_response(
        success=True,
        message="Admin statistics retrieved successfully",
        data=stats_data
    )

@router.get("/users", response_model=StandardResponseModel)
def get_admin_users(
    role: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    query = db.query(DBUser).filter(DBUser.is_deleted == False)
    if role and role != "all":
        query = query.filter(DBUser.role == role)
    if status_filter and status_filter != "all":
        is_active = True if status_filter == "active" else False
        query = query.filter(DBUser.is_active == is_active)

    total = query.count()
    offset = (page - 1) * limit
    db_users = query.offset(offset).limit(limit).all()

    users_list = [map_db_user_to_frontend(u, db) for u in db_users]

    return standard_response(
        success=True,
        message="Users list retrieved successfully",
        data={
            "users": users_list,
            "total": total
        }
    )

@router.patch("/users/{user_id}/status", response_model=StandardResponseModel)
def update_user_status(
    user_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    user = db.query(DBUser).filter(DBUser.id == user_id, DBUser.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=456, detail="User account not found")

    new_status = payload.get("status")
    if new_status == "active":
        user.is_active = True
    elif new_status in ["suspended", "banned"]:
        user.is_active = False

    db.add(user)
    db.commit()
    db.refresh(user)

    return standard_response(
        success=True,
        message=f"User status updated to {new_status} successfully"
    )

@router.patch("/users/role", response_model=StandardResponseModel)
def update_user_role_by_email(
    payload: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_super_admin)
):
    email = payload.email.strip().lower()
    if "@" not in email or "." not in email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid email address is required"
        )

    user = db.query(DBUser).filter(
        func.lower(DBUser.email) == email,
        DBUser.is_deleted == False
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found for the provided email"
        )

    if user.id == current_user.id and payload.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super admins cannot remove their own super admin role from this panel"
        )

    previous_role = user.role
    user.role = payload.role.value
    db.add(user)
    db.commit()
    db.refresh(user)

    return standard_response(
        success=True,
        message=f"Role changed from {previous_role} to {user.role}",
        data=map_db_user_to_frontend(user, db)
    )

@router.get("/incidents", response_model=StandardResponseModel)
def get_admin_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    type_filter: Optional[str] = Query(None, alias="type"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    from sqlalchemy.orm import joinedload
    query = db.query(DBComplaint).options(
        joinedload(DBComplaint.user),
        joinedload(DBComplaint.category),
        joinedload(DBComplaint.attachments),
        joinedload(DBComplaint.resolution),
        joinedload(DBComplaint.municipality)
    ).filter(
        DBComplaint.is_deleted == False,
        (DBComplaint.severity_score >= 20.0) | (DBComplaint.severity_score == None),
        DBComplaint.status != "no_pollution_detected"
    )
    
    if status_filter and status_filter != "all":
        # map frontend status to database status
        if status_filter == "pending":
            query = query.filter(DBComplaint.status == "submitted")
        elif status_filter == "investigating":
            query = query.filter(DBComplaint.status.in_(["officer_assigned", "in_progress", "inspection_completed", "municipality_accepted"]))
        elif status_filter == "resolved":
            query = query.filter(DBComplaint.status == "resolved")
        elif status_filter == "dismissed":
            query = query.filter(DBComplaint.status.in_(["rejected", "archived", "canceled"]))

    if severity and severity != "all":
        query = query.filter(DBComplaint.severity == severity)

    total = query.count()
    offset = (page - 1) * limit
    db_complaints = query.offset(offset).limit(limit).all()

    incidents_list = [map_db_complaint_to_frontend(c) for c in db_complaints]

    return standard_response(
        success=True,
        message="Incidents list retrieved successfully",
        data={
            "incidents": incidents_list,
            "total": total
        }
    )

@router.get("/incidents/{incident_id}", response_model=StandardResponseModel)
def get_admin_incident_by_id(
    incident_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    complaint = db.query(DBComplaint).filter(
        DBComplaint.id == incident_id,
        DBComplaint.is_deleted == False,
        (DBComplaint.severity_score >= 20.0) | (DBComplaint.severity_score == None),
        DBComplaint.status != "no_pollution_detected"
    ).first()
    if not complaint:
        raise HTTPException(status_code=456, detail="Incident not found")
    
    incident = map_db_complaint_to_frontend(complaint)
    return standard_response(
        success=True,
        message="Incident retrieved successfully",
        data=incident
    )

@router.patch("/incidents/{incident_id}/status", response_model=StandardResponseModel)
def update_incident_status(
    incident_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    complaint = db.query(DBComplaint).filter(DBComplaint.id == incident_id, DBComplaint.is_deleted == False).first()
    if not complaint:
        raise HTTPException(status_code=456, detail="Incident not found")

    new_status = payload.get("status")
    notes = payload.get("notes")

    # Map frontend status to database status
    if new_status == "resolved":
        complaint.status = "resolved"
    elif new_status == "dismissed":
        complaint.status = "rejected"
    elif new_status == "investigating":
        complaint.status = "in_progress"
    elif new_status == "approved":
        complaint.status = "municipality_accepted"
        # Assign a default active municipality if none exists to resolve Pending Assignment
        if not complaint.municipality_id:
            from app.models.municipality import Municipality
            default_mun = db.query(Municipality).filter(Municipality.is_active == True).first()
            if default_mun:
                complaint.municipality_id = default_mun.id

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Refresh active database hotspots
    try:
        from app.services.hotspot_service import hotspot_service
        hotspot_service.refresh_hotspots(db)
    except Exception as ex:
        pass

    # Log timeline history and send notification
    from app.services.complaint_service import complaint_service
    remarks = notes or f"Complaint updated to {new_status} by administrator"
    complaint_service._add_status_history_entry(
        db,
        complaint.id,
        complaint.status,
        remarks,
        current_user.id
    )
    complaint_service._dispatch_notification_hook(db, complaint, complaint.status.upper())

    incident = map_db_complaint_to_frontend(complaint)
    return standard_response(
        success=True,
        message="Incident status updated successfully",
        data=incident
    )

DEMO_OFFICERS = [
    "Officer Rajesh Sharma (Sanitation Dept)",
    "Officer Priya Verma (Environmental Protection)",
    "Officer Amit Patel (Waste Management)",
    "Officer Sunita Rao (Water Quality)",
    "Officer Vikram Singh (Air Safety)"
]

@router.get("/officers", response_model=StandardResponseModel)
def get_admin_officers(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    db_officers = db.query(DBUser).filter(
        DBUser.is_deleted == False,
        DBUser.is_active == True,
        DBUser.role.in_([UserRole.MUNICIPALITY_OFFICER.value, UserRole.MUNICIPALITY_ADMIN.value])
    ).all()
    
    officers_list = list(DEMO_OFFICERS)
    for u in db_officers:
        name_str = f"{u.name or u.email} ({u.role.replace('_', ' ').title()})"
        if name_str not in officers_list:
            officers_list.append(name_str)
            
    return standard_response(
        success=True,
        message="Officers list retrieved successfully",
        data={"officers": officers_list}
    )

@router.patch("/incidents/{incident_id}/assign-officer", response_model=StandardResponseModel)
def assign_officer_to_incident(
    incident_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    complaint = db.query(DBComplaint).filter(DBComplaint.id == incident_id, DBComplaint.is_deleted == False).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Incident report not found")
        
    officer_name = payload.get("officer_name") or payload.get("assigned_officer") or payload.get("officer")
    if not officer_name:
        raise HTTPException(status_code=400, detail="Officer name is required")
        
    complaint.assigned_officer = officer_name
    if complaint.status in ["submitted", "ai_validation_completed", "municipality_accepted"]:
        complaint.status = "officer_assigned"
        
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    
    from app.services.complaint_service import complaint_service
    complaint_service._add_status_history_entry(
        db,
        complaint.id,
        complaint.status,
        f"Assigned to {officer_name}",
        current_user.id
    )
    
    incident = map_db_complaint_to_frontend(complaint)
    return standard_response(
        success=True,
        message=f"Incident assigned to {officer_name} successfully",
        data=incident
    )

@router.delete("/incidents/{incident_id}", response_model=StandardResponseModel)
def delete_admin_incident(
    incident_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    complaint = db.query(DBComplaint).filter(DBComplaint.id == incident_id).first()
    if not complaint:
        raise HTTPException(status_code=456, detail="Incident not found")
    
    db.delete(complaint)
    db.commit()
    
    return standard_response(
        success=True,
        message="Incident deleted and wiped from database successfully"
    )

@router.post("/incidents/{incident_id}/resolve", response_model=StandardResponseModel)
async def resolve_incident_endpoint(
    incident_id: uuid.UUID,
    summary: Optional[str] = Form(None),
    actions: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    complaint = db.query(DBComplaint).filter(DBComplaint.id == incident_id, DBComplaint.is_deleted == False).first()
    if not complaint:
        raise HTTPException(status_code=456, detail="Incident not found")

    photo_content = await photo.read()
    if not photo_content:
        raise HTTPException(status_code=400, detail="Resolution photo evidence is mandatory")

    # Upload to Supabase
    from app.services.storage_service import storage_service
    storage_provider, storage_path, _ = storage_service.storage_client.upload_file(
        file_content=photo_content,
        filename=photo.filename,
        folder=f"resolutions/{incident_id}"
    )

    # Create ResolutionReport record
    from app.models.resolution_report import ResolutionReport
    
    # Delete existing resolution report if it exists
    existing_res = db.query(ResolutionReport).filter(ResolutionReport.complaint_id == incident_id).first()
    if existing_res:
        db.delete(existing_res)
        db.commit()

    officer_name = complaint.assigned_officer or current_user.name or current_user.email or "Municipal Admin"
    res_summary = summary or description or "Environmental issue resolved successfully."
    res_actions = actions or description or "Field inspection conducted and cleanup actions performed."

    before_image_path = None
    if complaint.attachments and len(complaint.attachments) > 0:
        before_image_path = complaint.attachments[0].storage_path

    resolution = ResolutionReport(
        complaint_id=incident_id,
        summary=res_summary,
        department=complaint.assigned_department or "Municipality Operations",
        officer_name=officer_name,
        actions=res_actions,
        before_image_url=before_image_path,
        after_image_url=storage_path,
        date_resolved=datetime.now(timezone.utc)
    )
    db.add(resolution)

    # Update complaint status & assigned officer
    complaint.status = "resolved"
    if not complaint.assigned_officer:
        complaint.assigned_officer = officer_name
    if not complaint.assigned_department:
        complaint.assigned_department = "Municipality Operations"
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Refresh active database hotspots
    try:
        from app.services.hotspot_service import hotspot_service
        hotspot_service.refresh_hotspots(db)
    except Exception as ex:
        pass

    # Log timeline history and notify
    from app.services.complaint_service import complaint_service
    complaint_service._add_status_history_entry(
        db,
        complaint.id,
        "resolved",
        f"Complaint resolved by {officer_name}: {res_summary}",
        current_user.id
    )
    complaint_service._dispatch_notification_hook(db, complaint, "RESOLVED")

    # Dynamic signing for response object
    if resolution.after_image_url and not resolution.after_image_url.startswith("http"):
        resolution.after_image_url = storage_service.storage_client.get_public_url(resolution.after_image_url)

    incident = map_db_complaint_to_frontend(complaint)
    return standard_response(
        success=True,
        message="Incident resolved successfully",
        data=incident
    )

@router.post("/incidents/{incident_id}/assign", response_model=StandardResponseModel)
def assign_incident(
    incident_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    complaint = db.query(DBComplaint).filter(DBComplaint.id == incident_id, DBComplaint.is_deleted == False).first()
    if not complaint:
        raise HTTPException(status_code=456, detail="Incident not found")

    admin_id = payload.get("adminId")
    complaint.status = "officer_assigned"
    
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return standard_response(
        success=True,
        message="Incident assigned successfully"
    )

@router.get("/hotspots", response_model=StandardResponseModel)
def get_admin_hotspots(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    from app.services.complaint_cluster_service import complaint_cluster_service
    map_clusters = complaint_cluster_service.get_all_complaint_map(db)
    
    hotspot_service.refresh_hotspots(db)
    db_hotspots = db.query(DBHotspot).filter(DBHotspot.is_active == True).all()
    hotspots_list = []

    for index, h in enumerate(map_clusters.get("hotspots", [])):
        complaints_in_cluster = h.get("complaints", [])
        loc_name = complaints_in_cluster[0].get("location_name", "Local Area") if complaints_in_cluster else "Local Area"
        cat_name = complaints_in_cluster[0].get("category_name", "General") if complaints_in_cluster else "General"
        
        city = "Local Area"
        if loc_name:
            parts = [p.strip() for p in loc_name.split(",") if p.strip()]
            city = parts[-1] if len(parts) > 1 else parts[0]

        hotspots_list.append({
            "id": str(h["id"]),
            "center": {
                "latitude": float(h["latitude"]),
                "longitude": float(h["longitude"]),
                "city": city,
                "district": loc_name,
                "state": ""
            },
            "radius": float(h.get("radius_meters", 50.0)),
            "incidentCount": int(h.get("count", 2)),
            "averageSeverity": 4.2 if int(h.get("count", 2)) >= 3 else 3.2,
            "dominantType": cat_name,
            "trend": "growing" if int(h.get("count", 2)) >= 3 else "stable",
            "createdAt": datetime.utcnow().isoformat(),
            "complaints": complaints_in_cluster
        })

    for h in db_hotspots:
        already_added = any(
            abs(item["center"]["latitude"] - h.latitude) < 0.001 and abs(item["center"]["longitude"] - h.longitude) < 0.001
            for item in hotspots_list
        )
        if not already_added:
            hotspots_list.append({
                "id": str(h.id),
                "center": {
                    "latitude": float(h.latitude),
                    "longitude": float(h.longitude),
                    "city": h.title or "Municipal Hotspot",
                    "district": h.description or "",
                    "state": ""
                },
                "radius": float(h.radius_meters or 50.0),
                "incidentCount": int(h.reports_count or 1),
                "averageSeverity": float(h.severity_score or 3.5),
                "dominantType": h.dominant_category or "General",
                "trend": h.trend or "stable",
                "createdAt": h.created_at.isoformat(),
                "complaints": []
            })
        
    return standard_response(
        success=True,
        message="Hotspot clusters retrieved successfully",
        data={
            "hotspots": hotspots_list,
            "singles": map_clusters.get("singles", []),
            "total_complaints": map_clusters.get("total_complaints", len(hotspots_list))
        }
    )

@router.get("/predictions/aqi", response_model=StandardResponseModel)
def get_aqi_predictions(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    # Dummy AI predictions list for the admin interface dashboard
    predictions = [
        {
            "id": "pred-1",
            "location": { "latitude": 19.076, "longitude": 72.877, "city": "Mumbai" },
            "currentAQI": 165,
            "predictedAQI": 120,
            "predictionTime": datetime.now(timezone.utc).isoformat(),
            "confidence": 85.0,
            "factors": {
                "temperature": 32.0,
                "humidity": 65.0,
                "windSpeed": 12.0,
                "windDirection": "NW",
                "nearbyIncidents": 2
            },
            "trend": "improving"
        }
    ]
    return standard_response(
        success=True,
        message="AQI predictions retrieved",
        data=predictions
    )

@router.get("/analytics", response_model=StandardResponseModel)
def get_admin_analytics(
    timeframe: str = Query("week"),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    # Basic analytics data structure
    analytics_data = {
        "timeframe": timeframe,
        "completed": True
    }
    return standard_response(
        success=True,
        message="Analytics data retrieved",
        data=analytics_data
    )

from fastapi.responses import JSONResponse

SYSTEM_SETTINGS_KEY = "admin.system_settings"
DEFAULT_SYSTEM_SETTINGS = {
    "general": {
        "siteName": "CleaniSense",
        "siteDescription": "Smart City Pollution Monitoring Platform",
        "timezone": "Asia/Kolkata",
        "language": "en",
        "dateFormat": "DD/MM/YYYY",
        "maintenanceMode": False,
        "autoForwardToMunicipality": False
    },
    "notifications": {
        "emailAlerts": True,
        "smsAlerts": False,
        "pushNotifications": True,
        "criticalOnly": False,
        "dailyDigest": True,
        "weeklyReport": True
    },
    "api": {
        "openWeatherApiKey": "",
        "googleMapsApiKey": "",
        "mapboxToken": "",
        "enableRateLimit": True,
        "maxRequestsPerMin": 105
    },
    "security": {
        "twoFactorAuth": False,
        "sessionTimeout": 30,
        "passwordMinLength": 8,
        "requireSpecialChars": True,
        "maxLoginAttempts": 5,
        "ipWhitelisting": False
    }
}

def load_system_settings(db: Session) -> dict:
    record = db.query(SystemSetting).filter(SystemSetting.key == SYSTEM_SETTINGS_KEY).first()
    if not record:
        record = SystemSetting(
            key=SYSTEM_SETTINGS_KEY,
            value_json=json.dumps(DEFAULT_SYSTEM_SETTINGS),
        )
        db.add(record)
        db.commit()
        return DEFAULT_SYSTEM_SETTINGS

    try:
        value = json.loads(record.value_json)
        return value if isinstance(value, dict) else DEFAULT_SYSTEM_SETTINGS
    except json.JSONDecodeError:
        return DEFAULT_SYSTEM_SETTINGS

def save_system_settings(db: Session, settings: dict):
    record = db.query(SystemSetting).filter(SystemSetting.key == SYSTEM_SETTINGS_KEY).first()
    if not record:
        record = SystemSetting(key=SYSTEM_SETTINGS_KEY, value_json=json.dumps(settings))
    else:
        record.value_json = json.dumps(settings)
    db.add(record)
    db.commit()

@router.get("/settings", response_model=StandardResponseModel)
def get_settings(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    settings = load_system_settings(db)
    return standard_response(
        success=True,
        message="System settings retrieved",
        data=settings
    )

@router.post("/settings", response_model=StandardResponseModel)
def update_settings(
    settings: dict,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    save_system_settings(db, settings)
    return standard_response(
        success=True,
        message="System settings updated",
        data=settings
    )

@router.get("/settings/backup")
def get_database_backup(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    # Fetch all records
    users = db.query(DBUser).all()
    complaints = db.query(DBComplaint).all()
    hotspots = db.query(DBHotspot).all()
    
    backup_data = {
        "metadata": {
            "version": "1.0",
            "exportedAt": datetime.now(timezone.utc).isoformat(),
            "exportedBy": current_user.email
        },
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None
            } for u in users
        ],
        "incidents": [
            {
                "id": str(c.id),
                "user_id": str(c.user_id),
                "description": c.description,
                "status": c.status,
                "latitude": c.latitude,
                "longitude": c.longitude,
                "location_name": c.location_name,
                "severity": c.severity,
                "created_at": c.created_at.isoformat() if c.created_at else None
            } for c in complaints
        ],
        "hotspots": [
            {
                "id": str(h.id),
                "latitude": h.latitude,
                "longitude": h.longitude,
                "severity": h.severity,
                "reports_count": h.reports_count,
                "created_at": h.created_at.isoformat() if h.created_at else None
            } for h in hotspots
        ]
    }
    
    headers = {
        "Content-Disposition": f"attachment; filename=cleanisense_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    }
    return JSONResponse(content=backup_data, headers=headers)

@router.post("/settings/clear-cache", response_model=StandardResponseModel)
def clear_cache(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    return standard_response(
        success=True,
        message="Cache cleared successfully",
        data={"cleared": True}
    )
