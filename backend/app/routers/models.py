from typing import List, Optional
from pydantic import BaseModel

class PersonalInfo(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    linkedin: Optional[str] = None
    nationality: Optional[str] = None
    date_of_birth: Optional[str] = None

class Education(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    thesis_title: Optional[str] = None
    grade: Optional[str] = None
    relevant_coursework: Optional[str] = None

class Experience(BaseModel):
    position: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

class Publication(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    journal_conference: Optional[str] = None
    year: Optional[str] = None
    doi: Optional[str] = None

class Award(BaseModel):
    title: Optional[str] = None
    issuer: Optional[str] = None
    year: Optional[str] = None
    description: Optional[str] = None

class Language(BaseModel):
    language: Optional[str] = None
    proficiency: Optional[str] = None

class CVData(BaseModel):
    personal_info: PersonalInfo = PersonalInfo()
    profile_summary: Optional[str] = None
    education: List[Education] = []
    research_experience: List[Experience] = []
    work_experience: List[Experience] = []
    publications: List[Publication] = []
    awards: List[Award] = []
    skills: List[str] = []
    languages: List[Language] = []
    certifications: List[str] = []
    references: Optional[str] = None

class CVResponse(BaseModel):
    cv_data: CVData
    formatted_cv: str
    suggestions: Optional[List[str]] = None
