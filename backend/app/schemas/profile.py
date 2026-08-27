"""
User Profile and Application schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.user_profile import ApplicationStatus


# ============== User Profile Schemas ==============

class LanguageInfo(BaseModel):
    """Language proficiency info"""
    language: str
    level: str  # A1, A2, B1, B2, C1, C2


class UserProfileBase(BaseModel):
    """Base profile schema"""
    full_name: Optional[str] = None
    nationality: Optional[str] = None
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    """Schema for creating user profile"""
    # Academic Background
    current_degree: Optional[str] = None
    field_of_study: Optional[str] = None
    university: Optional[str] = None
    graduation_date: Optional[str] = None
    cgpa: Optional[float] = Field(None, ge=0)
    gpa_scale: Optional[float] = Field(None, ge=0)
    
    # Courses and Skills
    relevant_courses: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    honors_awards: Optional[str] = None
    
    # Work Experience
    work_experience: Optional[str] = None
    research_experience: Optional[str] = None
    
    # Language Proficiency
    english_level: Optional[str] = None
    english_certificate: Optional[str] = None
    english_score: Optional[str] = None
    german_level: Optional[str] = None
    german_certificate: Optional[str] = None
    german_score: Optional[str] = None
    other_languages: Optional[List[LanguageInfo]] = None
    
    # Preferences
    desired_degree: Optional[str] = None  # Bachelor, Masters, PhD
    desired_fields: Optional[List[str]] = None
    preferred_cities: Optional[List[str]] = None
    preferred_universities: Optional[List[str]] = None
    preferred_language: Optional[str] = None
    
    # Extended Preferences
    university_type: Optional[str] = None
    intake_semester: Optional[str] = None
    program_format: Optional[str] = None
    accommodation_preference: Optional[str] = None
    career_goals: Optional[str] = None
    special_requirements: Optional[List[str]] = None
    interests_hobbies: Optional[List[str]] = None
    
    # Budget
    budget_range: Optional[str] = None
    needs_funding: Optional[str] = None


class UserProfileUpdate(UserProfileCreate):
    """Schema for updating user profile"""
    pass


class UserProfileResponse(UserProfileBase):
    """User profile response schema"""
    id: int
    user_id: int
    
    # Academic Background
    current_degree: Optional[str] = None
    field_of_study: Optional[str] = None
    university: Optional[str] = None
    graduation_date: Optional[str] = None
    cgpa: Optional[float] = None
    gpa_scale: Optional[float] = None
    
    # Courses and Skills
    relevant_courses: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    honors_awards: Optional[str] = None
    
    # Work Experience
    work_experience: Optional[str] = None
    research_experience: Optional[str] = None
    
    # Language Proficiency
    english_level: Optional[str] = None
    english_certificate: Optional[str] = None
    english_score: Optional[str] = None
    german_level: Optional[str] = None
    german_certificate: Optional[str] = None
    german_score: Optional[str] = None
    other_languages: Optional[List[LanguageInfo]] = None
    
    # Preferences
    desired_degree: Optional[str] = None
    desired_fields: Optional[List[str]] = None
    preferred_cities: Optional[List[str]] = None
    preferred_universities: Optional[List[str]] = None
    preferred_language: Optional[str] = None
    
    # Extended Preferences
    university_type: Optional[str] = None
    intake_semester: Optional[str] = None
    program_format: Optional[str] = None
    accommodation_preference: Optional[str] = None
    career_goals: Optional[str] = None
    special_requirements: Optional[List[str]] = None
    interests_hobbies: Optional[List[str]] = None
    
    # Budget
    budget_range: Optional[str] = None
    needs_funding: Optional[str] = None
    
    # Document paths
    transcript_path: Optional[str] = None
    cv_path: Optional[str] = None
    
    # Parsed data
    parsed_transcript: Optional[dict] = None
    parsed_cv: Optional[dict] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============== Application Schemas ==============

class UserApplicationCreate(BaseModel):
    """Schema for creating an application"""
    program_id: int
    user_notes: Optional[str] = None


class UserApplicationUpdate(BaseModel):
    """Schema for updating an application"""
    status: Optional[ApplicationStatus] = None
    user_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    visa_appointment_date: Optional[datetime] = None


class UserApplicationResponse(BaseModel):
    """Application response schema"""
    id: int
    user_id: int
    program_id: int
    status: ApplicationStatus
    match_score: Optional[float] = None
    user_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    visa_appointment_date: Optional[datetime] = None
    checklist_progress: int = 0
    current_phase: str = "Documents"
    
    # Include program info
    program: Optional["ProgramResponse"] = None
    
    class Config:
        from_attributes = True


# Import here to avoid circular imports
from app.schemas.program import ProgramResponse
UserApplicationResponse.model_rebuild()
