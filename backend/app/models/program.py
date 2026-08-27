"""
Program model for DAAD courses/programs
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class Program(Base):
    """Program/Course model matching DAAD data structure"""
    __tablename__ = "programs"
    
    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(String(50), unique=True, index=True, nullable=False)
    slug = Column(String(500), unique=True, index=True, nullable=True)
    
    # Basic Information
    url = Column(String(500), nullable=True)
    program_name = Column(String(500), nullable=False, index=True)
    university_name = Column(String(500), nullable=False, index=True)
    city = Column(String(200), nullable=True, index=True)
    degree = Column(String(300), nullable=True, index=True)
    
    # Location and Language
    course_location = Column(String(200), nullable=True)
    teaching_language = Column(JSON, nullable=True)  # List of languages
    languages = Column(Text, nullable=True)
    
    # Study Mode
    full_time_part_time = Column(JSON, nullable=True)  # List
    mode_of_study = Column(String(200), nullable=True)
    programme_duration = Column(String(100), nullable=True)
    
    # Timing
    beginning = Column(String(200), nullable=True)
    additional_info_beginning_duration_mode = Column(Text, nullable=True)
    application_deadline = Column(Text, nullable=True)
    
    # Fees
    tuition_fees_per_semester_eur = Column(String(100), nullable=True)
    additional_info_tuition_fees = Column(Text, nullable=True)
    semester_contribution = Column(Text, nullable=True)
    costs_of_living = Column(Text, nullable=True)
    
    # Program Details
    combined_masters_phd = Column(String(50), nullable=True)
    joint_double_degree = Column(String(50), nullable=True)
    description_content = Column(Text, nullable=True)
    in_cooperation_with = Column(Text, nullable=True)
    course_organisation = Column(Text, nullable=True)
    diploma_supplement_issued = Column(String(50), nullable=True)
    
    # International Elements
    international_elements = Column(JSON, nullable=True)  # List
    description_other_international_elements = Column(Text, nullable=True)
    integrated_study_abroad = Column(Text, nullable=True)
    integrated_internships = Column(Text, nullable=True)
    
    # Language Courses
    german_language_courses = Column(String(50), nullable=True)
    english_language_courses = Column(String(50), nullable=True)
    
    # Funding
    funding_opportunities = Column(Text, nullable=True)
    
    # Requirements
    academic_admission_requirements = Column(Text, nullable=True)
    language_requirements = Column(Text, nullable=True)
    
    # Application
    submit_application_to = Column(Text, nullable=True)
    
    # Support
    accommodation = Column(Text, nullable=True)
    career_advisory_services = Column(Text, nullable=True)
    support_international_students = Column(JSON, nullable=True)  # List
    general_services_support = Column(Text, nullable=True)
    
    # Contact
    contact_phone = Column(String(100), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_website = Column(String(500), nullable=True)
    contact_address = Column(Text, nullable=True)
    
    # Metadata
    degree_type = Column(String(50), nullable=True, index=True)  # Bachelor, Masters, PhD
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Program(id={self.id}, name={self.program_name}, university={self.university_name})>"
    
    def to_searchable_text(self) -> str:
        """Convert program to searchable text for vector database"""
        parts = []
        
        if self.program_name:
            parts.append(f"Program: {self.program_name}")
        if self.university_name:
            parts.append(f"University: {self.university_name}")
        if self.city:
            parts.append(f"City: {self.city}")
        if self.degree:
            parts.append(f"Degree: {self.degree}")
        if self.degree_type:
            parts.append(f"Degree Type: {self.degree_type}")
        if self.teaching_language:
            langs = ", ".join(self.teaching_language) if isinstance(self.teaching_language, list) else self.teaching_language
            parts.append(f"Teaching Language: {langs}")
        if self.description_content:
            parts.append(f"Description: {self.description_content[:1000]}")
        if self.academic_admission_requirements:
            parts.append(f"Admission Requirements: {self.academic_admission_requirements}")
        if self.language_requirements:
            parts.append(f"Language Requirements: {self.language_requirements}")
        if self.application_deadline:
            parts.append(f"Application Deadline: {self.application_deadline}")
        
        return "\n".join(parts)
