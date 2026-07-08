import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base_class import Base
from app.constants.enums import ComplaintStatus

class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("complaint_categories.id"), nullable=False, index=True)
    municipality_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("municipalities.id"), nullable=True, index=True)
    
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default=ComplaintStatus.DRAFT.value, nullable=False, index=True)
    severity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    severity_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    image_severity_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    survey_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weather_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    density_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    severity_breakdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_analysis_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location_name: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    geo_point: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    assigned_department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    assigned_officer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Soft delete fields
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    deleted_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    category: Mapped["ComplaintCategory"] = relationship("ComplaintCategory")
    municipality: Mapped[Optional["Municipality"]] = relationship("Municipality")
    
    attachments: Mapped[List["ComplaintAttachment"]] = relationship(
        "ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan"
    )
    timeline: Mapped[List["ComplaintStatusHistory"]] = relationship(
        "ComplaintStatusHistory",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="ComplaintStatusHistory.created_at"
    )
    resolution: Mapped[Optional["ResolutionReport"]] = relationship(
        "ResolutionReport", back_populates="complaint", uselist=False, cascade="all, delete-orphan"
    )
