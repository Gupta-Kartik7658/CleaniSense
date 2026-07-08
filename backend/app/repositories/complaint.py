import json
from typing import Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.complaint_status_history import ComplaintStatusHistory
from app.schemas.complaint import ComplaintCreate
from app.utils.pagination import paginate

class ComplaintRepository:
    def get(self, db: Session, id: uuid.UUID) -> Optional[Complaint]:
        """Get single complaint by ID if not deleted."""
        return db.query(Complaint).filter(Complaint.id == id, Complaint.is_deleted == False).first()

    def get_any(self, db: Session, id: uuid.UUID) -> Optional[Complaint]:
        """Get single complaint by ID, even if deleted."""
        return db.query(Complaint).filter(Complaint.id == id).first()

    def create(self, db: Session, obj_in: ComplaintCreate, user_id: uuid.UUID) -> Complaint:
        """Create a new complaint record."""
        db_obj = Complaint(
            user_id=user_id,
            category_id=obj_in.category_id,
            municipality_id=obj_in.municipality_id,
            title=obj_in.title,
            description=obj_in.description,
            location_name=obj_in.location_name,
            latitude=obj_in.latitude,
            longitude=obj_in.longitude,
            geo_point=f"POINT({obj_in.longitude} {obj_in.latitude})",
            area_affected_sqm=obj_in.area_affected_sqm,
            population_affected=obj_in.population_affected,
            duration_hours=obj_in.duration_hours,
            survey_data=json.dumps(obj_in.survey_data) if obj_in.survey_data else None,
            is_deleted=False
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Complaint, update_data: dict) -> Complaint:
        """Update fields on a complaint."""
        for field in update_data:
            if hasattr(db_obj, field) and update_data[field] is not None:
                value = update_data[field]
                if field == "survey_data" and isinstance(value, dict):
                    value = json.dumps(value)
                setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def soft_delete(self, db: Session, db_obj: Complaint, user_id: uuid.UUID) -> Complaint:
        """Soft-delete a complaint."""
        db_obj.is_deleted = True
        db_obj.deleted_at = datetime.now(timezone.utc)
        db_obj.deleted_by = user_id
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list_by_user(self, db: Session, user_id: uuid.UUID, page: int, page_size: int) -> dict:
        """Fetch user's active complaints paginated."""
        query = db.query(Complaint).filter(
            Complaint.user_id == user_id,
            Complaint.is_deleted == False
        ).order_by(desc(Complaint.created_at))
        return paginate(query, page, page_size)

    def list_history(
        self,
        db: Session,
        user_id: Optional[uuid.UUID] = None,
        municipality_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20
    ) -> dict:
        """Advanced query filtering for user or municipal complaint history."""
        query = db.query(Complaint).filter(Complaint.is_deleted == False)

        if user_id:
            query = query.filter(Complaint.user_id == user_id)
        if municipality_id:
            query = query.filter(Complaint.municipality_id == municipality_id)

        if status:
            query = query.filter(Complaint.status == status)
        if category_id:
            query = query.filter(Complaint.category_id == category_id)
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Complaint.title.ilike(search_filter),
                    Complaint.location_name.ilike(search_filter),
                    Complaint.description.ilike(search_filter)
                )
            )

        # Handle sorting
        sort_col = getattr(Complaint, sort_by, Complaint.created_at)
        if sort_order == "asc":
            query = query.order_by(asc(sort_col))
        else:
            query = query.order_by(desc(sort_col))

        return paginate(query, page, page_size)

    def count_by_status(
        self,
        db: Session,
        user_id: Optional[uuid.UUID] = None,
        municipality_id: Optional[uuid.UUID] = None
    ) -> dict:
        """Count active complaints grouped by status."""
        from sqlalchemy import func
        query = db.query(
            Complaint.status, func.count(Complaint.id)
        ).filter(
            Complaint.is_deleted == False
        )
        if user_id:
            query = query.filter(Complaint.user_id == user_id)
        if municipality_id:
            query = query.filter(Complaint.municipality_id == municipality_id)
            
        results = query.group_by(Complaint.status).all()
        return dict(results)

    def get_recent_activity(self, db: Session, municipality_id: uuid.UUID, limit: int = 10) -> list:
        """Fetch status history logs across complaints in the municipality."""
        return db.query(ComplaintStatusHistory).join(
            Complaint, ComplaintStatusHistory.complaint_id == Complaint.id
        ).filter(
            Complaint.municipality_id == municipality_id,
            Complaint.is_deleted == False
        ).order_by(desc(ComplaintStatusHistory.created_at)).limit(limit).all()

complaint_repository = ComplaintRepository()
