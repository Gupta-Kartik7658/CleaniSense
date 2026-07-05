import logging
from typing import List, Union
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid

from app.storage import get_storage_client
from app.utils.file_validation import validate_file
from app.models.complaint import Complaint
from app.models.complaint_attachment import ComplaintAttachment
from app.constants.enums import UploadSource

logger = logging.getLogger("uvicorn")


class StorageService:
    def __init__(self):
        self.storage_client = get_storage_client()

    def upload_attachment(
        self,
        db: Session,
        complaint_id: uuid.UUID,
        file_content: bytes,
        filename: str,
        content_type: str,
        file_size_bytes: int,
        upload_source: str = UploadSource.CITIZEN.value
    ) -> ComplaintAttachment:
        """
        Validates file metadata, uploads to configured storage backend,
        records only metadata in the database, and returns the ORM object
        with a freshly-generated public URL set on the Python instance.
        """
        validate_file(file_size_bytes, content_type)

        complaint = db.query(Complaint).filter(
            Complaint.id == complaint_id,
            Complaint.is_deleted == False
        ).first()
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )

        if len(complaint.attachments) >= 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A complaint cannot have more than 5 attachments"
            )

        storage_provider, storage_path, _ = self.storage_client.upload_file(
            file_content=file_content,
            filename=filename,
            folder=f"complaints/{complaint_id}"
        )

        file_type = "image"
        if content_type == "application/pdf":
            file_type = "document"

        db_obj = ComplaintAttachment(
            complaint_id=complaint_id,
            storage_provider=storage_provider,
            storage_path=storage_path,
            public_url="",
            file_type=file_type,
            file_name=filename,
            file_size_bytes=file_size_bytes,
            upload_source=upload_source
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        db_obj.public_url = self.get_public_url(db_obj)

        return db_obj

    def get_public_url(self, attachment: ComplaintAttachment) -> str:
        """
        Returns the appropriate public URL for an attachment.
        For Supabase this generates a short-lived signed URL (1 hour).
        For Local / Firebase it returns the stored URL.

        Fault-tolerant: if signed URL generation fails, the error is
        logged and an empty string is returned so the API request
        continues gracefully.
        """
        if attachment.storage_provider == "supabase":
            try:
                return self.storage_client.get_public_url(
                    attachment.storage_path,
                    expires_in=3600
                )
            except Exception as e:
                logger.error(
                    "Failed to generate signed URL for attachment %s "
                    "(path=%s, provider=%s): %s",
                    attachment.id, attachment.storage_path,
                    attachment.storage_provider, e
                )
                return ""
        return attachment.public_url

    def enrich_attachments(
        self,
        obj: Union[Complaint, List[Complaint], ComplaintAttachment, List[ComplaintAttachment]],
    ) -> None:
        """
        Generates fresh public URLs (signed URLs for Supabase) for every
        attachment reachable from *obj*. Accepts:

        * A single ``Complaint``  – enriches its ``.attachments`` list.
        * A ``list`` of ``Complaint`` – enriches each complaint's attachments.
        * A single ``ComplaintAttachment`` – enriches that attachment.
        * A ``list`` of ``ComplaintAttachment`` – enriches every item.

        Any errors during URL generation are caught and logged per
        attachment so a single failure does not crash the entire request.
        """
        attachments: List[ComplaintAttachment] = []

        if isinstance(obj, Complaint):
            attachments = obj.attachments
        elif isinstance(obj, ComplaintAttachment):
            attachments = [obj]
        elif isinstance(obj, list):
            if not obj:
                return
            if isinstance(obj[0], Complaint):
                for c in obj:
                    attachments.extend(c.attachments)
            elif isinstance(obj[0], ComplaintAttachment):
                attachments = obj

        for att in attachments:
            try:
                att.public_url = self.get_public_url(att)
            except Exception as e:
                logger.error(
                    "Failed to enrich attachment %s: %s", att.id, e
                )
                att.public_url = ""

    def purge_orphaned_attachments(self, db: Session) -> int:
        """
        Queries and deletes physical storage files belonging to
        soft-deleted complaints. Works with any storage backend.
        """
        orphaned_attachments = db.query(ComplaintAttachment).join(
            Complaint, ComplaintAttachment.complaint_id == Complaint.id
        ).filter(
            Complaint.is_deleted == True
        ).all()

        deleted_count = 0
        for attachment in orphaned_attachments:
            try:
                self.storage_client.delete_file(attachment.storage_path)
                db.delete(attachment)
                deleted_count += 1
            except Exception as e:
                logger.error(
                    "Error purging attachment %s from storage: %s",
                    attachment.id, e
                )

        if deleted_count > 0:
            db.commit()

        return deleted_count


storage_service = StorageService()
