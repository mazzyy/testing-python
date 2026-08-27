"""API Routers"""
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.programs import router as programs_router
from app.routers.profile import router as profile_router
from app.routers.recommendations import router as recommendations_router

__all__ = [
    "auth_router",
    "users_router", 
    "programs_router",
    "profile_router",
    "recommendations_router"
]
