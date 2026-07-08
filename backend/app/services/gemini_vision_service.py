from __future__ import annotations

import base64
import json
import logging
import re
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings


logger = logging.getLogger("uvicorn")


GEMINI_ENVIRONMENT_PROMPT = """
You are CleaniSense's fast environmental image verifier.
Analyze the uploaded complaint image for civic pollution evidence.

Return only minified JSON with this exact schema:
{
  "pollution_type": "smoke|dust_haze|garbage_accumulation|water_contamination|wastewater_sewerage|other|none",
  "confidence_score": 0-100,
  "severity_score": 0-100,
  "severity_label": "normal|moderate|high|critical",
  "environmental_description": "short factual description, max 160 chars",
  "verification_notes": "short reason for confidence, max 120 chars"
}

Rules:
- Prefer observable visual evidence over assumptions.
- Use the complaint category as a hint, not as proof.
- If the image is unrelated, unclear, indoor-only, or not environmental pollution, use pollution_type "none" and confidence_score below 35.
- Do not classify noise pollution from images.
- Keep latency low: no long explanation, no markdown, no prose outside JSON.
""".strip()


class GeminiVisionService:
    endpoint = "https://generativelanguage.googleapis.com/v1beta/interactions"

    def analyze_image(
        self,
        image_content: bytes,
        mime_type: str,
        category_name: Optional[str],
        local_analysis: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        if not settings.GEMINI_ENABLED or not settings.GEMINI_API_KEY:
            return None

        prompt = self._build_prompt(category_name, local_analysis)
        payload = {
            "model": settings.GEMINI_MODEL,
            "input": [
                {"type": "text", "text": prompt},
                {
                    "type": "image",
                    "data": base64.b64encode(image_content).decode("utf-8"),
                    "mime_type": mime_type,
                },
            ],
            "response_format": {
                "type": "text",
                "mime_type": "application/json",
                "schema": {
                    "type": "object",
                    "properties": {
                        "pollution_type": {"type": "string"},
                        "confidence_score": {"type": "number"},
                        "severity_score": {"type": "number"},
                        "severity_label": {"type": "string"},
                        "environmental_description": {"type": "string"},
                        "verification_notes": {"type": "string"},
                    },
                    "required": [
                        "pollution_type",
                        "confidence_score",
                        "severity_score",
                        "severity_label",
                        "environmental_description",
                        "verification_notes",
                    ],
                },
            },
            "generation_config": {
                "thinking_level": "minimal",
            },
        }

        try:
            response = httpx.post(
                self.endpoint,
                headers={
                    "x-goog-api-key": settings.GEMINI_API_KEY,
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=settings.GEMINI_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            text = self._extract_text(response.json())
            parsed = self._parse_json(text)
            if not parsed:
                logger.warning("Gemini vision response did not contain JSON")
                return None
            return self._normalize(parsed)
        except Exception as exc:
            logger.warning("Gemini vision analysis skipped: %s", exc)
            return None

    def _build_prompt(
        self,
        category_name: Optional[str],
        local_analysis: Dict[str, Any],
    ) -> str:
        local_summary = {
            "category_hint": category_name,
            "opencv_dominant_type": local_analysis.get("dominant_type"),
            "opencv_image_severity_score": local_analysis.get("severity_score"),
            "opencv_pollution_detected": local_analysis.get("pollution_detected"),
            "opencv_supported_types": local_analysis.get("metadata", {}).get(
                "supported_pollution_types",
                [],
            ),
        }
        return (
            f"{GEMINI_ENVIRONMENT_PROMPT}\n\n"
            f"Complaint/OpenCV context JSON: {json.dumps(local_summary, separators=(',', ':'))}"
        )

    def _extract_text(self, payload: Dict[str, Any]) -> str:
        direct = payload.get("output_text") or payload.get("outputText")
        if isinstance(direct, str):
            return direct

        text_chunks = []

        def visit(node: Any) -> None:
            if isinstance(node, dict):
                if isinstance(node.get("text"), str):
                    text_chunks.append(node["text"])
                for value in node.values():
                    visit(value)
            elif isinstance(node, list):
                for item in node:
                    visit(item)

        visit(payload)
        return "\n".join(text_chunks)

    def _parse_json(self, text: str) -> Optional[Dict[str, Any]]:
        if not text:
            return None
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            value = json.loads(cleaned)
            return value if isinstance(value, dict) else None
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
            if not match:
                return None
            try:
                value = json.loads(match.group(0))
                return value if isinstance(value, dict) else None
            except json.JSONDecodeError:
                return None

    def _normalize(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        pollution_type = str(payload.get("pollution_type") or "other").lower()
        if pollution_type not in {
            "smoke",
            "dust_haze",
            "garbage_accumulation",
            "water_contamination",
            "wastewater_sewerage",
            "other",
            "none",
        }:
            pollution_type = "other"

        confidence_score = self._clip_score(payload.get("confidence_score"))
        severity_score = self._clip_score(payload.get("severity_score"))
        severity_label = str(payload.get("severity_label") or "").lower()
        if severity_label not in {"normal", "moderate", "high", "critical"}:
            severity_label = self._severity_label(severity_score)

        return {
            "pollution_type": pollution_type,
            "confidence_score": confidence_score,
            "severity_score": severity_score,
            "severity_label": severity_label,
            "environmental_description": str(payload.get("environmental_description") or "")[:220],
            "verification_notes": str(payload.get("verification_notes") or "")[:180],
            "model": settings.GEMINI_MODEL,
        }

    def _clip_score(self, value: Any) -> float:
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            numeric = 0.0
        return round(max(0.0, min(100.0, numeric)), 2)

    def _severity_label(self, score: float) -> str:
        if score < 25.0:
            return "normal"
        if score < 50.0:
            return "moderate"
        if score < 75.0:
            return "high"
        return "critical"


gemini_vision_service = GeminiVisionService()
