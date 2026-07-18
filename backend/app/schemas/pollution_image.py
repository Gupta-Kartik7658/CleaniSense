from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel


class PollutionImageType(str, Enum):
    SMOKE = "smoke"
    DUST_HAZE = "dust_haze"
    GARBAGE_ACCUMULATION = "garbage_accumulation"
    WATER_CONTAMINATION = "water_contamination"
    WASTEWATER_SEWERAGE = "wastewater_sewerage"
    NOISE_POLLUTION = "noise_pollution"
    OTHER = "other"


class DetectorAnalysisResponse(BaseModel):
    name: str
    score: float
    coverage_ratio: float
    detected: bool
    features: Dict[str, float]


class PollutionImageAnalysisResponse(BaseModel):
    pollution_detected: bool
    dominant_type: str
    severity_score: float
    severity_label: str
    ai_confidence_score: float
    color_features: Dict[str, float]
    texture_features: Dict[str, float]
    detectors: Dict[str, DetectorAnalysisResponse]
    metadata: Dict[str, object]


class PollutionImageSummaryResponse(BaseModel):
    pollution_detected: bool
    dominant_type: str
    severity_score: float
    severity_label: str
    ai_confidence_score: float
    supported_pollution_types: List[str]
    image_shape: List[int]


class PollutionImageTypeOption(BaseModel):
    value: PollutionImageType
    label: str
    swagger_value: str
    use_for: str
    image_detection_supported: bool


class OpenCvScoreDebugResponse(BaseModel):
    requested_image_type: PollutionImageType
    pollution_detected: bool
    dominant_type: str
    raw_severity_score: float
    gated_severity_score: float
    local_confidence_score: float
    severity_label: str
    detector_scores: Dict[str, DetectorAnalysisResponse]


class GeminiScoreDebugResponse(BaseModel):
    enabled: bool
    returned: bool
    pollution_type: Optional[str] = None
    confidence_score: Optional[float] = None
    severity_score: Optional[float] = None
    gated_severity_score: Optional[float] = None
    severity_label: Optional[str] = None
    environmental_description: Optional[str] = None
    verification_notes: Optional[str] = None
    model: Optional[str] = None
    skipped_reason: Optional[str] = None


class ImageSeverityDebugResponse(BaseModel):
    filename: Optional[str]
    content_type: Optional[str]
    requested_image_type: PollutionImageType
    category_hint_sent_to_models: str
    image_relevant: bool
    relevance_reason: str
    recommended_image_severity_score: float
    should_apply_weather_and_survey_scores: bool
    score_summary: Dict[str, object]
    opencv: OpenCvScoreDebugResponse
    gemini: GeminiScoreDebugResponse
    valid_image_type_examples: List[PollutionImageTypeOption]
