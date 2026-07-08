import uuid
from typing import List, Dict, Any
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.complaint_category import ComplaintCategory

class AnalyticsService:
    def get_status_distribution(self, db: Session, municipality_id: uuid.UUID) -> List[Dict[str, Any]]:
        """
        Returns status distribution for the municipality as frontend-ready chart arrays.
        """
        results = db.query(
            Complaint.status, func.count(Complaint.id)
        ).filter(
            Complaint.municipality_id == municipality_id,
            Complaint.is_deleted == False
        ).group_by(Complaint.status).all()
        
        return [{"label": status, "count": count} for status, count in results]

    def get_category_distribution(self, db: Session, municipality_id: uuid.UUID) -> List[Dict[str, Any]]:
        """
        Returns category distribution for the municipality as frontend-ready chart arrays.
        """
        results = db.query(
            ComplaintCategory.name, func.count(Complaint.id)
        ).join(
            ComplaintCategory, Complaint.category_id == ComplaintCategory.id
        ).filter(
            Complaint.municipality_id == municipality_id,
            Complaint.is_deleted == False
        ).group_by(ComplaintCategory.name).all()
        
        return [{"label": cat_name, "count": count} for cat_name, count in results]

    def get_severity_distribution(self, db: Session, municipality_id: uuid.UUID) -> List[Dict[str, Any]]:
        """
        Returns severity distribution for the municipality as frontend-ready chart arrays.
        """
        results = db.query(
            Complaint.severity, func.count(Complaint.id)
        ).filter(
            Complaint.municipality_id == municipality_id,
            Complaint.is_deleted == False
        ).group_by(Complaint.severity).all()
        
        # Replace None with "Unassigned" for cleaner visual labels
        return [
            {"label": severity if severity is not None else "Unassigned", "count": count}
            for severity, count in results
        ]

analytics_service = AnalyticsService()
