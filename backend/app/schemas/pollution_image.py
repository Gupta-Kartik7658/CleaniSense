from typing import Dict, List

from pydantic import BaseModel


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
    color_features: Dict[str, float]
    texture_features: Dict[str, float]
    detectors: Dict[str, DetectorAnalysisResponse]
    metadata: Dict[str, object]


class PollutionImageSummaryResponse(BaseModel):
    pollution_detected: bool
    dominant_type: str
    severity_score: float
    severity_label: str
    supported_pollution_types: List[str]
    image_shape: List[int]
