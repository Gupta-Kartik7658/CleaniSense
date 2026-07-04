from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid

from app.storage import get_storage_client
from app.utils.file_validation import validate_file
from app.models.complaint import Complaint
from app.models.complaint_attachment import ComplaintAttachment
from app.constants.enums import UploadSource

class StorageService:
    def __init__(self):
        # Retrieve client client backend dynamically
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
        Validates file metadata, uploads to file storage backend, and records attachment metadata in DB.
        """
        # Validate size and content MIME type
        validate_file(file_size_bytes, content_type)

        # Verify active complaint exists
        complaint = db.query(Complaint).filter(
            Complaint.id == complaint_id, 
            Complaint.is_deleted == False
        ).first()
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )

        # Limit to max 5 attachments per complaint
        if len(complaint.attachments) >= 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A complaint cannot have more than 5 attachments"
            )

        # Upload file content to storage backend
        storage_provider, storage_path, public_url = self.storage_client.upload_file(
            file_content=file_content,
            filename=filename,
            folder=f"complaints/{complaint_id}"
        )

        # Determine structural category
        file_type = "image"
        if content_type == "application/pdf":
            file_type = "document"

        # Persist DB metadata
        db_obj = ComplaintAttachment(
            complaint_id=complaint_id,
            storage_provider=storage_provider,
            storage_path=storage_path,
            public_url=public_url,
            file_type=file_type,
            file_name=filename,
            file_size_bytes=file_size_bytes,
            upload_source=upload_source
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        return db_obj

    def purge_orphaned_attachments(self, db: Session) -> int:
        """
        Queries and deletes physical storage files belonging to soft-deleted complaints.
        Can be scheduled in a Celery/cron task periodically for cleanup.
        """
        from app.models.complaint import Complaint
        
        orphaned_attachments = db.query(ComplaintAttachment).join(
            Complaint, ComplaintAttachment.complaint_id == Complaint.id
        ).filter(
            Complaint.is_deleted == True
        ).all()

        deleted_count = 0
        for attachment in orphaned_attachments:
            try:
                # Remove from local or firebase storage
                self.storage_client.delete_file(attachment.storage_path)
                # Remove database reference
                db.delete(attachment)
                deleted_count += 1
            except Exception as e:
                import logging
                logger = logging.getLogger("uvicorn")
                logger.error(f"Error purging attachment {attachment.id} from storage: {e}")

        if deleted_count > 0:
            db.commit()
            
        return deleted_count

storage_service = StorageService()
