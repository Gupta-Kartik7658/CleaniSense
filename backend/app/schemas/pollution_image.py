from typing import Dict, List

from pydantic import BaseModel


class DetectorAnalysisResponse(BaseModel):
    name: str
    score: float
    coverage_ratio: float
    detected: bool
    features: Dict[str, float]


class ComplaintCategoryAnalysisResponse(BaseModel):
    name: str
    score: float
    severity_label: str
    detected: bool
    supporting_detectors: List[str]


class PollutionImageAnalysisResponse(BaseModel):
    pollution_detected: bool
    dominant_type: str
    primary_category: str
    severity_score: float
    severity_label: str
    color_features: Dict[str, float]
    texture_features: Dict[str, float]
    detectors: Dict[str, DetectorAnalysisResponse]
    category_assessments: Dict[str, ComplaintCategoryAnalysisResponse]
    metadata: Dict[str, object]


class PollutionImageSummaryResponse(BaseModel):
    pollution_detected: bool
    dominant_type: str
    primary_category: str
    severity_score: float
    severity_label: str
    supported_pollution_types: List[str]
    supported_complaint_categories: List[str]
    excluded_complaint_categories: List[str]
    image_shape: List[int]
