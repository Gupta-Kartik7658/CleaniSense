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
    endpoint_base = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self) -> None:
        self.last_error: Optional[str] = None

    def analyze_image(
        self,
        image_content: bytes,
        mime_type: str,
        category_name: Optional[str],
        local_analysis: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        self.last_error = None
        if not settings.GEMINI_ENABLED or not settings.GEMINI_API_KEY:
            self.last_error = "Gemini is disabled or GEMINI_API_KEY is missing."
            return None

        prompt = self._build_prompt(category_name, local_analysis)
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": base64.b64encode(image_content).decode("utf-8"),
                            }
                        },
                        {"text": prompt},
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0,
                "maxOutputTokens": 300,
                "responseMimeType": "application/json",
                "responseSchema": self._response_schema(),
            },
        }

        try:
            response = httpx.post(
                f"{self.endpoint_base}/{self._model_name()}:generateContent",
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
                self.last_error = (
                    "Gemini response did not contain parseable JSON. "
                    f"Text preview: {text[:240]}"
                )
                logger.warning(self.last_error)
                return None
            return self._normalize(parsed)
        except httpx.HTTPStatusError as exc:
            response_text = exc.response.text[:300] if exc.response is not None else ""
            self.last_error = (
                f"Gemini HTTP {exc.response.status_code if exc.response else 'error'}: "
                f"{response_text}"
            )
            logger.warning("Gemini vision analysis skipped: %s", self.last_error)
            return None
        except Exception as exc:
            self.last_error = f"{exc.__class__.__name__}: {exc}"
            logger.warning("Gemini vision analysis skipped: %s", self.last_error)
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

        candidate_chunks = []
        for candidate in payload.get("candidates", []):
            if not isinstance(candidate, dict):
                continue
            content = candidate.get("content") or {}
            for part in content.get("parts", []):
                if isinstance(part, dict) and isinstance(part.get("text"), str):
                    candidate_chunks.append(part["text"])
        if candidate_chunks:
            return "\n".join(candidate_chunks)

        model_output_chunks = []
        for step in payload.get("steps", []):
            if not isinstance(step, dict) or step.get("type") != "model_output":
                continue
            for content in step.get("content", []):
                if isinstance(content, dict) and isinstance(content.get("text"), str):
                    model_output_chunks.append(content["text"])
        if model_output_chunks:
            return "\n".join(model_output_chunks)

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
            "model": self._model_name(),
        }

    def _model_name(self) -> str:
        model = settings.GEMINI_MODEL.strip()
        if not model:
            return "models/gemini-3.1-flash-lite"
        if model.startswith("models/"):
            return model
        return f"models/{model}"

    def _response_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "pollution_type": {
                    "type": "string",
                    "enum": [
                        "smoke",
                        "dust_haze",
                        "garbage_accumulation",
                        "water_contamination",
                        "wastewater_sewerage",
                        "other",
                        "none",
                    ],
                },
                "confidence_score": {"type": "number", "minimum": 0, "maximum": 100},
                "severity_score": {"type": "number", "minimum": 0, "maximum": 100},
                "severity_label": {
                    "type": "string",
                    "enum": ["normal", "moderate", "high", "critical"],
                },
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
