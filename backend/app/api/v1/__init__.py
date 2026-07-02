from fastapi import APIRouter
from .routers import auth, users, complaints, hotspots, weather, dashboard

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(complaints.router)
api_router.include_router(hotspots.router)
api_router.include_router(weather.router)
api_router.include_router(dashboard.router)
