"""
Admin-specific schemas for comprehensive user details
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserResponse
from app.schemas.profile import UserProfileResponse, UserApplicationResponse


class CachedRecommendationResponse(BaseModel):
    """Cached AI recommendation response"""
    id: int
    program_id: int
    match_score: float
    match_reasons: Optional[List[str]] = None
    highlights: Optional[str] = None
    gaps: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    
    # Program info
    program_name: Optional[str] = None
    university_name: Optional[str] = None
    degree_type: Optional[str] = None
    city: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserDetailResponse(BaseModel):
    """Comprehensive user details for admin view"""
    # Basic user info
    user: UserResponse
    
    # Full profile
    profile: Optional[UserProfileResponse] = None
    
    # All applications
    applications: List[UserApplicationResponse] = []
    
    # All cached recommendations
    recommendations: List[CachedRecommendationResponse] = []


class UserStatsResponse(BaseModel):
    """User statistics for admin dashboard"""
    total_users: int
    active_users: int
    inactive_users: int
    admin_count: int
    user_count: int
    verified_users: int
    unverified_users: int
    users_with_profile: int
    users_with_applications: int
