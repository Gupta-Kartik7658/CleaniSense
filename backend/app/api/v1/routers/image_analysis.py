from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.pollution_image import (
    PollutionImageAnalysisResponse,
    PollutionImageSummaryResponse,
)
from app.services.pollution_image_service import pollution_image_service
from app.utils.file_validation import validate_image_file
from app.utils.response import StandardResponseModel, standard_response


router = APIRouter(prefix="/image-analysis", tags=["image-analysis"])


@router.post(
    "/analyze",
    response_model=StandardResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Analyze Pollution Image",
    description="Uploads an image and returns image-only pollution severity analysis.",
)
async def analyze_pollution_image(file: UploadFile = File(...)):
    """
    Analyze a single uploaded image using classical computer-vision heuristics only.
    """
    content = await file.read()
    validate_image_file(
        file_size_bytes=len(content),
        content_type=file.content_type or "",
    )

    try:
        analysis = pollution_image_service.detect_pollution(content)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to analyze image: {exc}",
        ) from exc

    summary = PollutionImageSummaryResponse(
        pollution_detected=analysis["pollution_detected"],
        dominant_type=analysis["dominant_type"],
        severity_score=analysis["severity_score"],
        severity_label=analysis["severity_label"],
        supported_pollution_types=analysis["metadata"]["supported_pollution_types"],
        image_shape=list(analysis["metadata"]["image_shape"]),
    )
    detailed = PollutionImageAnalysisResponse.model_validate(analysis)

    return standard_response(
        success=True,
        message="Image analyzed successfully",
        data={
            "summary": summary.model_dump(),
            "analysis": detailed.model_dump(),
            "filename": file.filename,
            "content_type": file.content_type,
        },
    )
