from __future__ import annotations

import json
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.utils.geo import haversine_km


class SeverityService:
    IMAGE_WEIGHT = 0.35
    AI_WEIGHT = 0.20
    SURVEY_WEIGHT = 0.20
    WEATHER_WEIGHT = 0.15
    DENSITY_WEIGHT = 0.10
    GEMINI_MIN_CONFIDENCE = 35.0

    def calculate_and_apply(
        self,
        db: Session,
        complaint: Complaint,
        image_analysis: Optional[Dict[str, Any]] = None,
    ) -> Complaint:
        survey_score = self._survey_score(complaint)
        weather_score = self._weather_score(db, complaint)
        density_score = self._density_score(db, complaint)

        evidence: Dict[str, Any] = {}
        if image_analysis:
            evidence = self.evaluate_image_evidence(
                image_analysis=image_analysis,
                category_name=complaint.category.name if complaint.category else None,
            )
            image_score = float(evidence["hybrid_image_score"])
            ai_score = float(evidence["gemini_confidence_score"])
            context_pressure = self._context_pressure(
                survey_score=survey_score,
                weather_score=weather_score,
                density_score=density_score,
            )

            if evidence["image_relevant"]:
                context_gain = (
                    0.25
                    + 0.55 * float(evidence["gemini_confidence_ratio"])
                    + 0.20 * float(evidence["agreement_factor"])
                )
                severity_score = round(
                    image_score
                    + (100.0 - image_score)
                    * (context_pressure / 100.0)
                    * context_gain,
                    2,
                )
            else:
                context_gain = 0.0
                severity_score = 0.0
        else:
            image_score = 0.0
            ai_score = 0.0
            context_pressure = self._context_pressure(
                survey_score=survey_score,
                weather_score=weather_score,
                density_score=density_score,
            )
            context_gain = 0.0
            severity_score = 0.0
            evidence = {
                "image_relevant": False,
                "hybrid_image_score": 0.0,
                "gate_reason": (
                    "Image verification is pending. Survey, weather, and density "
                    "components are recorded but suppressed until Gemini verifies image evidence."
                ),
            }
        severity_label = self._severity_label(severity_score)

        breakdown = {
            "formula": {
                "mode": "gemini_gated_hybrid" if image_analysis else "pending_image_verification",
                "description": (
                    "Gemini verifies image relevance. OpenCV adjusts the image score as a "
                    "corroborating signal. Survey, weather, and density amplify only the "
                    "remaining severity headroom after valid image evidence exists."
                    if image_analysis
                    else "Context components are stored for audit but do not raise severity until Gemini verifies image evidence."
                ),
            },
            "components": {
                "image_processing": round(image_score, 2),
                "ai_confidence": round(ai_score, 2),
                "survey": round(survey_score, 2),
                "weather": round(weather_score, 2),
                "complaint_density": round(density_score, 2),
                "context_pressure": round(context_pressure, 2),
                "context_gain": round(context_gain, 4),
            },
            "image_evidence": evidence,
        }

        complaint.severity_score = severity_score
        complaint.severity = severity_label
        complaint.image_severity_score = round(image_score, 2)
        complaint.ai_confidence_score = round(ai_score, 2)
        complaint.survey_score = round(survey_score, 2)
        complaint.weather_score = round(weather_score, 2)
        complaint.density_score = round(density_score, 2)
        complaint.severity_breakdown = json.dumps(breakdown)

        if image_analysis:
            gemini_analysis = image_analysis.get("gemini_analysis")
            complaint.image_analysis_summary = json.dumps(
                {
                    "pollution_detected": image_analysis.get("pollution_detected"),
                    "dominant_type": image_analysis.get("dominant_type"),
                    "severity_score": image_analysis.get("severity_score"),
                    "severity_label": image_analysis.get("severity_label"),
                    "ai_confidence_score": image_analysis.get("ai_confidence_score"),
                    "gemini_analysis": gemini_analysis,
                    "image_evidence": evidence,
                    "supported_pollution_types": image_analysis.get("metadata", {}).get(
                        "supported_pollution_types",
                        [],
                    ),
                }
            )

        db.add(complaint)
        db.commit()
        db.refresh(complaint)
        return complaint

    def evaluate_image_evidence(
        self,
        image_analysis: Dict[str, Any],
        category_name: Optional[str] = None,
        requested_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        gemini_analysis = image_analysis.get("gemini_analysis") or {}
        gemini_type = str(gemini_analysis.get("pollution_type") or "none").lower()
        gemini_confidence = self._clip(float(gemini_analysis.get("confidence_score") or 0.0))
        gemini_severity = self._clip(float(gemini_analysis.get("severity_score") or 0.0))
        gemini_confidence_ratio = gemini_confidence / 100.0

        opencv_detected = bool(image_analysis.get("pollution_detected"))
        opencv_type = str(image_analysis.get("dominant_type") or "low_signal").lower()
        opencv_score = self._clip(float(image_analysis.get("severity_score") or 0.0))

        expected_types = self._expected_pollution_types(category_name, requested_type)
        gemini_type_allowed = (
            not expected_types
            or gemini_type in expected_types
            or "other" in expected_types
        )
        gemini_valid = bool(
            gemini_analysis
            and gemini_type != "none"
            and gemini_confidence >= self.GEMINI_MIN_CONFIDENCE
            and gemini_type_allowed
        )

        opencv_agrees = bool(opencv_detected and opencv_type == gemini_type)
        if opencv_agrees:
            agreement_factor = 1.0
            opencv_adjusted_score = opencv_score
        elif opencv_detected:
            agreement_factor = 0.60
            opencv_adjusted_score = opencv_score * 0.35
        else:
            agreement_factor = 0.40
            opencv_adjusted_score = 0.0

        if gemini_valid:
            hybrid_score = (
                (0.78 * gemini_severity + 0.22 * opencv_adjusted_score)
                * (0.72 + 0.28 * gemini_confidence_ratio)
                * (0.90 + 0.10 * agreement_factor)
            )
            hybrid_score = self._clip(hybrid_score)
        else:
            hybrid_score = 0.0

        return {
            "image_relevant": gemini_valid,
            "expected_types": expected_types,
            "gemini_pollution_type": gemini_type,
            "gemini_confidence_score": round(gemini_confidence, 2),
            "gemini_confidence_ratio": round(gemini_confidence_ratio, 4),
            "gemini_severity_score": round(gemini_severity, 2),
            "opencv_pollution_detected": opencv_detected,
            "opencv_dominant_type": opencv_type,
            "opencv_raw_score": round(opencv_score, 2),
            "opencv_agrees_with_gemini": opencv_agrees,
            "opencv_adjusted_score": round(opencv_adjusted_score, 2),
            "agreement_factor": round(agreement_factor, 4),
            "hybrid_image_score": round(hybrid_score, 2),
            "gate_reason": (
                "Gemini verified matching pollution evidence."
                if gemini_valid
                else "Gemini did not verify matching pollution evidence; contextual severity components are suppressed."
            ),
        }

    def _image_score(
        self,
        complaint: Complaint,
        image_analysis: Optional[Dict[str, Any]],
    ) -> float:
        if image_analysis:
            return float(image_analysis.get("severity_score") or 0.0)
        return float(complaint.image_severity_score or 0.0)

    def _ai_score(
        self,
        complaint: Complaint,
        image_analysis: Optional[Dict[str, Any]],
    ) -> float:
        if image_analysis:
            return float(image_analysis.get("ai_confidence_score") or 0.0)
        return float(complaint.ai_confidence_score or 0.0)

    def _survey_score(self, complaint: Complaint) -> float:
        text = f"{complaint.title} {complaint.description}".lower()
        score = 10.0

        if complaint.area_affected_sqm is not None:
            score += min(float(complaint.area_affected_sqm) / 10.0, 25.0)
        if complaint.population_affected is not None:
            score += min(float(complaint.population_affected) / 4.0, 25.0)
        if complaint.duration_hours is not None:
            score += min(float(complaint.duration_hours) / 2.0, 20.0)

        survey_payload: Dict[str, Any] = {}
        if complaint.survey_data:
            try:
                parsed = json.loads(complaint.survey_data)
                if isinstance(parsed, dict):
                    survey_payload = parsed
            except json.JSONDecodeError:
                survey_payload = {}

        severity_hint = str(survey_payload.get("severity") or "").lower()
        if severity_hint in {"critical", "severe"}:
            score += 25.0
        elif severity_hint == "high":
            score += 18.0
        elif severity_hint in {"moderate", "medium"}:
            score += 10.0
        elif severity_hint in {"normal", "low"}:
            score += 4.0

        if survey_payload.get("vulnerable_people_nearby"):
            score += 10.0
        if survey_payload.get("active_leak_or_fire"):
            score += 15.0

        severity_keywords = {
            "critical": 28,
            "danger": 24,
            "hazard": 22,
            "toxic": 26,
            "chemical": 24,
            "fire": 24,
            "burning": 22,
            "overflow": 20,
            "blocked": 16,
            "heap": 16,
            "large": 14,
            "smell": 14,
            "smoke": 18,
            "dust": 16,
            "sewage": 22,
            "wastewater": 22,
            "contaminated": 22,
            "drinking water": 26,
            "children": 12,
            "school": 12,
            "hospital": 14,
        }
        for keyword, boost in severity_keywords.items():
            if keyword in text:
                score += boost

        duration_keywords = {
            "week": 18,
            "days": 14,
            "day": 10,
            "hours": 6,
            "month": 24,
        }
        for keyword, boost in duration_keywords.items():
            if keyword in text:
                score += boost
                break

        if complaint.category:
            category = complaint.category.name.lower()
            if any(token in category for token in ["sewer", "water", "air", "waste"]):
                score += 8

        return self._clip(score)

    def _weather_score(self, db: Session, complaint: Complaint) -> float:
        from app.services.weather_service import weather_service

        observation = weather_service.get_for_complaint(db, complaint.id)
        if observation:
            return weather_service.score_observation(observation, complaint)

        text = f"{complaint.title} {complaint.description}".lower()
        category = complaint.category.name.lower() if complaint.category else ""
        score = 45.0

        if any(token in category for token in ["air", "dust", "smoke"]):
            score += 10
            if any(token in text for token in ["stagnant", "wind", "smoke", "burning"]):
                score += 15
        elif any(token in category for token in ["water", "sewer", "drain"]):
            score += 8
            if any(token in text for token in ["rain", "overflow", "flood", "stagnant"]):
                score += 17
        elif any(token in category for token in ["waste", "garbage"]):
            score += 6
            if any(token in text for token in ["smell", "wet", "rain", "overflow"]):
                score += 12

        return self._clip(score)

    def _density_score(self, db: Session, complaint: Complaint) -> float:
        candidates = db.query(Complaint).filter(
            Complaint.id != complaint.id,
            Complaint.is_deleted == False,
            Complaint.category_id == complaint.category_id,
        ).all()

        nearby_count = 0
        for candidate in candidates:
            distance_km = haversine_km(
                complaint.longitude,
                complaint.latitude,
                candidate.longitude,
                candidate.latitude,
            )
            if distance_km <= 0.5:
                nearby_count += 1

        return self._clip(nearby_count * 25.0)

    def _context_pressure(
        self,
        survey_score: float,
        weather_score: float,
        density_score: float,
    ) -> float:
        return self._clip(
            0.45 * survey_score
            + 0.35 * weather_score
            + 0.20 * density_score
        )

    def _expected_pollution_types(
        self,
        category_name: Optional[str],
        requested_type: Optional[str],
    ) -> list[str]:
        if requested_type:
            normalized_requested = requested_type.lower()
            if normalized_requested == "other":
                return ["other"]
            return [normalized_requested]

        normalized_category = (category_name or "").lower()
        if any(token in normalized_category for token in ["sewer", "sewage", "wastewater", "drain"]):
            return ["wastewater_sewerage", "water_contamination"]
        if any(token in normalized_category for token in ["water", "contamination", "chemical"]):
            return ["water_contamination", "wastewater_sewerage"]
        if any(token in normalized_category for token in ["waste", "garbage", "dump", "land", "solid"]):
            return ["garbage_accumulation"]
        if any(token in normalized_category for token in ["air", "smoke", "dust", "aqi", "quality", "burning"]):
            return ["smoke", "dust_haze"]
        return []

    def _severity_label(self, score: float) -> str:
        if score < 25.0:
            return "normal"
        if score < 50.0:
            return "moderate"
        if score < 75.0:
            return "high"
        return "critical"

    def _clip(self, value: float) -> float:
        return max(0.0, min(100.0, float(value)))


severity_service = SeverityService()
