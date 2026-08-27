"""
Notification models for email and in-app notifications
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class NotificationType(str, enum.Enum):
    """Types of notifications"""
    DEADLINE_REMINDER = "deadline_reminder"
    STATUS_CHANGE = "status_change"
    VISA_REMINDER = "visa_reminder"
    WEEKLY_DIGEST = "weekly_digest"
    COMMUNITY_REPLY = "community_reply"
    COMMUNITY_LIKE = "community_like"


class NotificationPriority(str, enum.Enum):
    """Notification priority levels"""
    CRITICAL = "critical"  # Program deadlines
    HIGH = "high"          # Status changes
    MEDIUM = "medium"      # Visa reminders
    LOW = "low"            # Weekly digest


class Notification(Base):
    """In-app notifications for users"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Notification content
    type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    priority = Column(SQLEnum(NotificationPriority), default=NotificationPriority.MEDIUM, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Optional link to related entity
    link = Column(String(500), nullable=True)  # e.g., "/applications/123"
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False)
    is_email_sent = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="notifications")
    
    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type}, title={self.title[:30]})>"


class UserNotificationPreference(Base):
    """User preferences for notification settings"""
    __tablename__ = "user_notification_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Email notification preferences (all enabled by default)
    email_deadline_reminders = Column(Boolean, default=True, nullable=False)
    email_status_changes = Column(Boolean, default=True, nullable=False)
    email_visa_reminders = Column(Boolean, default=True, nullable=False)
    email_weekly_digest = Column(Boolean, default=True, nullable=False)
    
    # In-app notification preferences
    inapp_deadline_reminders = Column(Boolean, default=True, nullable=False)
    inapp_status_changes = Column(Boolean, default=True, nullable=False)
    inapp_visa_reminders = Column(Boolean, default=True, nullable=False)
    inapp_weekly_digest = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="notification_preferences")
    
    def __repr__(self):
        return f"<UserNotificationPreference(id={self.id}, user_id={self.user_id})>"
