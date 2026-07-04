from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintUpdate,
    ComplaintResponse,
    ComplaintDetailResponse,
    AttachmentResponse,
    ResolutionResponse
)
from app.services.complaint_service import complaint_service
from app.services.storage_service import storage_service
from app.utils.response import standard_response, StandardResponseModel
from app.utils.pagination import PaginatedResponseModel

router = APIRouter(prefix="/complaints", tags=["complaints"])

@router.post("", response_model=StandardResponseModel, status_code=status.HTTP_201_CREATED, summary="Submit Environmental Complaint", description="Registers a new environmental incident report in the system.")
def create_complaint(
    complaint_in: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a new environmental complaint.
    """
    complaint = complaint_service.create_complaint(db, complaint_in, current_user.id)
    complaint_data = ComplaintResponse.model_validate(complaint)
    return standard_response(
        success=True,
        message="Complaint submitted successfully",
        data=complaint_data
    )

@router.get("", response_model=StandardResponseModel, summary="List User Complaints", description="Retrieves a paginated list of environmental complaints submitted by the authenticated user with optional status, category, search, and sort filters.")
def list_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's complaints with basic pagination and advanced filtering.
    """
    paginated_data = complaint_service.get_history(
        db=db,
        user_id=current_user.id,
        status_filter=status_filter,
        category_id=category_id,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )
    paginated_data["items"] = [ComplaintResponse.model_validate(item) for item in paginated_data["items"]]
    return standard_response(
        success=True,
        message="Complaints retrieved successfully",
        data=paginated_data
    )

@router.get("/{id}", response_model=StandardResponseModel, summary="Get Complaint Detail", description="Retrieves detailed information of a specific complaint including category, municipality, timeline, attachments, and resolution data.")
def get_complaint_detail(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve full complaint details including category, municipality, timeline, attachments, and resolution.
    """
    complaint = complaint_service.get_complaint(db, id, current_user.id, current_user.role)
    detail_data = ComplaintDetailResponse.model_validate(complaint)
    return standard_response(
        success=True,
        message="Complaint details retrieved successfully",
        data=detail_data
    )

@router.put("/{id}", response_model=StandardResponseModel, summary="Update Complaint Details", description="Edits draft or recently submitted complaints. Disallowed once municipality processing starts.")
def update_complaint(
    id: uuid.UUID,
    complaint_in: ComplaintUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update complaint details. Only permitted if status is 'draft' or 'submitted'.
    """
    complaint = complaint_service.update_complaint(db, id, complaint_in, current_user.id)
    complaint_data = ComplaintResponse.model_validate(complaint)
    return standard_response(
        success=True,
        message="Complaint updated successfully",
        data=complaint_data
    )

@router.delete("/{id}", response_model=StandardResponseModel, summary="Cancel / Delete Complaint", description="Soft-deletes a complaint. Disallowed once municipality processing starts.")
def cancel_complaint(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft-delete a complaint. Only permitted if status is 'draft' or 'submitted'.
    """
    complaint = complaint_service.cancel_complaint(db, id, current_user.id)
    return standard_response(
        success=True,
        message="Complaint deleted successfully",
        data={"id": complaint.id}
    )

@router.post("/{id}/attachments", response_model=StandardResponseModel, summary="Upload Complaint Attachment", description="Uploads an image or PDF attachment associated with the complaint (limit of 5 total attachments).")
async def upload_complaint_attachment(
    id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload an attachment file (image/pdf) to a complaint.
    """
    # Verify ownership of complaint before upload
    complaint = complaint_service.get_complaint(db, id, current_user.id, current_user.role)
    
    # Read file content
    content = await file.read()
    size = len(content)
    
    # Delegate upload and database persistence to storage service
    attachment = storage_service.upload_attachment(
        db=db,
        complaint_id=id,
        file_content=content,
        filename=file.filename,
        content_type=file.content_type,
        file_size_bytes=size
    )
    
    attachment_data = AttachmentResponse.model_validate(attachment)
    return standard_response(
        success=True,
        message="Attachment uploaded successfully",
        data=attachment_data
    )

@router.get("/{id}/resolution", response_model=StandardResponseModel, summary="Get Complaint Resolution Details", description="Retrieves official municipality resolution data and photos once a complaint has been resolved.")
def get_complaint_resolution(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get resolution report for a resolved complaint.
    """
    from app.constants.enums import ComplaintStatus
    
    complaint = complaint_service.get_complaint(db, id, current_user.id, current_user.role)
    if complaint.status != ComplaintStatus.RESOLVED.value or not complaint.resolution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resolution report not found for this complaint"
        )
    
    resolution_data = ResolutionResponse.model_validate(complaint.resolution)
    return standard_response(
        success=True,
        message="Resolution report retrieved successfully",
        data=resolution_data
    )
