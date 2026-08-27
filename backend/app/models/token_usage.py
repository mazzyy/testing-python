"""
Token Usage model for tracking API token consumption per user
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TokenUsage(Base):
    """Model to track API token usage per user"""
    __tablename__ = "token_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Operation context
    operation_type = Column(String(100), index=True)  # e.g., "match_score", "scholarship_eligibility", "document_parse", "chat"
    
    # Token counts
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    
    # Cost calculation
    cost_usd = Column(Float, default=0.0)
    
    # Model info
    model = Column(String(100))  # e.g., "gpt-4", "gpt-4-turbo"
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="token_usages")
    
    def __repr__(self):
        return f"<TokenUsage(id={self.id}, user_id={self.user_id}, tokens={self.total_tokens}, cost=${self.cost_usd:.4f})>"
