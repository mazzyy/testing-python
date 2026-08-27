"""
Notification schemas for API requests and responses
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.notification import NotificationType, NotificationPriority


# ============== Notification Schemas ==============

class NotificationResponse(BaseModel):
    """Schema for notification response"""
    id: int
    user_id: int
    type: NotificationType
    priority: NotificationPriority
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Paginated notification list"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    """Unread notification count"""
    unread_count: int


class MarkReadRequest(BaseModel):
    """Request to mark notifications as read"""
    notification_ids: Optional[List[int]] = None  # If None, mark all as read


# ============== Notification Preferences Schemas ==============

class NotificationPreferenceResponse(BaseModel):
    """User notification preferences"""
    # Email preferences
    email_deadline_reminders: bool = True
    email_status_changes: bool = True
    email_visa_reminders: bool = True
    email_weekly_digest: bool = True
    
    # In-app preferences
    inapp_deadline_reminders: bool = True
    inapp_status_changes: bool = True
    inapp_visa_reminders: bool = True
    inapp_weekly_digest: bool = True
    
    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    """Update notification preferences"""
    email_deadline_reminders: Optional[bool] = None
    email_status_changes: Optional[bool] = None
    email_visa_reminders: Optional[bool] = None
    email_weekly_digest: Optional[bool] = None
    
    inapp_deadline_reminders: Optional[bool] = None
    inapp_status_changes: Optional[bool] = None
    inapp_visa_reminders: Optional[bool] = None
    inapp_weekly_digest: Optional[bool] = None
