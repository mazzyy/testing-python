"""
Notifications API routes
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.notification import Notification, UserNotificationPreference
from app.schemas.notification import (
    NotificationResponse, NotificationListResponse, UnreadCountResponse,
    MarkReadRequest, NotificationPreferenceResponse, NotificationPreferenceUpdate
)
from app.services.notification_service import get_notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ============== Notification Endpoints ==============

@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user notifications with pagination"""
    service = get_notification_service()
    notifications, total, unread = service.get_notifications(
        db=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        unread_only=unread_only
    )
    
    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        unread_count=unread
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get unread notification count for badge"""
    service = get_notification_service()
    count = service.get_unread_count(db, current_user.id)
    return UnreadCountResponse(unread_count=count)


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a single notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    service = get_notification_service()
    service.mark_as_read(db, current_user.id, [notification_id])
    
    return {"message": "Notification marked as read"}


@router.put("/mark-all-read")
async def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    service = get_notification_service()
    updated = service.mark_as_read(db, current_user.id)
    return {"message": f"{updated} notifications marked as read"}


# ============== Preference Endpoints ==============

@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user notification preferences"""
    service = get_notification_service()
    preferences = service.get_or_create_preferences(db, current_user.id)
    return NotificationPreferenceResponse.model_validate(preferences)


@router.put("/preferences", response_model=NotificationPreferenceResponse)
async def update_preferences(
    updates: NotificationPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user notification preferences"""
    service = get_notification_service()
    preferences = service.get_or_create_preferences(db, current_user.id)
    
    # Update only provided fields
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(preferences, field, value)
    
    db.commit()
    db.refresh(preferences)
    
    return NotificationPreferenceResponse.model_validate(preferences)


# ============== Admin/Debug Endpoints ==============

@router.post("/test/deadline-reminders", include_in_schema=False)
async def test_deadline_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """[Dev Only] Manually trigger deadline reminder check"""
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    service = get_notification_service()
    count = service.send_deadline_reminders(db)
    return {"message": f"Sent {count} deadline reminders"}


@router.post("/test/visa-reminders", include_in_schema=False)
async def test_visa_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """[Dev Only] Manually trigger visa reminder check"""
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    service = get_notification_service()
    count = service.send_visa_reminders(db)
    return {"message": f"Sent {count} visa reminders"}


@router.post("/test/weekly-digest", include_in_schema=False)
async def test_weekly_digest(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """[Dev Only] Manually trigger weekly digest"""
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    service = get_notification_service()
    count = service.send_weekly_digests(db)
    return {"message": f"Sent {count} weekly digests"}
