import logging
from typing import Optional, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form, BackgroundTasks
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

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/complaints", tags=["complaints"])

@router.post("", response_model=StandardResponseModel, status_code=status.HTTP_201_CREATED, summary="Submit Environmental Complaint", description="Registers a new environmental incident report in the system.")
async def create_complaint(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(...),
    category_id: uuid.UUID = Form(...),
    location_name: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    municipality_id: Optional[uuid.UUID] = Form(None),
    area_affected_sqm: Optional[float] = Form(None),
    population_affected: Optional[int] = Form(None),
    duration_hours: Optional[float] = Form(None),
    survey_data: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a new environmental complaint.
    """
    import json
    from app.constants.enums import ComplaintStatus
    
    logger.info(
        f"Creating async complaint — user={current_user.id} "
        f"category={category_id} title='{title[:50]}'"
    )
    
    # 1. Parse survey_data from JSON string if provided
    parsed_survey = None
    if survey_data:
        try:
            parsed_survey = json.loads(survey_data)
        except Exception:
            logger.warning(f"Failed to parse survey_data JSON string: {survey_data}")

    # 2. Build Schema input (to validate and pass to repository)
    complaint_in = ComplaintCreate(
        title=title,
        description=description,
        category_id=category_id,
        location_name=location_name,
        latitude=latitude,
        longitude=longitude,
        municipality_id=municipality_id,
        area_affected_sqm=area_affected_sqm,
        population_affected=population_affected,
        duration_hours=duration_hours,
        survey_data=parsed_survey
    )

    # 3. Validate category existence
    from app.models.complaint_category import ComplaintCategory
    category = db.query(ComplaintCategory).filter(
        ComplaintCategory.id == category_id,
        ComplaintCategory.is_active == True
    ).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected complaint category is invalid or inactive"
        )
        
    # 4. Create database complaint record immediately with "ai_verification_in_progress" status
    from app.repositories.complaint import complaint_repository
    complaint = complaint_repository.create(db, complaint_in, current_user.id)
    complaint.status = ComplaintStatus.AI_VERIFICATION_IN_PROGRESS.value
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # 5. Log initial timeline history entry
    from app.services.complaint_service import complaint_service, verify_complaint_pipeline
    complaint_service._add_status_history_entry(
        db, 
        complaint.id, 
        complaint.status, 
        "AI Verification in Progress", 
        current_user.id
    )
    
    # 6. Read attachments into memory to process asynchronously in background
    raw_files = []
    for file in files:
        content = await file.read()
        raw_files.append((file.filename, content, file.content_type))

    # 7. Queue the background AI Verification & enrichment pipeline
    background_tasks.add_task(
        verify_complaint_pipeline,
        complaint.id,
        raw_files,
        current_user.id
    )
    
    logger.info(f"Complaint saved and background pipeline queued — id={complaint.id} status={complaint.status}")
    complaint_data = ComplaintResponse.model_validate(complaint)
    
    return standard_response(
        success=True,
        message="Complaint submitted successfully, AI Verification in progress",
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
    page_size: int = Query(20, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's complaints with basic pagination and advanced filtering.
    """
    logger.info(
        f"Listing complaints — user={current_user.id} page={page} "
        f"status={status_filter} category={category_id} search='{search}'"
    )
    paginated_data = complaint_service.get_history(
        db=db,
        current_user=current_user,
        status_filter=status_filter,
        category_id=category_id,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )
    paginated_data["items"] = [ComplaintResponse.model_validate(item) for item in paginated_data["items"]]
    logger.info(f"Listed {len(paginated_data['items'])} complaints for user={current_user.id}")
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
    logger.info(f"Fetching complaint detail — id={id} user={current_user.id}")
    complaint = complaint_service.get_complaint(db, id, current_user)
    
    # Enrich resolution after_image_url dynamically if it is a Supabase storage path
    if complaint.resolution and complaint.resolution.after_image_url and not complaint.resolution.after_image_url.startswith("http"):
        complaint.resolution.after_image_url = storage_service.storage_client.get_public_url(complaint.resolution.after_image_url)

    # Refresh complaint attachments signed URLs to ensure they never expire
    for att in complaint.attachments:
        fresh = storage_service.get_public_url(att)
        if fresh:
            att.public_url = fresh

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
    logger.info(
        f"Updating complaint — id={id} user={current_user.id} "
        f"fields={complaint_in.model_dump(exclude_unset=True).keys()}"
    )
    complaint = complaint_service.update_complaint(db, id, complaint_in, current_user)
    logger.info(f"Complaint updated — id={id}")
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
    logger.info(f"Cancelling complaint — id={id} user={current_user.id}")
    complaint = complaint_service.cancel_complaint(db, id, current_user.id)
    logger.info(f"Complaint cancelled — id={id}")
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
    logger.info(
        f"Uploading attachment — complaint={id} user={current_user.id} "
        f"filename='{file.filename}' content_type='{file.content_type}'"
    )
    # Verify ownership of complaint before upload
    complaint = complaint_service.get_complaint(db, id, current_user)
    
    # Read file content
    content = await file.read()
    size = len(content)
    logger.info(f"Attachment read — size={size} bytes")
    
    # Delegate upload and database persistence to storage service
    attachment = storage_service.upload_attachment(
        db=db,
        complaint_id=id,
        file_content=content,
        filename=file.filename,
        content_type=file.content_type,
        file_size_bytes=size
    )
    
    logger.info(f"Attachment saved — id={attachment.id} provider={attachment.storage_provider}")
    if attachment.file_type == "image":
        complaint_service.apply_image_analysis_to_complaint(
        db=db,
        complaint=complaint,
        image_content=content,
        content_type=file.content_type or "image/jpeg",
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
    logger.info(f"Fetching resolution — complaint={id} user={current_user.id}")
    from app.constants.enums import ComplaintStatus
    
    complaint = complaint_service.get_complaint(db, id, current_user)
    if complaint.status != ComplaintStatus.RESOLVED.value or not complaint.resolution:
        logger.warning(f"Resolution not found — complaint={id} status={complaint.status}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resolution report not found for this complaint"
        )
    
    # Enrich resolution after_image_url & before_image_url dynamically if they are Supabase storage paths
    if complaint.resolution.after_image_url and not complaint.resolution.after_image_url.startswith("http"):
        complaint.resolution.after_image_url = storage_service.storage_client.get_public_url(complaint.resolution.after_image_url)

    if complaint.resolution.before_image_url and not complaint.resolution.before_image_url.startswith("http"):
        complaint.resolution.before_image_url = storage_service.storage_client.get_public_url(complaint.resolution.before_image_url)
    elif not complaint.resolution.before_image_url and complaint.attachments and len(complaint.attachments) > 0:
        fresh_before = storage_service.get_public_url(complaint.attachments[0])
        complaint.resolution.before_image_url = fresh_before or complaint.attachments[0].public_url

    resolution_data = ResolutionResponse.model_validate(complaint.resolution)
    return standard_response(
        success=True,
        message="Resolution report retrieved successfully",
        data=resolution_data
    )
