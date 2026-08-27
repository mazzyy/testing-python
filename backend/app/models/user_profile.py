"""
User Profile and Application models
"""
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class ApplicationStatus(str, enum.Enum):
    """Application status options"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class UserProfile(Base):
    """User academic profile for recommendations"""
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Personal Information
    full_name = Column(String(255), nullable=True)
    nationality = Column(String(100), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Academic Background
    current_degree = Column(String(100), nullable=True)  # e.g., "Bachelor", "Masters"
    field_of_study = Column(String(200), nullable=True)  # e.g., "Computer Science"
    university = Column(String(300), nullable=True)
    graduation_date = Column(String(50), nullable=True)
    cgpa = Column(Float, nullable=True)
    gpa_scale = Column(Float, nullable=True)  # e.g., 4.0, 5.0, 10.0
    
    # Courses and Skills
    relevant_courses = Column(JSON, nullable=True)  # List of courses
    skills = Column(JSON, nullable=True)  # List of skills
    honors_awards = Column(Text, nullable=True)
    
    # Work Experience
    work_experience = Column(Text, nullable=True)
    research_experience = Column(Text, nullable=True)
    
    # Language Proficiency
    english_level = Column(String(20), nullable=True)  # A1, A2, B1, B2, C1, C2
    english_certificate = Column(String(100), nullable=True)  # IELTS, TOEFL, etc.
    english_score = Column(String(50), nullable=True)
    
    german_level = Column(String(20), nullable=True)
    german_certificate = Column(String(100), nullable=True)
    german_score = Column(String(50), nullable=True)
    
    other_languages = Column(JSON, nullable=True)  # List of {language, level}
    
    # Preferences
    desired_degree = Column(String(50), nullable=True)  # Bachelor, Masters, PhD
    desired_fields = Column(JSON, nullable=True)  # List of fields
    preferred_cities = Column(JSON, nullable=True)  # List of cities
    preferred_universities = Column(JSON, nullable=True)  # List of universities
    preferred_language = Column(String(50), nullable=True)  # Preferred teaching language
    
    # Extended Preferences
    university_type = Column(String(100), nullable=True)  # Public, Private, TU9, U15, etc.
    intake_semester = Column(String(50), nullable=True)  # Winter, Summer, Both
    program_format = Column(String(50), nullable=True)  # Full-time, Part-time, Online, Hybrid
    accommodation_preference = Column(String(100), nullable=True)  # Student dorm, Private, WG
    career_goals = Column(Text, nullable=True)  # Free text career goals
    special_requirements = Column(JSON, nullable=True)  # List of special requirements
    interests_hobbies = Column(JSON, nullable=True)  # List of interests/hobbies
    
    # Budget
    budget_range = Column(String(100), nullable=True)
    needs_funding = Column(String(10), nullable=True)
    
    # Documents (stored as file paths or references)
    transcript_path = Column(String(500), nullable=True)
    cv_path = Column(String(500), nullable=True)
    degree_certificate_path = Column(String(500), nullable=True)
    language_certificate_path = Column(String(500), nullable=True)
    
    # Parsed document data
    parsed_transcript = Column(JSON, nullable=True)
    parsed_cv = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile")
    
    def __repr__(self):
        return f"<UserProfile(id={self.id}, user_id={self.user_id}, field={self.field_of_study})>"
    
    def get_recommendation_context(self) -> str:
        """Generate context string for AI recommendations"""
        parts = []
        
        if self.current_degree:
            parts.append(f"Current Education: {self.current_degree} in {self.field_of_study or 'N/A'}")
        if self.university:
            parts.append(f"University: {self.university}")
        if self.cgpa:
            scale = f"/{self.gpa_scale}" if self.gpa_scale else ""
            parts.append(f"CGPA: {self.cgpa}{scale}")
        if self.desired_degree:
            parts.append(f"Looking for: {self.desired_degree} degree")
        if self.desired_fields:
            parts.append(f"Interested in: {', '.join(self.desired_fields)}")
        if self.english_level:
            parts.append(f"English Level: {self.english_level}")
        if self.german_level:
            parts.append(f"German Level: {self.german_level}")
        if self.preferred_language:
            parts.append(f"Preferred Teaching Language: {self.preferred_language}")
        
        return "; ".join(parts)


class UserApplication(Base):
    """Track user applications to programs"""
    __tablename__ = "user_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    
    # Application Details
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT, nullable=False)
    match_score = Column(Float, nullable=True)  # AI-generated match score
    
    # Notes
    user_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Visa appointment tracking
    visa_appointment_date = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="applications")
    program = relationship("Program")
    
    def __repr__(self):
        return f"<UserApplication(id={self.id}, user_id={self.user_id}, program_id={self.program_id}, status={self.status})>"
