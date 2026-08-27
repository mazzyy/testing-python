"""SOP Draft model for version history"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class SOPDraft(Base):
    """Model for storing SOP drafts with version history"""
    __tablename__ = "sop_drafts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    program_id = Column(String, nullable=False)  # DAAD program ID
    program_name = Column(String, nullable=True)  # Cached program name for display
    university_name = Column(String, nullable=True)  # Cached university name
    
    version = Column(Integer, default=1)  # Version number for this program
    content = Column(Text, nullable=False)  # Generated SOP text
    word_count = Column(Integer, default=0)
    
    # Template configuration
    template_type = Column(String, default="course")  # "research" | "course" | "daad"
    target_word_count = Column(Integer, default=750)  # Requested word count
    
    # Store form inputs for regeneration
    generation_params = Column(JSON, nullable=True)
    
    # User actions
    is_favorite = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sop_drafts")

    def __repr__(self):
        return f"<SOPDraft(id={self.id}, user={self.user_id}, program={self.program_id}, v{self.version})>"
