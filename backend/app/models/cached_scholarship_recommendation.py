"""
Cached Scholarship Recommendation model for storing AI-generated recommendations
"""
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class CachedScholarshipRecommendation(Base):
    """Store cached AI scholarship recommendations to avoid recalculating match scores"""
    __tablename__ = "cached_scholarship_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id", ondelete="CASCADE"), nullable=False)
    
    # Cached AI results
    eligibility_score = Column(Float, nullable=False)
    reasons = Column(JSON, nullable=True)  # List of reasons
    concerns = Column(JSON, nullable=True)  # List of potential gaps/concerns
    recommendation = Column(Text, nullable=True)
    
    # Cache metadata
    profile_hash = Column(String(64), nullable=False, index=True)  # Hash of profile fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Ensure one cache entry per user-scholarship-profile combination
    __table_args__ = (
        UniqueConstraint('user_id', 'scholarship_id', 'profile_hash', name='uix_user_scholarship_profile'),
    )
    
    # Relationships
    user = relationship("User")
    scholarship = relationship("Scholarship")
    
    def __repr__(self):
        return f"<CachedScholarshipRecommendation(user_id={self.user_id}, scholarship_id={self.scholarship_id}, score={self.eligibility_score})>"
