"""
Scholarship model for Scholarships
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Scholarship(Base):
    """Scholarship model matching DAAD scholarship data structure"""
    __tablename__ = "scholarships"
    
    id = Column(Integer, primary_key=True, index=True)
    scholarship_id = Column(Integer, unique=True, index=True, nullable=False)
    
    # Basic Information
    title = Column(String(500), nullable=False, index=True)
    link = Column(String(500), nullable=True)
    
    # Details
    objective = Column(Text, nullable=True)
    eligibility = Column(Text, nullable=True)
    value_benefits = Column(Text, nullable=True)
    duration = Column(String(500), nullable=True)
    deadline = Column(Text, nullable=True)
    selection_criteria = Column(Text, nullable=True)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Scholarship(id={self.id}, title={self.title})>"
