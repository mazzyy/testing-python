"""
Token Usage Router - Admin endpoints for viewing API token usage and costs
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models.user import User
from app.models.token_usage import TokenUsage
from app.schemas.token_usage import (
    TokenUsageStats,
    UserUsageSummary,
    UserUsageListResponse,
    UserUsageDetail,
    UserUsageDetail,
    OperationBreakdown,
    ModelBreakdown,
    UsageBreakdownResponse,
    TokenUsageRecord
)
from app.auth import get_current_admin_user

router = APIRouter(prefix="/usage", tags=["Token Usage (Admin)"])


@router.get("/stats", response_model=TokenUsageStats)
async def get_usage_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get overall token usage statistics (Admin only)
    """
    # Aggregate stats from token_usage table
    stats = db.query(
        func.coalesce(func.sum(TokenUsage.prompt_tokens), 0).label("total_prompt"),
        func.coalesce(func.sum(TokenUsage.completion_tokens), 0).label("total_completion"),
        func.coalesce(func.sum(TokenUsage.total_tokens), 0).label("total_tokens"),
        func.coalesce(func.sum(TokenUsage.cost_usd), 0.0).label("total_cost"),
        func.count(func.distinct(TokenUsage.user_id)).label("unique_users"),
        func.count(TokenUsage.id).label("total_requests")
    ).first()
    
    return TokenUsageStats(
        total_prompt_tokens=int(stats.total_prompt or 0),
        total_completion_tokens=int(stats.total_completion or 0),
        total_tokens=int(stats.total_tokens or 0),
        total_cost_usd=float(stats.total_cost or 0.0),
        unique_users=int(stats.unique_users or 0),
        total_requests=int(stats.total_requests or 0)
    )


@router.get("/users", response_model=UserUsageListResponse)
async def get_users_usage(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get paginated list of users with their token usage (Admin only)
    """
    # Subquery for aggregated usage per user
    usage_subquery = db.query(
        TokenUsage.user_id,
        func.coalesce(func.sum(TokenUsage.prompt_tokens), 0).label("total_prompt"),
        func.coalesce(func.sum(TokenUsage.completion_tokens), 0).label("total_completion"),
        func.coalesce(func.sum(TokenUsage.total_tokens), 0).label("total_tokens"),
        func.coalesce(func.sum(TokenUsage.cost_usd), 0.0).label("total_cost"),
        func.count(TokenUsage.id).label("operation_count"),
        func.max(TokenUsage.created_at).label("last_used")
    ).group_by(TokenUsage.user_id).subquery()
    
    # Query users with usage data
    query = db.query(
        User,
        usage_subquery.c.total_prompt,
        usage_subquery.c.total_completion,
        usage_subquery.c.total_tokens,
        usage_subquery.c.total_cost,
        usage_subquery.c.operation_count,
        usage_subquery.c.last_used
    ).outerjoin(
        usage_subquery, User.id == usage_subquery.c.user_id
    )
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.full_name.ilike(search_term))
        )
    
    # Order by total cost descending (highest spenders first)
    query = query.order_by(desc(usage_subquery.c.total_cost))
    
    # Get total count
    total = query.count()
    
    # Paginate
    results = query.offset((page - 1) * page_size).limit(page_size).all()
    
    users = []
    for user, prompt, completion, tokens, cost, count, last in results:
        users.append(UserUsageSummary(
            user_id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            total_prompt_tokens=int(prompt or 0),
            total_completion_tokens=int(completion or 0),
            total_tokens=int(tokens or 0),
            total_cost_usd=float(cost or 0.0),
            operation_count=int(count or 0),
            last_used=last
        ))
    
    return UserUsageListResponse(
        users=users,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/users/{user_id}", response_model=UserUsageDetail)
async def get_user_usage_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get detailed token usage for a specific user (Admin only)
    """
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Aggregate totals
    totals = db.query(
        func.coalesce(func.sum(TokenUsage.prompt_tokens), 0).label("total_prompt"),
        func.coalesce(func.sum(TokenUsage.completion_tokens), 0).label("total_completion"),
        func.coalesce(func.sum(TokenUsage.total_tokens), 0).label("total_tokens"),
        func.coalesce(func.sum(TokenUsage.cost_usd), 0.0).label("total_cost"),
        func.count(TokenUsage.id).label("operation_count")
    ).filter(TokenUsage.user_id == user_id).first()
    
    # Usage by operation type
    by_operation = db.query(
        TokenUsage.operation_type,
        func.sum(TokenUsage.prompt_tokens).label("prompt"),
        func.sum(TokenUsage.completion_tokens).label("completion"),
        func.sum(TokenUsage.total_tokens).label("tokens"),
        func.sum(TokenUsage.cost_usd).label("cost"),
        func.count(TokenUsage.id).label("count")
    ).filter(
        TokenUsage.user_id == user_id
    ).group_by(TokenUsage.operation_type).all()
    
    operation_breakdown = [
        OperationBreakdown(
            operation_type=op_type or "unknown",
            total_prompt_tokens=int(prompt or 0),
            total_completion_tokens=int(completion or 0),
            total_tokens=int(tokens or 0),
            total_cost_usd=float(cost or 0.0),
            request_count=int(count or 0)
        )
        for op_type, prompt, completion, tokens, cost, count in by_operation
    ]
    
    # Recent usage (last 50)
    recent = db.query(TokenUsage).filter(
        TokenUsage.user_id == user_id
    ).order_by(desc(TokenUsage.created_at)).limit(50).all()
    
    recent_records = [
        TokenUsageRecord(
            id=r.id,
            operation_type=r.operation_type,
            prompt_tokens=r.prompt_tokens,
            completion_tokens=r.completion_tokens,
            total_tokens=r.total_tokens,
            cost_usd=r.cost_usd,
            model=r.model,
            created_at=r.created_at
        )
        for r in recent
    ]
    
    return UserUsageDetail(
        user_id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        total_prompt_tokens=int(totals.total_prompt or 0),
        total_completion_tokens=int(totals.total_completion or 0),
        total_tokens=int(totals.total_tokens or 0),
        total_cost_usd=float(totals.total_cost or 0.0),
        operation_count=int(totals.operation_count or 0),
        usage_by_operation=operation_breakdown,
        recent_usage=recent_records
    )


@router.get("/breakdown", response_model=UsageBreakdownResponse)
async def get_usage_breakdown(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get token usage breakdown by operation type (Admin only)
    """
    # Aggregate by operation type
    by_operation = db.query(
        TokenUsage.operation_type,
        func.sum(TokenUsage.prompt_tokens).label("prompt"),
        func.sum(TokenUsage.completion_tokens).label("completion"),
        func.sum(TokenUsage.total_tokens).label("tokens"),
        func.sum(TokenUsage.cost_usd).label("cost"),
        func.count(TokenUsage.id).label("count")
    ).group_by(TokenUsage.operation_type).order_by(desc("tokens")).all()
    
    breakdown = [
        OperationBreakdown(
            operation_type=op_type or "unknown",
            total_prompt_tokens=int(prompt or 0),
            total_completion_tokens=int(completion or 0),
            total_tokens=int(tokens or 0),
            total_cost_usd=float(cost or 0.0),
            request_count=int(count or 0)
        )
        for op_type, prompt, completion, tokens, cost, count in by_operation
    ]
    
    # Aggregate by model
    by_model = db.query(
        TokenUsage.model,
        func.sum(TokenUsage.prompt_tokens).label("prompt"),
        func.sum(TokenUsage.completion_tokens).label("completion"),
        func.sum(TokenUsage.total_tokens).label("tokens"),
        func.sum(TokenUsage.cost_usd).label("cost"),
        func.count(TokenUsage.id).label("count")
    ).group_by(TokenUsage.model).order_by(desc("tokens")).all()

    model_breakdown = [
        ModelBreakdown(
            model=model or "unknown",
            total_prompt_tokens=int(prompt or 0),
            total_completion_tokens=int(completion or 0),
            total_tokens=int(tokens or 0),
            total_cost_usd=float(cost or 0.0),
            request_count=int(count or 0)
        )
        for model, prompt, completion, tokens, cost, count in by_model
    ]
    
    # Calculate totals
    total_tokens = sum(b.total_tokens for b in breakdown)
    total_cost = sum(b.total_cost_usd for b in breakdown)
    
    return UsageBreakdownResponse(
        breakdown=breakdown,
        model_breakdown=model_breakdown,
        total_tokens=total_tokens,
        total_cost_usd=total_cost
    )
