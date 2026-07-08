import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.models.complaint import Complaint
from app.models.user import User
from app.schemas.weather import WeatherObservationResponse
from app.services.weather_service import weather_service
from app.utils.response import StandardResponseModel, standard_response

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current", response_model=StandardResponseModel)
def get_current_weather(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    current_user: User = Depends(get_current_user),
):
    conditions = weather_service.get_current_conditions(latitude, longitude)
    return standard_response(
        success=True,
        message="Weather and air quality retrieved successfully",
        data=conditions,
    )


@router.post("/complaints/{complaint_id}/refresh", response_model=StandardResponseModel)
def refresh_complaint_weather(
    complaint_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id, Complaint.is_deleted == False)
        .first()
    )
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    observation = weather_service.enrich_complaint(db, complaint)
    if not observation:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Weather provider did not return usable data",
        )

    return standard_response(
        success=True,
        message="Complaint weather observation refreshed",
        data=WeatherObservationResponse.model_validate(observation),
    )


@router.get("/complaints/{complaint_id}", response_model=StandardResponseModel)
def get_complaint_weather(
    complaint_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id, Complaint.is_deleted == False)
        .first()
    )
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )
    if current_user.role == "citizen" and complaint.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this complaint weather",
        )

    observation = weather_service.get_for_complaint(db, complaint_id)
    if not observation:
        observation = weather_service.enrich_complaint(db, complaint)
    if not observation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weather observation has not been captured for this complaint",
        )

    return standard_response(
        success=True,
        message="Complaint weather observation retrieved",
        data=WeatherObservationResponse.model_validate(observation),
    )
