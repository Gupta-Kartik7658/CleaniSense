from fastapi import APIRouter
from .routers import (
    auth,
    users,
    complaints,
    hotspots,
    weather,
    dashboard,
    profile,
    notifications,
    health,
    config,
    image_analysis,
    admin,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(users.router)
api_router.include_router(profile.router)
api_router.include_router(complaints.router)
api_router.include_router(notifications.router)
api_router.include_router(hotspots.router)
api_router.include_router(weather.router)
api_router.include_router(dashboard.router)
api_router.include_router(health.router)
api_router.include_router(config.router)
api_router.include_router(image_analysis.router)

