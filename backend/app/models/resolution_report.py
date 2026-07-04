import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base_class import Base

class ResolutionReport(Base):
    __tablename__ = "resolution_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("complaints.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    department: Mapped[str] = mapped_column(String(255), nullable=False)
    officer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    actions: Mapped[str] = mapped_column(Text, nullable=False)
    citizen_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    before_image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    after_image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    date_resolved: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="resolution")
