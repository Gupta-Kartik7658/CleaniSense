import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session, joinedload

from app.models.user import User
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintResponse
from app.repositories.complaint import complaint_repository
from app.services.complaint_service import complaint_service
from app.services.complaint_cluster_service import complaint_cluster_service
from app.services.hotspot_service import hotspot_service
from app.services.notification_service import notification_service
from app.services.preference_service import preference_service
from app.constants.enums import ComplaintStatus, UserRole

class DashboardService:
    def get_dashboard_data(
        self,
        db: Session,
        current_user: User,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> dict:
        """
        Orchestrates summary dashboard metrics based on the authenticated user's role.
        """
        if current_user.role == UserRole.CITIZEN.value:
            user_id = current_user.id
            # 1. Fetch counts
            status_counts = complaint_repository.count_by_status(db, user_id=user_id)
            total_reports = sum(status_counts.values())
            resolved_reports = status_counts.get(ComplaintStatus.RESOLVED.value, 0)
            
            active_statuses = [
                ComplaintStatus.SUBMITTED.value,
                ComplaintStatus.AI_VALIDATION_COMPLETED.value,
                ComplaintStatus.MUNICIPALITY_ACCEPTED.value,
                ComplaintStatus.OFFICER_ASSIGNED.value,
                ComplaintStatus.IN_PROGRESS.value,
                ComplaintStatus.INSPECTION_COMPLETED.value
            ]
            active_reports = sum(status_counts.get(status, 0) for status in active_statuses)

            # 2. Get all complaints within the last 14 days for the dashboard

            two_weeks_ago = datetime.utcnow() - timedelta(days=14)
            week_complaints = db.query(Complaint).options(
                joinedload(Complaint.user)
            ).filter(
                Complaint.user_id == user_id,
                Complaint.is_deleted == False,
                Complaint.created_at >= two_weeks_ago
            ).order_by(Complaint.created_at.desc()).all()

            # Fallback for admins testing citizen view who might have no personal complaints
            if not week_complaints and current_user.role != UserRole.CITIZEN.value:
                week_complaints = db.query(Complaint).options(
                    joinedload(Complaint.user)
                ).filter(
                    Complaint.is_deleted == False,
                    Complaint.created_at >= two_weeks_ago
                ).order_by(Complaint.created_at.desc()).all()

            recent_items = []
            for c in week_complaints:
                try:
                    recent_items.append(ComplaintResponse.model_validate(c).model_dump())
                except Exception as ex:
                    logger.error(f"Error validating complaint {c.id} for dashboard: {ex}")

            # 3. Handle coordinates fallback
            if latitude is None or longitude is None:
                latest_complaint = db.query(Complaint).filter(
                    Complaint.user_id == user_id,
                    Complaint.is_deleted == False
                ).order_by(Complaint.created_at.desc()).first()
                if latest_complaint and latest_complaint.latitude and latest_complaint.longitude:
                    latitude = latest_complaint.latitude
                    longitude = latest_complaint.longitude

            # 4. Proximity hotspots (only hotspots near their reported incidents)
            user_complaints = db.query(Complaint).filter(
                Complaint.user_id == user_id,
                Complaint.is_deleted == False,
                Complaint.latitude.isnot(None),
                Complaint.longitude.isnot(None)
            ).all()

            from app.services.hotspot_service import haversine
            all_hotspots = hotspot_service.list_hotspots(db=db)
            nearby_hotspots_list = []
            for h in all_hotspots:
                is_near = False
                for c in user_complaints:
                    if haversine(c.longitude, c.latitude, h.longitude, h.latitude) <= 5.0:
                        is_near = True
                        break
                if is_near:
                    nearby_hotspots_list.append(h)

            nearby_hotspots_count = len(nearby_hotspots_list)
            nearby_hotspots_list = nearby_hotspots_list[:3]

            # 5. Notifications
            unread_notifications = notification_service.count_unread(db, user_id)

            # 6. Preferences
            prefs = preference_service.get_or_create_preferences(db, user_id)

            # 7. System-wide Map clustering for Citizen Dashboard
            complaint_map = complaint_cluster_service.get_all_complaint_map(db)

            return {
                "overview": {
                    "total_reports": total_reports,
                    "active_reports": active_reports,
                    "resolved_reports": resolved_reports,
                    "nearby_hotspots": nearby_hotspots_count
                },
                "recent_reports": recent_items,
                "nearby_hotspots": nearby_hotspots_list,
                "complaint_map": complaint_map,
                "unread_notifications": unread_notifications,
                "preferences": {
                    "language": prefs.language,
                    "theme": prefs.theme,
                    "notifications_enabled": prefs.notifications_enabled
                }
            }
        else:
            # Lightweight Municipal/Admin Dashboard Summary orchestration
            municipality_id = current_user.municipality_id
            
            overview = complaint_service.get_municipal_overview(db, municipality_id)
            recent_activity = complaint_service.get_recent_municipal_activity(db, municipality_id)
            
            # Fetch 14-day complaints for recent reports in admin view as serialized dicts
            two_weeks_ago = datetime.utcnow() - timedelta(days=14)
            admin_complaints = db.query(Complaint).options(
                joinedload(Complaint.user)
            ).filter(
                Complaint.is_deleted == False,
                Complaint.created_at >= two_weeks_ago
            ).order_by(Complaint.created_at.desc()).all()
            
            recent_reports_serialized = []
            for c in admin_complaints:
                try:
                    recent_reports_serialized.append(ComplaintResponse.model_validate(c).model_dump())
                except Exception:
                    pass

            complaint_map = complaint_cluster_service.get_user_complaint_map(db, current_user.id)
            nearby_h = hotspot_service.list_hotspots(db)
            
            return {
                "overview": overview,
                "recent_complaints": recent_reports_serialized,
                "recent_reports": recent_reports_serialized,
                "recent_activity": recent_activity,
                "complaint_map": complaint_map,
                "nearby_hotspots": nearby_h
            }

dashboard_service = DashboardService()
