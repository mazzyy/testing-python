"""
Program-related Pydantic schemas
"""
from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Optional, List
from datetime import datetime


class ProgramBase(BaseModel):
    """Base program schema"""
    program_id: str
    program_name: str
    university_name: str
    city: Optional[str] = None
    degree: Optional[str] = None
    degree_type: Optional[str] = None


class ProgramCreate(ProgramBase):
    """Schema for creating a new program"""
    url: Optional[str] = None
    course_location: Optional[str] = None
    teaching_language: Optional[List[str]] = None
    languages: Optional[str] = None
    full_time_part_time: Optional[List[str]] = None
    mode_of_study: Optional[str] = None
    programme_duration: Optional[str] = None
    beginning: Optional[str] = None
    additional_info_beginning_duration_mode: Optional[str] = None
    application_deadline: Optional[str] = None
    tuition_fees_per_semester_eur: Optional[str] = None
    additional_info_tuition_fees: Optional[str] = None
    semester_contribution: Optional[str] = None
    costs_of_living: Optional[str] = None
    combined_masters_phd: Optional[str] = None
    joint_double_degree: Optional[str] = None
    description_content: Optional[str] = None
    in_cooperation_with: Optional[str] = None
    course_organisation: Optional[str] = None
    diploma_supplement_issued: Optional[str] = None
    international_elements: Optional[List[str]] = None
    description_other_international_elements: Optional[str] = None
    integrated_study_abroad: Optional[str] = None
    integrated_internships: Optional[str] = None
    german_language_courses: Optional[str] = None
    english_language_courses: Optional[str] = None
    funding_opportunities: Optional[str] = None
    academic_admission_requirements: Optional[str] = None
    language_requirements: Optional[str] = None
    submit_application_to: Optional[str] = None
    accommodation: Optional[str] = None
    career_advisory_services: Optional[str] = None
    support_international_students: Optional[List[str]] = None
    general_services_support: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_website: Optional[str] = None
    contact_address: Optional[str] = None


class ProgramUpdate(BaseModel):
    """Schema for updating a program"""
    program_name: Optional[str] = None
    university_name: Optional[str] = None
    city: Optional[str] = None
    degree: Optional[str] = None
    degree_type: Optional[str] = None
    url: Optional[str] = None
    description_content: Optional[str] = None
    academic_admission_requirements: Optional[str] = None
    language_requirements: Optional[str] = None
    application_deadline: Optional[str] = None
    is_active: Optional[bool] = None


class ProgramResponse(BaseModel):
    """Program response schema"""
    id: int
    program_id: str
    slug: Optional[str] = None
    url: Optional[str] = None
    program_name: str
    university_name: str
    city: Optional[str] = None
    degree: Optional[str] = None
    degree_type: Optional[str] = None
    course_location: Optional[str] = None
    teaching_language: Optional[List[str]] = None
    languages: Optional[str] = None
    full_time_part_time: Optional[List[str]] = None
    mode_of_study: Optional[str] = None
    programme_duration: Optional[str] = None
    beginning: Optional[str] = None
    application_deadline: Optional[str] = None
    tuition_fees_per_semester_eur: Optional[str] = None
    additional_info_tuition_fees: Optional[str] = None
    semester_contribution: Optional[str] = None
    description_content: Optional[str] = None
    international_elements: Optional[List[str]] = None
    integrated_internships: Optional[str] = None
    academic_admission_requirements: Optional[str] = None
    language_requirements: Optional[str] = None
    funding_opportunities: Optional[str] = None
    contact_email: Optional[str] = None
    contact_website: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

    @field_validator('teaching_language', 'full_time_part_time', 'international_elements', mode='before')
    @classmethod
    def ensure_list(cls, v):
        if isinstance(v, str):
            import json
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
            return [v]
        return v


class ProgramListResponse(BaseModel):
    """Response for list of programs"""
    programs: List[ProgramResponse]
    total: int
    page: int
    page_size: int


class ProgramSearch(BaseModel):
    """Schema for program search filters"""
    query: Optional[str] = None
    degree_type: Optional[str] = None  # Bachelor, Masters, PhD
    city: Optional[str] = None
    university: Optional[str] = None
    teaching_language: Optional[str] = None
    field: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
