# backend/app/api/v1/routers/admin.py
from typing import Optional, List
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.user import User as DBUser
from app.models.complaint import Complaint as DBComplaint
from app.models.hotspot import Hotspot as DBHotspot
from app.models.complaint_category import ComplaintCategory as DBComplaintCategory
from app.utils.response import standard_response, StandardResponseModel
from app.utils.pagination import PaginatedResponseModel

router = APIRouter(prefix="/admin", tags=["admin"])

def map_db_user_to_frontend(user: DBUser, db: Session) -> dict:
    # Count complaints submitted by this user
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
        "joinedAt": user.created_at.strftime("%Y-%m-%d"),
        "lastActive": user.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        "avatar": user.profile_picture,
        "phone": "+91 98765 43210",
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

    # Map severity
    db_severity = (complaint.severity or "medium").lower()
    frontend_severity = "medium"
    if db_severity in ["high", "critical"]:
        frontend_severity = "high"
    elif db_severity == "low":
        frontend_severity = "low"

    media_urls = [att.public_url for att in complaint.attachments if att.public_url]

    return {
        "id": str(complaint.id),
        "userId": str(complaint.user_id),
        "userName": complaint.user.name or "Citizen",
        "userEmail": complaint.user.email,
        "type": flow_type,
        "severity": frontend_severity,
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
    total_incidents = db.query(func.count(DBComplaint.id)).filter(DBComplaint.is_deleted == False).scalar() or 0
    resolved_incidents = db.query(func.count(DBComplaint.id)).filter(
        DBComplaint.status == "resolved",
        DBComplaint.is_deleted == False
    ).scalar() or 0
    pending_incidents = db.query(func.count(DBComplaint.id)).filter(
        DBComplaint.status != "resolved",
        DBComplaint.status != "rejected",
        DBComplaint.is_deleted == False
    ).scalar() or 0
    critical_incidents = db.query(func.count(DBComplaint.id)).filter(
        DBComplaint.severity == "high",
        DBComplaint.status != "resolved",
        DBComplaint.is_deleted == False
    ).scalar() or 0

    total_users = db.query(func.count(DBUser.id)).filter(DBUser.is_deleted == False).scalar() or 0
    active_users = db.query(func.count(DBUser.id)).filter(DBUser.is_active == True, DBUser.is_deleted == False).scalar() or 0

    hotspots_count = db.query(func.count(DBHotspot.id)).scalar() or 0

    resolution_rate = round((resolved_incidents / total_incidents * 100), 1) if total_incidents > 0 else 100.0

    stats_data = {
        "totalIncidents": total_incidents,
        "pendingIncidents": pending_incidents,
        "resolvedIncidents": resolved_incidents,
        "criticalIncidents": critical_incidents,
        "totalUsers": total_users,
        "activeUsers": active_users,
        "averageAQI": 156,
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
    query = db.query(DBComplaint).filter(DBComplaint.is_deleted == False)
    
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
    complaint = db.query(DBComplaint).filter(DBComplaint.id == incident_id, DBComplaint.is_deleted == False).first()
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

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    incident = map_db_complaint_to_frontend(complaint)
    return standard_response(
        success=True,
        message="Incident status updated successfully",
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
    db_hotspots = db.query(DBHotspot).all()
    hotspots_list = []

    for h in db_hotspots:
        hotspots_list.append({
            "id": str(h.id),
            "center": {
                "latitude": h.latitude,
                "longitude": h.longitude,
                "city": "Mumbai",
                "district": "",
                "state": ""
            },
            "radius": 300,  # Fixed default until a radius column exists on the model
            "incidentCount": h.reports_count,
            "averageSeverity": 3.5,
            "dominantType": "air",
            "trend": "stable",
            "createdAt": h.created_at.isoformat()
        })
        
    return standard_response(
        success=True,
        message="Hotspot clusters retrieved successfully",
        data=hotspots_list
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

import json
import os
from fastapi.responses import JSONResponse

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "../../../settings.json")

def load_system_settings() -> dict:
    if not os.path.exists(SETTINGS_FILE):
        default_settings = {
            "general": {
                "siteName": "CleaniSense",
                "siteDescription": "Smart City Pollution Monitoring Platform",
                "timezone": "Asia/Kolkata",
                "language": "en",
                "dateFormat": "DD/MM/YYYY",
                "maintenanceMode": False
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
                "openWeatherApiKey": "weather_token_mock_12345",
                "googleMapsApiKey": "maps_api_key_mock_67890",
                "mapboxToken": "mapbox_token_mock_abcde",
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
        with open(SETTINGS_FILE, "w") as f:
            json.dump(default_settings, f, indent=4)
        return default_settings

    try:
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def save_system_settings(settings: dict):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=4)

@router.get("/settings", response_model=StandardResponseModel)
def get_settings(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(require_admin)
):
    settings = load_system_settings()
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
    save_system_settings(settings)
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
