import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.complaint import Complaint
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

            # 2. Get recent complaints
            recent_items = complaint_service.get_history(
                db=db,
                current_user=current_user,
                page=1,
                page_size=5
            )["items"]

            # 3. Handle coordinates fallback
            if latitude is None or longitude is None:
                latest_complaint = db.query(Complaint).filter(
                    Complaint.user_id == user_id,
                    Complaint.is_deleted == False
                ).order_by(Complaint.created_at.desc()).first()
                if latest_complaint and latest_complaint.latitude and latest_complaint.longitude:
                    latitude = latest_complaint.latitude
                    longitude = latest_complaint.longitude

            # 4. Proximity hotspots
            nearby_h = hotspot_service.list_hotspots(
                db=db,
                latitude=latitude,
                longitude=longitude,
                radius_km=5.0
            )
            nearby_hotspots_list = nearby_h[:3]
            nearby_hotspots_count = len(nearby_h)

            # 5. Notifications
            unread_notifications = notification_service.count_unread(db, user_id)

            # 6. Preferences
            prefs = preference_service.get_or_create_preferences(db, user_id)

            # 7. Map clustering
            complaint_map = complaint_cluster_service.get_user_complaint_map(db, user_id)

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
            
            # Delegate entirely to sub-service queries (No SQL queries or calculations here)
            overview = complaint_service.get_municipal_overview(db, municipality_id)
            recent_complaints = complaint_service.get_recent_municipal_complaints(db, municipality_id)
            recent_activity = complaint_service.get_recent_municipal_activity(db, municipality_id)
            
            return {
                "overview": overview,
                "recent_complaints": recent_complaints,
                "recent_activity": recent_activity
            }

dashboard_service = DashboardService()
