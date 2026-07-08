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

    def calculate_and_apply(
        self,
        db: Session,
        complaint: Complaint,
        image_analysis: Optional[Dict[str, Any]] = None,
    ) -> Complaint:
        image_score = self._image_score(complaint, image_analysis)
        ai_score = self._ai_score(complaint, image_analysis)
        survey_score = self._survey_score(complaint)
        weather_score = self._weather_score(complaint)
        density_score = self._density_score(db, complaint)

        severity_score = round(
            self.IMAGE_WEIGHT * image_score
            + self.AI_WEIGHT * ai_score
            + self.SURVEY_WEIGHT * survey_score
            + self.WEATHER_WEIGHT * weather_score
            + self.DENSITY_WEIGHT * density_score,
            2,
        )
        severity_label = self._severity_label(severity_score)

        breakdown = {
            "formula": {
                "image_processing": self.IMAGE_WEIGHT,
                "ai_confidence": self.AI_WEIGHT,
                "survey": self.SURVEY_WEIGHT,
                "weather": self.WEATHER_WEIGHT,
                "complaint_density": self.DENSITY_WEIGHT,
            },
            "components": {
                "image_processing": round(image_score, 2),
                "ai_confidence": round(ai_score, 2),
                "survey": round(survey_score, 2),
                "weather": round(weather_score, 2),
                "complaint_density": round(density_score, 2),
            },
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
        score = 20.0

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

    def _weather_score(self, complaint: Complaint) -> float:
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
