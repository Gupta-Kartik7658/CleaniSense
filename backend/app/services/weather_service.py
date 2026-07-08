from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.complaint import Complaint
from app.models.weather_observation import WeatherObservation


logger = logging.getLogger("uvicorn")


class WeatherService:
    weather_current = [
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation",
        "rain",
        "wind_speed_10m",
        "wind_direction_10m",
    ]
    weather_hourly = ["precipitation_probability"]
    air_current = [
        "us_aqi",
        "pm10",
        "pm2_5",
        "carbon_monoxide",
        "nitrogen_dioxide",
        "sulphur_dioxide",
    ]

    def get_current_conditions(self, latitude: float, longitude: float) -> Dict[str, Any]:
        weather_payload: Dict[str, Any] = {}
        air_payload: Dict[str, Any] = {}

        with httpx.Client(timeout=settings.WEATHER_TIMEOUT_SECONDS) as client:
            weather_response = client.get(
                settings.OPEN_METEO_FORECAST_URL,
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": ",".join(self.weather_current),
                    "hourly": ",".join(self.weather_hourly),
                    "forecast_hours": 1,
                    "timezone": "auto",
                },
            )
            weather_response.raise_for_status()
            weather_payload = weather_response.json()

            air_response = client.get(
                settings.OPEN_METEO_AIR_QUALITY_URL,
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": ",".join(self.air_current),
                    "timezone": "auto",
                    "domains": "auto",
                },
            )
            air_response.raise_for_status()
            air_payload = air_response.json()

        return self._normalize(latitude, longitude, weather_payload, air_payload)

    def create_observation(
        self,
        db: Session,
        latitude: float,
        longitude: float,
        complaint_id: Optional[uuid.UUID] = None,
    ) -> WeatherObservation:
        conditions = self.get_current_conditions(latitude, longitude)
        existing = None
        if complaint_id:
            existing = (
                db.query(WeatherObservation)
                .filter(WeatherObservation.complaint_id == complaint_id)
                .first()
            )

        observation = existing or WeatherObservation(
            complaint_id=complaint_id,
            latitude=latitude,
            longitude=longitude,
        )
        for key, value in conditions.items():
            if hasattr(observation, key):
                setattr(observation, key, value)

        observation.updated_at = datetime.now(timezone.utc)
        db.add(observation)
        db.commit()
        db.refresh(observation)
        return observation

    def enrich_complaint(self, db: Session, complaint: Complaint) -> Optional[WeatherObservation]:
        try:
            observation = self.create_observation(
                db=db,
                latitude=complaint.latitude,
                longitude=complaint.longitude,
                complaint_id=complaint.id,
            )
            complaint.weather_score = self.score_observation(observation, complaint)
            db.add(complaint)
            db.commit()
            db.refresh(complaint)
            return observation
        except Exception as exc:
            logger.warning(
                "Weather enrichment skipped for complaint=%s: %s",
                complaint.id,
                exc,
            )
            return None

    def get_for_complaint(
        self,
        db: Session,
        complaint_id: uuid.UUID,
    ) -> Optional[WeatherObservation]:
        return (
            db.query(WeatherObservation)
            .filter(WeatherObservation.complaint_id == complaint_id)
            .first()
        )

    def score_observation(
        self,
        observation: Optional[WeatherObservation],
        complaint: Optional[Complaint] = None,
    ) -> float:
        if not observation:
            return 0.0

        aqi_score = self._scale(observation.aqi_us, 50, 300)
        pm25_score = self._scale(observation.pm2_5, 12, 150)
        pm10_score = self._scale(observation.pm10, 55, 355)
        no2_score = self._scale(observation.no2, 40, 200)
        so2_score = self._scale(observation.so2, 20, 125)
        wind_penalty = 100.0 - self._scale(observation.wind_speed_kmh, 3, 25)
        rain_risk = self._scale(observation.rain_probability_percent, 35, 90)
        humidity_risk = self._scale(observation.humidity_percent, 65, 95)

        category = ""
        if complaint and complaint.category:
            category = complaint.category.name.lower()

        if any(token in category for token in ["air", "smoke", "dust", "aqi"]):
            score = (
                0.32 * aqi_score
                + 0.22 * pm25_score
                + 0.16 * pm10_score
                + 0.12 * no2_score
                + 0.08 * so2_score
                + 0.10 * wind_penalty
            )
        elif any(token in category for token in ["water", "sewer", "sewage", "drain"]):
            score = 0.45 * rain_risk + 0.25 * humidity_risk + 0.20 * pm10_score + 0.10 * aqi_score
        elif any(token in category for token in ["waste", "garbage", "dump", "land"]):
            score = 0.40 * humidity_risk + 0.25 * rain_risk + 0.20 * pm10_score + 0.15 * aqi_score
        else:
            score = (
                0.25 * aqi_score
                + 0.20 * pm25_score
                + 0.15 * pm10_score
                + 0.15 * rain_risk
                + 0.15 * humidity_risk
                + 0.10 * wind_penalty
            )
        return round(max(0.0, min(100.0, score)), 2)

    def _normalize(
        self,
        latitude: float,
        longitude: float,
        weather_payload: Dict[str, Any],
        air_payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        current_weather = weather_payload.get("current") or {}
        current_air = air_payload.get("current") or {}
        hourly = weather_payload.get("hourly") or {}

        return {
            "latitude": latitude,
            "longitude": longitude,
            "temperature_c": self._as_float(current_weather.get("temperature_2m")),
            "humidity_percent": self._as_float(current_weather.get("relative_humidity_2m")),
            "wind_speed_kmh": self._as_float(current_weather.get("wind_speed_10m")),
            "wind_direction_deg": self._as_float(current_weather.get("wind_direction_10m")),
            "rain_probability_percent": self._first_float(hourly.get("precipitation_probability")),
            "precipitation_mm": self._as_float(
                current_weather.get("precipitation") or current_weather.get("rain")
            ),
            "aqi_us": self._as_float(current_air.get("us_aqi")),
            "pm2_5": self._as_float(current_air.get("pm2_5")),
            "pm10": self._as_float(current_air.get("pm10")),
            "no2": self._as_float(current_air.get("nitrogen_dioxide")),
            "so2": self._as_float(current_air.get("sulphur_dioxide")),
            "co": self._as_float(current_air.get("carbon_monoxide")),
            "source": settings.WEATHER_PROVIDER,
            "raw_weather_json": json.dumps(weather_payload, separators=(",", ":"))[:12000],
            "raw_air_quality_json": json.dumps(air_payload, separators=(",", ":"))[:12000],
            "observed_at": datetime.now(timezone.utc),
        }

    def _scale(self, value: Optional[float], low: float, high: float) -> float:
        if value is None:
            return 0.0
        if high <= low:
            return 0.0
        return max(0.0, min(100.0, ((value - low) / (high - low)) * 100.0))

    def _first_float(self, value: Any) -> Optional[float]:
        if isinstance(value, list) and value:
            return self._as_float(value[0])
        return self._as_float(value)

    def _as_float(self, value: Any) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None


weather_service = WeatherService()
