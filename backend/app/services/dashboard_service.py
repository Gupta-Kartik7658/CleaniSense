import uuid
from typing import Optional
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.repositories.complaint import complaint_repository
from app.services.complaint_cluster_service import complaint_cluster_service
from app.services.hotspot_service import hotspot_service
from app.services.notification_service import notification_service
from app.services.preference_service import preference_service
from app.constants.enums import ComplaintStatus

class DashboardService:
    def get_dashboard_data(
        self,
        db: Session,
        user_id: uuid.UUID,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> dict:
        """
        Orchestrates stats counts, recent reports, nearby hotspots, 
        unread notifications count, and preferences into a single response.
        """
        # Fetch complaints counts grouped by status
        status_counts = complaint_repository.count_by_status(db, user_id)
        
        # Calculate stats
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

        # Get recent active reports (limit 5)
        recent_items = db.query(Complaint).filter(
            Complaint.user_id == user_id,
            Complaint.is_deleted == False
        ).order_by(desc(Complaint.created_at)).limit(5).all()

        # Fallback to coordinates of user's most recent active complaint if not provided
        if latitude is None or longitude is None:
            latest_complaint = db.query(Complaint).filter(
                Complaint.user_id == user_id,
                Complaint.is_deleted == False
            ).order_by(desc(Complaint.created_at)).first()
            if latest_complaint and latest_complaint.latitude and latest_complaint.longitude:
                latitude = latest_complaint.latitude
                longitude = latest_complaint.longitude

        # Proximity-based hotspot list
        nearby_h = hotspot_service.list_hotspots(
            db=db,
            latitude=latitude,
            longitude=longitude,
            radius_km=5.0
        )
        
        # Limit list output to 3 items, count represents total nearby
        nearby_hotspots_list = nearby_h[:3]
        nearby_hotspots_count = len(nearby_h)

        # Unread notifications count
        unread_notifications = notification_service.count_unread(db, user_id)

        # Retrieve user preferences
        prefs = preference_service.get_or_create_preferences(db, user_id)

        # Geospatial complaint map with 50m hotspot clustering
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

dashboard_service = DashboardService()
