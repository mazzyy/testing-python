"""
Notification service for creating and managing notifications
"""
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import logging

from app.models.notification import (
    Notification, UserNotificationPreference, NotificationType, NotificationPriority
)
from app.models.user import User
from app.models.user_profile import UserApplication, ApplicationStatus
from app.models.program import Program
from app.services.email_service import get_email_service

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing notifications"""
    
    def __init__(self):
        self.email_service = get_email_service()
    
    # ============== Core Notification Functions ==============
    
    def create_notification(
        self,
        db: Session,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        link: Optional[str] = None,
        send_email: bool = True
    ) -> Notification:
        """Create an in-app notification and optionally send email"""
        
        # Check user preferences
        preferences = self.get_or_create_preferences(db, user_id)
        
        # Check if in-app notification is enabled for this type
        should_create_inapp = self._check_inapp_preference(preferences, notification_type)
        
        notification = None
        if should_create_inapp:
            notification = Notification(
                user_id=user_id,
                type=notification_type,
                priority=priority,
                title=title,
                message=message,
                link=link,
                is_read=False,
                is_email_sent=False
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)
        
        return notification
    
    def get_or_create_preferences(self, db: Session, user_id: int) -> UserNotificationPreference:
        """Get user preferences, creating default if not exists"""
        preferences = db.query(UserNotificationPreference).filter(
            UserNotificationPreference.user_id == user_id
        ).first()
        
        if not preferences:
            preferences = UserNotificationPreference(user_id=user_id)
            db.add(preferences)
            db.commit()
            db.refresh(preferences)
        
        return preferences
    
    def _check_inapp_preference(
        self, 
        preferences: UserNotificationPreference, 
        notification_type: NotificationType
    ) -> bool:
        """Check if in-app notifications are enabled for this type"""
        type_map = {
            NotificationType.DEADLINE_REMINDER: preferences.inapp_deadline_reminders,
            NotificationType.STATUS_CHANGE: preferences.inapp_status_changes,
            NotificationType.VISA_REMINDER: preferences.inapp_visa_reminders,
            NotificationType.WEEKLY_DIGEST: preferences.inapp_weekly_digest,
        }
        return type_map.get(notification_type, True)
    
    def _check_email_preference(
        self, 
        preferences: UserNotificationPreference, 
        notification_type: NotificationType
    ) -> bool:
        """Check if email notifications are enabled for this type"""
        type_map = {
            NotificationType.DEADLINE_REMINDER: preferences.email_deadline_reminders,
            NotificationType.STATUS_CHANGE: preferences.email_status_changes,
            NotificationType.VISA_REMINDER: preferences.email_visa_reminders,
            NotificationType.WEEKLY_DIGEST: preferences.email_weekly_digest,
        }
        return type_map.get(notification_type, True)
    
    # ============== Notification Retrieval ==============
    
    def get_notifications(
        self,
        db: Session,
        user_id: int,
        limit: int = 20,
        offset: int = 0,
        unread_only: bool = False
    ) -> Tuple[List[Notification], int, int]:
        """
        Get user notifications with pagination
        
        Returns:
            Tuple of (notifications, total_count, unread_count)
        """
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        total = query.count()
        unread = query.filter(Notification.is_read == False).count()
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        notifications = query.order_by(
            Notification.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return notifications, total, unread
    
    def get_unread_count(self, db: Session, user_id: int) -> int:
        """Get unread notification count"""
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
    
    def mark_as_read(
        self, 
        db: Session, 
        user_id: int, 
        notification_ids: Optional[List[int]] = None
    ) -> int:
        """Mark notifications as read. If no IDs provided, mark all as read."""
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
        
        if notification_ids:
            query = query.filter(Notification.id.in_(notification_ids))
        
        now = datetime.utcnow()
        updated = query.update({
            "is_read": True,
            "read_at": now
        }, synchronize_session=False)
        
        db.commit()
        return updated
    
    # ============== Scheduled Notification Jobs ==============
    
    def send_deadline_reminders(self, db: Session) -> int:
        """
        Check for upcoming deadlines and send reminders.
        Called by scheduler daily.
        
        Returns number of notifications sent.
        """
        sent_count = 0
        today = datetime.utcnow().date()
        
        # Get all active applications
        applications = db.query(UserApplication).filter(
            UserApplication.status.in_([
                ApplicationStatus.DRAFT,
                ApplicationStatus.SUBMITTED,
                ApplicationStatus.UNDER_REVIEW
            ])
        ).all()
        
        for app in applications:
            if not app.program:
                continue
                
            # Parse deadline from program
            deadline_str = app.program.application_deadline
            if not deadline_str:
                continue
            
            # Try to parse deadline (handle various formats)
            deadline_date = self._parse_deadline(deadline_str)
            if not deadline_date:
                continue
            
            days_remaining = (deadline_date - today).days
            
            # Send reminders at 7, 3, and 1 day(s) before
            if days_remaining in [7, 3, 1]:
                # Check if we already sent a notification for this deadline/days combo
                existing = db.query(Notification).filter(
                    Notification.user_id == app.user_id,
                    Notification.type == NotificationType.DEADLINE_REMINDER,
                    Notification.link == f"/applications/{app.id}",
                    Notification.created_at >= datetime.utcnow() - timedelta(hours=20)
                ).first()
                
                if existing:
                    continue
                
                user = app.user
                preferences = self.get_or_create_preferences(db, user.id)
                
                # Create in-app notification
                self.create_notification(
                    db=db,
                    user_id=user.id,
                    notification_type=NotificationType.DEADLINE_REMINDER,
                    title=f"Deadline in {days_remaining} day(s)",
                    message=f"{app.program.program_name} at {app.program.university_name}",
                    priority=NotificationPriority.CRITICAL,
                    link=f"/applications/{app.id}"
                )
                
                # Send email if enabled
                if self._check_email_preference(preferences, NotificationType.DEADLINE_REMINDER):
                    self.email_service.send_deadline_reminder(
                        to_email=user.email,
                        user_name=user.full_name or user.username,
                        program_name=app.program.program_name,
                        university_name=app.program.university_name,
                        deadline=deadline_str,
                        days_remaining=days_remaining,
                        application_link=f"/applications/{app.id}"
                    )
                
                sent_count += 1
        
        logger.info(f"Sent {sent_count} deadline reminders")
        return sent_count
    
    def send_visa_reminders(self, db: Session) -> int:
        """
        Check for upcoming visa appointments and send reminders.
        
        Returns number of notifications sent.
        """
        sent_count = 0
        now = datetime.utcnow()
        today = now.date()
        
        # Get applications with visa appointments
        applications = db.query(UserApplication).filter(
            UserApplication.visa_appointment_date.isnot(None)
        ).all()
        
        for app in applications:
            appointment_date = app.visa_appointment_date.date()
            days_remaining = (appointment_date - today).days
            
            # Send reminders at 3, 2, and 1 day(s) before
            if days_remaining in [3, 2, 1]:
                # Check if we already sent a notification recently
                existing = db.query(Notification).filter(
                    Notification.user_id == app.user_id,
                    Notification.type == NotificationType.VISA_REMINDER,
                    Notification.created_at >= now - timedelta(hours=20)
                ).first()
                
                if existing:
                    continue
                
                user = app.user
                preferences = self.get_or_create_preferences(db, user.id)
                
                program_name = app.program.program_name if app.program else "Your program"
                
                # Create in-app notification
                self.create_notification(
                    db=db,
                    user_id=user.id,
                    notification_type=NotificationType.VISA_REMINDER,
                    title=f"Visa Appointment in {days_remaining} day(s)",
                    message=f"Your visa appointment is on {appointment_date.strftime('%B %d, %Y')}",
                    priority=NotificationPriority.MEDIUM,
                    link=f"/applications/{app.id}"
                )
                
                # Send email if enabled
                if self._check_email_preference(preferences, NotificationType.VISA_REMINDER):
                    self.email_service.send_visa_reminder(
                        to_email=user.email,
                        user_name=user.full_name or user.username,
                        appointment_date=appointment_date.strftime('%B %d, %Y'),
                        days_remaining=days_remaining,
                        program_name=program_name
                    )
                
                sent_count += 1
        
        logger.info(f"Sent {sent_count} visa reminders")
        return sent_count
    
    def send_weekly_digests(self, db: Session) -> int:
        """
        Send weekly progress digest to all users.
        Called by scheduler weekly (Monday 9 AM).
        
        Returns number of digests sent.
        """
        sent_count = 0
        
        # Get all users with active applications
        users_with_apps = db.query(User).join(UserApplication).filter(
            UserApplication.status.in_([
                ApplicationStatus.DRAFT,
                ApplicationStatus.SUBMITTED,
                ApplicationStatus.UNDER_REVIEW
            ])
        ).distinct().all()
        
        for user in users_with_apps:
            preferences = self.get_or_create_preferences(db, user.id)
            
            if not self._check_email_preference(preferences, NotificationType.WEEKLY_DIGEST):
                continue
            
            # Get user's application stats
            applications = db.query(UserApplication).filter(
                UserApplication.user_id == user.id,
                UserApplication.status.in_([
                    ApplicationStatus.DRAFT,
                    ApplicationStatus.SUBMITTED,
                    ApplicationStatus.UNDER_REVIEW
                ])
            ).all()
            
            pending_count = len(applications)
            
            # Get upcoming deadlines
            upcoming_deadlines = []
            for app in applications:
                if app.program and app.program.application_deadline:
                    deadline = self._parse_deadline(app.program.application_deadline)
                    if deadline:
                        days = (deadline - datetime.utcnow().date()).days
                        if 0 < days <= 30:
                            upcoming_deadlines.append({
                                "program": app.program.program_name[:40],
                                "days": days
                            })
            
            upcoming_deadlines.sort(key=lambda x: x["days"])
            
            # Calculate task progress (placeholder - would integrate with checklist)
            total_tasks = pending_count * 10  # Estimate
            completed_tasks = pending_count * 6  # Estimate
            
            # Create in-app notification
            self.create_notification(
                db=db,
                user_id=user.id,
                notification_type=NotificationType.WEEKLY_DIGEST,
                title="Weekly Progress Summary",
                message=f"You have {pending_count} active applications",
                priority=NotificationPriority.LOW,
                link="/dashboard"
            )
            
            # Send email
            self.email_service.send_weekly_digest(
                to_email=user.email,
                user_name=user.full_name or user.username,
                pending_applications=pending_count,
                upcoming_deadlines=upcoming_deadlines,
                completed_tasks=completed_tasks,
                total_tasks=total_tasks
            )
            
            sent_count += 1
        
        logger.info(f"Sent {sent_count} weekly digests")
        return sent_count
    
    def send_status_change_notification(
        self,
        db: Session,
        application: UserApplication,
        old_status: str,
        new_status: str
    ) -> bool:
        """Send notification when application status changes"""
        
        user = application.user
        preferences = self.get_or_create_preferences(db, user.id)
        program = application.program
        
        if not program:
            return False
        
        # Create in-app notification
        self.create_notification(
            db=db,
            user_id=user.id,
            notification_type=NotificationType.STATUS_CHANGE,
            title=f"Application Status: {new_status.replace('_', ' ').title()}",
            message=f"{program.program_name} at {program.university_name}",
            priority=NotificationPriority.HIGH,
            link=f"/applications/{application.id}"
        )
        
        # Send email if enabled
        if self._check_email_preference(preferences, NotificationType.STATUS_CHANGE):
            self.email_service.send_status_change(
                to_email=user.email,
                user_name=user.full_name or user.username,
                program_name=program.program_name,
                university_name=program.university_name,
                old_status=old_status,
                new_status=new_status,
                application_link=f"/applications/{application.id}"
            )
        
        return True
    
    def _parse_deadline(self, deadline_str: str) -> Optional[datetime]:
        """Parse deadline string to date"""
        import re
        from datetime import datetime
        
        # Common date formats to try
        formats = [
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%m/%d/%Y",
            "%d.%m.%Y",
            "%B %d, %Y",
            "%d %B %Y",
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(deadline_str.strip(), fmt).date()
            except ValueError:
                continue
        
        # Try to extract date from text like "15 July 2026" or "July 15, 2026"
        try:
            # Look for month name pattern
            months = {
                'january': 1, 'february': 2, 'march': 3, 'april': 4,
                'may': 5, 'june': 6, 'july': 7, 'august': 8,
                'september': 9, 'october': 10, 'november': 11, 'december': 12
            }
            
            text = deadline_str.lower()
            for month_name, month_num in months.items():
                if month_name in text:
                    # Extract day and year
                    numbers = re.findall(r'\d+', deadline_str)
                    if len(numbers) >= 2:
                        day = int(numbers[0]) if int(numbers[0]) <= 31 else int(numbers[1])
                        year = int(numbers[-1]) if int(numbers[-1]) > 31 else 2026
                        from datetime import date
                        return date(year, month_num, day)
        except:
            pass
        
        return None


# Singleton instance
_notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    """Get the notification service singleton"""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service
