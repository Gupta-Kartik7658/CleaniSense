from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status

from app.schemas.pollution_image import (
    GeminiScoreDebugResponse,
    ImageSeverityDebugResponse,
    OpenCvScoreDebugResponse,
    PollutionImageAnalysisResponse,
    PollutionImageSummaryResponse,
    PollutionImageType,
    PollutionImageTypeOption,
)
from app.core.config import settings
from app.services.pollution_image_service import pollution_image_service
from app.services.gemini_vision_service import gemini_vision_service
from app.services.severity_service import severity_service
from app.utils.file_validation import validate_image_file
from app.utils.response import StandardResponseModel, standard_response


router = APIRouter(prefix="/image-analysis", tags=["image-analysis"])


POLLUTION_IMAGE_TYPE_OPTIONS = [
    PollutionImageTypeOption(
        value=PollutionImageType.SMOKE,
        label="Smoke",
        swagger_value=PollutionImageType.SMOKE.value,
        use_for="Visible smoke from burning, industrial emissions, vehicles, or fire-like pollution.",
        image_detection_supported=True,
    ),
    PollutionImageTypeOption(
        value=PollutionImageType.DUST_HAZE,
        label="Dust / Haze",
        swagger_value=PollutionImageType.DUST_HAZE.value,
        use_for="Construction dust, dusty roads, smog, haze, or visibly poor air clarity.",
        image_detection_supported=True,
    ),
    PollutionImageTypeOption(
        value=PollutionImageType.GARBAGE_ACCUMULATION,
        label="Garbage Accumulation",
        swagger_value=PollutionImageType.GARBAGE_ACCUMULATION.value,
        use_for="Solid waste, dumping, trash piles, litter accumulation, or land pollution.",
        image_detection_supported=True,
    ),
    PollutionImageTypeOption(
        value=PollutionImageType.WATER_CONTAMINATION,
        label="Water Contamination",
        swagger_value=PollutionImageType.WATER_CONTAMINATION.value,
        use_for="Polluted water body, algae-like contamination, chemical tint, foam, or dirty water.",
        image_detection_supported=True,
    ),
    PollutionImageTypeOption(
        value=PollutionImageType.WASTEWATER_SEWERAGE,
        label="Wastewater / Sewerage",
        swagger_value=PollutionImageType.WASTEWATER_SEWERAGE.value,
        use_for="Open drains, sewage overflow, wastewater discharge, or sewerage contamination.",
        image_detection_supported=True,
    ),
    PollutionImageTypeOption(
        value=PollutionImageType.NOISE_POLLUTION,
        label="Noise Pollution",
        swagger_value=PollutionImageType.NOISE_POLLUTION.value,
        use_for="Noise complaints. Still images cannot verify sound, so image severity is forced to zero.",
        image_detection_supported=False,
    ),
    PollutionImageTypeOption(
        value=PollutionImageType.OTHER,
        label="Other / Unknown",
        swagger_value=PollutionImageType.OTHER.value,
        use_for="Only use when the image does not fit the supported pollution types.",
        image_detection_supported=True,
    ),
]

IMAGE_TYPE_TO_CATEGORY_HINT = {
    PollutionImageType.SMOKE: "Air Pollution - smoke",
    PollutionImageType.DUST_HAZE: "Air Pollution - dust haze",
    PollutionImageType.GARBAGE_ACCUMULATION: "Waste Management - garbage accumulation",
    PollutionImageType.WATER_CONTAMINATION: "Water Contamination",
    PollutionImageType.WASTEWATER_SEWERAGE: "Wastewater / Sewerage",
    PollutionImageType.NOISE_POLLUTION: "Noise Pollution",
    PollutionImageType.OTHER: "Other",
}

VISUAL_IMAGE_TYPES = {
    PollutionImageType.SMOKE,
    PollutionImageType.DUST_HAZE,
    PollutionImageType.GARBAGE_ACCUMULATION,
    PollutionImageType.WATER_CONTAMINATION,
    PollutionImageType.WASTEWATER_SEWERAGE,
    PollutionImageType.OTHER,
}


@router.post(
    "/analyze",
    response_model=StandardResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Analyze Pollution Image",
    description="Uploads an image and returns image-only pollution severity analysis.",
)
async def analyze_pollution_image(
    file: UploadFile = File(...),
    category: Optional[str] = Query(None),
    use_gemini: bool = Query(True),
):
    """
    Analyze a single uploaded image using Gemini-gated hybrid severity by default.
    """
    content = await file.read()
    validate_image_file(
        file_size_bytes=len(content),
        content_type=file.content_type or "",
    )

    try:
        analysis = pollution_image_service.detect_pollution(content, category_name=category)
        gemini_required = bool(use_gemini and not _is_noise_category(category))
        if use_gemini:
            gemini_analysis = gemini_vision_service.analyze_image(
                image_content=content,
                mime_type=file.content_type or "image/jpeg",
                category_name=category,
                local_analysis=analysis,
            )
            if gemini_analysis:
                analysis["ai_confidence_score"] = gemini_analysis["confidence_score"]
                analysis["gemini_analysis"] = gemini_analysis
        evidence = severity_service.evaluate_image_evidence(
            image_analysis=analysis,
            category_name=category,
        )
        analysis["image_evidence"] = evidence
        if gemini_required:
            analysis["pollution_detected"] = bool(evidence["image_relevant"])
            analysis["dominant_type"] = (
                evidence["gemini_pollution_type"]
                if evidence["image_relevant"]
                else "low_signal"
            )
            analysis["severity_score"] = float(evidence["hybrid_image_score"])
            analysis["severity_label"] = severity_service._severity_label(
                float(evidence["hybrid_image_score"])
            ).title()
            analysis["ai_confidence_score"] = float(evidence["gemini_confidence_score"])
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
        ai_confidence_score=analysis["ai_confidence_score"],
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
            "gemini_analysis": analysis.get("gemini_analysis"),
            "image_evidence": analysis.get("image_evidence"),
            "gemini_skipped_reason": (
                gemini_vision_service.last_error
                if use_gemini and not analysis.get("gemini_analysis")
                else None
            ),
            "filename": file.filename,
            "content_type": file.content_type,
        },
    )


@router.get(
    "/categories",
    response_model=StandardResponseModel,
    status_code=status.HTTP_200_OK,
    summary="List Image Analysis Pollution Types",
    description=(
        "Lists the exact `image_type` values accepted by the image scoring debug endpoint. "
        "Use these values in Swagger UI or multipart form requests."
    ),
)
def list_image_analysis_categories():
    return standard_response(
        success=True,
        message="Image analysis categories retrieved successfully",
        data={
            "image_type_values": [option.model_dump() for option in POLLUTION_IMAGE_TYPE_OPTIONS],
            "example_multipart_fields": {
                "file": "Upload a JPEG, PNG, or WebP image file",
                "image_type": PollutionImageType.GARBAGE_ACCUMULATION.value,
                "use_gemini": True,
            },
            "curl_example": (
                'curl -X POST "http://localhost:8000/api/v1/image-analysis/score-debug" '
                '-F "image_type=garbage_accumulation" '
                '-F "use_gemini=true" '
                '-F "file=@sample.jpg;type=image/jpeg"'
            ),
        },
    )


@router.post(
    "/score-debug",
    response_model=StandardResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Debug OpenCV vs Gemini Image Severity Scores",
    description=(
        "Upload one image and choose an `image_type` from the dropdown. "
        "The response separates OpenCV raw/gated severity from Gemini raw/gated severity, "
        "so you can verify which engine is producing a bad score. "
        "\n\nAccepted image_type values: "
        "`smoke`, `dust_haze`, `garbage_accumulation`, `water_contamination`, "
        "`wastewater_sewerage`, `noise_pollution`, `other`."
    ),
)
async def debug_image_severity_scores(
    file: UploadFile = File(..., description="JPEG, PNG, or WebP complaint image to analyze."),
    image_type: PollutionImageType = Form(
        ...,
        description=(
            "Pollution type expected in this image. Swagger UI shows these as enum values: "
            "smoke, dust_haze, garbage_accumulation, water_contamination, "
            "wastewater_sewerage, noise_pollution, other."
        ),
    ),
    use_gemini: bool = Form(True, description="Run Gemini Vision in addition to OpenCV if GEMINI_API_KEY is configured."),
    include_detector_details: bool = Form(
        False,
        description="Set true only when you want the full OpenCV detector feature dump.",
    ),
):
    content = await file.read()
    validate_image_file(
        file_size_bytes=len(content),
        content_type=file.content_type or "",
    )

    category_hint = IMAGE_TYPE_TO_CATEGORY_HINT[image_type]

    try:
        opencv_analysis = pollution_image_service.detect_pollution(
            content,
            category_name=category_hint,
        )
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to analyze image: {exc}",
        ) from exc

    gemini_analysis = None
    if use_gemini and image_type != PollutionImageType.NOISE_POLLUTION:
        gemini_analysis = gemini_vision_service.analyze_image(
            image_content=content,
            mime_type=file.content_type or "image/jpeg",
            category_name=category_hint,
            local_analysis=opencv_analysis,
        )

    opencv_match = _opencv_matches_requested_type(opencv_analysis, image_type)
    gemini_match = _gemini_matches_requested_type(gemini_analysis, image_type)
    gemini_required = bool(
        use_gemini
        and image_type != PollutionImageType.NOISE_POLLUTION
    )
    evidence_input = dict(opencv_analysis)
    if gemini_analysis:
        evidence_input["gemini_analysis"] = gemini_analysis
    hybrid_evidence = severity_service.evaluate_image_evidence(
        image_analysis=evidence_input,
        category_name=category_hint,
        requested_type=image_type.value,
    )
    image_relevant = bool(hybrid_evidence["image_relevant"] if gemini_required else opencv_match)

    if image_type == PollutionImageType.NOISE_POLLUTION:
        image_relevant = False
        relevance_reason = "Noise pollution cannot be verified from a still image; image severity is forced to 0."
    elif gemini_required and not gemini_analysis:
        image_relevant = False
        relevance_reason = (
            "Gemini verification was required but did not return a usable result. "
            "OpenCV raw scores are shown for debugging only and are not allowed to certify this image."
        )
    elif image_relevant:
        relevance_reason = (
            "Gemini verified visual pollution evidence matching the requested image_type."
            if gemini_required
            else "OpenCV found visual pollution evidence matching the requested image_type."
        )
    else:
        relevance_reason = (
            "No reliable matching visual pollution evidence was found. "
            "Do not let weather or survey inputs raise complaint severity until image evidence is valid."
        )

    opencv_raw_score = float(opencv_analysis.get("severity_score") or 0.0)
    opencv_gated_score = opencv_raw_score if opencv_match else 0.0

    gemini_raw_score = (
        float(gemini_analysis.get("severity_score") or 0.0)
        if gemini_analysis
        else None
    )
    gemini_gated_score = (
        gemini_raw_score
        if gemini_analysis and gemini_match and gemini_raw_score is not None
        else None
    )

    usable_scores = [opencv_gated_score]
    if gemini_gated_score is not None:
        usable_scores.append(gemini_gated_score)
    recommended_image_score = (
        float(hybrid_evidence["hybrid_image_score"])
        if gemini_required and image_relevant
        else round(sum(usable_scores) / len(usable_scores), 2) if image_relevant else 0.0
    )

    if not use_gemini:
        skipped_reason = "Gemini disabled for this request."
    elif not settings.GEMINI_ENABLED or not settings.GEMINI_API_KEY:
        skipped_reason = "Gemini is not configured or GEMINI_ENABLED is false."
    elif image_type == PollutionImageType.NOISE_POLLUTION:
        skipped_reason = "Gemini image verification skipped for noise pollution."
    elif not gemini_analysis:
        skipped_reason = gemini_vision_service.last_error or "Gemini did not return a usable response."
    else:
        skipped_reason = None

    response = ImageSeverityDebugResponse(
        filename=file.filename,
        content_type=file.content_type,
        requested_image_type=image_type,
        category_hint_sent_to_models=category_hint,
        image_relevant=image_relevant,
        relevance_reason=relevance_reason,
        recommended_image_severity_score=recommended_image_score,
        should_apply_weather_and_survey_scores=image_relevant,
        score_summary={
            "requested_type": image_type.value,
            "image_relevant": image_relevant,
            "opencv_raw": round(opencv_raw_score, 2),
            "opencv_after_type_gate": round(opencv_gated_score, 2),
            "gemini_raw": round(gemini_raw_score, 2) if gemini_raw_score is not None else None,
            "gemini_after_type_gate": round(gemini_gated_score, 2) if gemini_gated_score is not None else None,
            "opencv_agrees_with_gemini": (
                hybrid_evidence["opencv_agrees_with_gemini"] if gemini_analysis else None
            ),
            "hybrid_image_score": hybrid_evidence["hybrid_image_score"] if gemini_required else None,
            "gate_reason": (
                hybrid_evidence["gate_reason"]
                if gemini_required
                else "OpenCV-only debug mode; Gemini semantic gate was not required."
            ),
            "final_recommended_image_score": recommended_image_score,
        },
        opencv=OpenCvScoreDebugResponse(
            requested_image_type=image_type,
            pollution_detected=bool(opencv_analysis.get("pollution_detected")),
            dominant_type=str(opencv_analysis.get("dominant_type") or "unknown"),
            raw_severity_score=opencv_raw_score,
            gated_severity_score=round(opencv_gated_score, 2),
            local_confidence_score=float(opencv_analysis.get("ai_confidence_score") or 0.0),
            severity_label=str(opencv_analysis.get("severity_label") or "Normal"),
            detector_scores=(opencv_analysis.get("detectors") or {}) if include_detector_details else {},
        ),
        gemini=GeminiScoreDebugResponse(
            enabled=bool(use_gemini and settings.GEMINI_ENABLED and settings.GEMINI_API_KEY),
            returned=bool(gemini_analysis),
            pollution_type=gemini_analysis.get("pollution_type") if gemini_analysis else None,
            confidence_score=gemini_analysis.get("confidence_score") if gemini_analysis else None,
            severity_score=gemini_raw_score,
            gated_severity_score=round(gemini_gated_score, 2) if gemini_gated_score is not None else None,
            severity_label=gemini_analysis.get("severity_label") if gemini_analysis else None,
            environmental_description=gemini_analysis.get("environmental_description") if gemini_analysis else None,
            verification_notes=gemini_analysis.get("verification_notes") if gemini_analysis else None,
            model=gemini_analysis.get("model") if gemini_analysis else settings.GEMINI_MODEL,
            skipped_reason=skipped_reason,
        ),
        valid_image_type_examples=POLLUTION_IMAGE_TYPE_OPTIONS,
    )

    return standard_response(
        success=True,
        message="Image severity debug scores calculated successfully",
        data=response.model_dump(),
    )


def _opencv_matches_requested_type(
    opencv_analysis: dict,
    image_type: PollutionImageType,
) -> bool:
    if image_type not in VISUAL_IMAGE_TYPES or image_type == PollutionImageType.OTHER:
        return bool(opencv_analysis.get("pollution_detected"))
    return bool(
        opencv_analysis.get("pollution_detected")
        and opencv_analysis.get("dominant_type") == image_type.value
    )


def _gemini_matches_requested_type(
    gemini_analysis: Optional[dict],
    image_type: PollutionImageType,
) -> bool:
    if not gemini_analysis or image_type == PollutionImageType.NOISE_POLLUTION:
        return False
    pollution_type = str(gemini_analysis.get("pollution_type") or "none")
    confidence = float(gemini_analysis.get("confidence_score") or 0.0)
    if pollution_type == "none" or confidence < 35.0:
        return False
    if image_type == PollutionImageType.OTHER:
        return pollution_type != "none"
    return pollution_type == image_type.value


def _is_noise_category(category: Optional[str]) -> bool:
    return "noise" in (category or "").lower()
