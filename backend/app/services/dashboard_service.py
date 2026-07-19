import uuid
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session, joinedload

logger = logging.getLogger(__name__)

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
        user_id = current_user.id
        # 1. Fetch counts strictly for the authenticated user
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

        # 2. Get user's own complaints for the dashboard (strictly owned by current_user.id)
        week_complaints = db.query(Complaint).options(
            joinedload(Complaint.user),
            joinedload(Complaint.category),
            joinedload(Complaint.resolution)
        ).filter(
            Complaint.user_id == user_id,
            Complaint.is_deleted == False
        ).order_by(Complaint.created_at.desc()).limit(20).all()

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

        # 7. Map data for Citizen Dashboard:
        # - complaint_map uses USER's own complaints (for ComplaintMapSection which shows personal pins)
        # - all_complaints_map is system-wide hotspot clusters (for HotspotSection map)
        user_complaint_map = complaint_cluster_service.get_user_complaint_map(db, user_id)
        all_complaint_map = complaint_cluster_service.get_all_complaint_map(db)

        return {
            "overview": {
                "total_reports": total_reports,
                "active_reports": active_reports,
                "resolved_reports": resolved_reports,
                "nearby_hotspots": nearby_hotspots_count
            },
            "recent_reports": recent_items,
            "nearby_hotspots": nearby_hotspots_list,
            # complaint_map = user-specific pins for personal map section
            "complaint_map": user_complaint_map,
            # hotspot_map = all system clusters for hotspot section (right column)
            "hotspot_map": all_complaint_map,
            "unread_notifications": unread_notifications,
            "preferences": {
                "language": prefs.language,
                "theme": prefs.theme,
                "notifications_enabled": prefs.notifications_enabled
            }
        }


dashboard_service = DashboardService()
