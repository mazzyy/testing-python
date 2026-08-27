"""
Scholarship-related Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ScholarshipBase(BaseModel):
    """Base scholarship schema"""
    title: str
    link: Optional[str] = None


class ScholarshipCreate(ScholarshipBase):
    """Schema for creating a new scholarship"""
    scholarship_id: int
    objective: Optional[str] = None
    eligibility: Optional[str] = None
    value_benefits: Optional[str] = None
    duration: Optional[str] = None
    deadline: Optional[str] = None
    selection_criteria: Optional[str] = None


class ScholarshipResponse(BaseModel):
    """Scholarship response schema for list view"""
    id: int
    scholarship_id: int
    title: str
    link: Optional[str] = None
    eligibility: Optional[str] = None
    value_benefits: Optional[str] = None
    duration: Optional[str] = None
    deadline: Optional[str] = None
    is_active: bool = True
    
    class Config:
        from_attributes = True


class ScholarshipDetailResponse(ScholarshipResponse):
    """Scholarship response schema with all details"""
    objective: Optional[str] = None
    selection_criteria: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ScholarshipListResponse(BaseModel):
    """Response for list of scholarships"""
    scholarships: List[ScholarshipResponse]
    total: int
    page: int
    page_size: int


class ScholarshipEligibility(BaseModel):
    """Scholarship with eligibility information"""
    scholarship: ScholarshipResponse
    eligibility_score: int = 50
    reasons: List[str] = []
    concerns: List[str] = []
    recommendation: Optional[str] = None


class ScholarshipEligibilityResponse(BaseModel):
    """Response for eligible scholarships"""
    scholarships: List[ScholarshipEligibility]
    total: int
    missing_fields: List[str] = []
    profile_complete: bool = True
