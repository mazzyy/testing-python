"""
Schemas for token usage API responses
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TokenUsageRecord(BaseModel):
    """Individual token usage record"""
    id: int
    operation_type: Optional[str] = None
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    model: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TokenUsageStats(BaseModel):
    """Overall token usage statistics"""
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    total_cost_usd: float
    unique_users: int
    total_requests: int


class UserUsageSummary(BaseModel):
    """Summary of token usage for a single user"""
    user_id: int
    username: str
    email: str
    full_name: Optional[str] = None
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    total_cost_usd: float
    operation_count: int
    last_used: Optional[datetime] = None


class UserUsageListResponse(BaseModel):
    """Paginated list of user usage summaries"""
    users: List[UserUsageSummary]
    total: int
    page: int
    page_size: int


class UserUsageDetail(BaseModel):
    """Detailed usage for a specific user"""
    user_id: int
    username: str
    email: str
    full_name: Optional[str] = None
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    total_cost_usd: float
    operation_count: int
    usage_by_operation: List["OperationBreakdown"]
    recent_usage: List[TokenUsageRecord]


class OperationBreakdown(BaseModel):
    """Token usage breakdown by operation type"""
    operation_type: str
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    total_cost_usd: float
    request_count: int


class ModelBreakdown(BaseModel):
    """Token usage breakdown by model"""
    model: str
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    total_cost_usd: float
    request_count: int


class UsageBreakdownResponse(BaseModel):
    """Overall usage breakdown by operation type and model"""
    breakdown: List[OperationBreakdown]
    model_breakdown: List[ModelBreakdown]
    total_tokens: int
    total_cost_usd: float


# Update forward references
UserUsageDetail.model_rebuild()
