"""
Cached Recommendation model for storing AI-generated recommendations
"""
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class CachedRecommendation(Base):
    """Store cached AI recommendations to avoid recalculating match scores"""
    __tablename__ = "cached_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    
    # Cached AI results
    match_score = Column(Float, nullable=False)
    match_reasons = Column(JSON, nullable=True)  # List of reasons
    highlights = Column(Text, nullable=True)
    gaps = Column(JSON, nullable=True)  # List of potential gaps/concerns
    
    # Cache metadata
    profile_hash = Column(String(64), nullable=False, index=True)  # Hash of profile fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Ensure one cache entry per user-program-profile combination
    __table_args__ = (
        UniqueConstraint('user_id', 'program_id', 'profile_hash', name='uix_user_program_profile'),
    )
    
    # Relationships
    user = relationship("User")
    program = relationship("Program")
    
    def __repr__(self):
        return f"<CachedRecommendation(user_id={self.user_id}, program_id={self.program_id}, score={self.match_score})>"
