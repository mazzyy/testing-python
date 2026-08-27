"""
Background scheduler for sending notifications
Uses APScheduler to run periodic jobs
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from typing import Optional

from app.database import SessionLocal
from app.services.notification_service import get_notification_service

logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler: Optional[BackgroundScheduler] = None


def run_deadline_reminders():
    """Job: Check and send deadline reminders"""
    logger.info("Running deadline reminders job...")
    db = SessionLocal()
    try:
        service = get_notification_service()
        count = service.send_deadline_reminders(db)
        logger.info(f"Deadline reminders job completed: {count} sent")
    except Exception as e:
        logger.error(f"Deadline reminders job failed: {str(e)}")
    finally:
        db.close()


def run_visa_reminders():
    """Job: Check and send visa appointment reminders"""
    logger.info("Running visa reminders job...")
    db = SessionLocal()
    try:
        service = get_notification_service()
        count = service.send_visa_reminders(db)
        logger.info(f"Visa reminders job completed: {count} sent")
    except Exception as e:
        logger.error(f"Visa reminders job failed: {str(e)}")
    finally:
        db.close()


def run_weekly_digest():
    """Job: Send weekly progress digest"""
    logger.info("Running weekly digest job...")
    db = SessionLocal()
    try:
        service = get_notification_service()
        count = service.send_weekly_digests(db)
        logger.info(f"Weekly digest job completed: {count} sent")
    except Exception as e:
        logger.error(f"Weekly digest job failed: {str(e)}")
    finally:
        db.close()


def start_scheduler():
    """Initialize and start the background scheduler"""
    global _scheduler
    
    if _scheduler is not None:
        logger.warning("Scheduler already running")
        return
    
    _scheduler = BackgroundScheduler()
    
    # Daily at 9 AM - Check deadline reminders
    _scheduler.add_job(
        run_deadline_reminders,
        CronTrigger(hour=9, minute=0),
        id="deadline_reminders",
        name="Check and send deadline reminders",
        replace_existing=True
    )
    
    # Daily at 9 AM - Check visa appointment reminders
    _scheduler.add_job(
        run_visa_reminders,
        CronTrigger(hour=9, minute=5),
        id="visa_reminders",
        name="Check and send visa appointment reminders",
        replace_existing=True
    )
    
    # Weekly on Monday at 9 AM - Send weekly digest
    _scheduler.add_job(
        run_weekly_digest,
        CronTrigger(day_of_week="mon", hour=9, minute=30),
        id="weekly_digest",
        name="Send weekly progress digest",
        replace_existing=True
    )
    
    _scheduler.start()
    logger.info("📅 Notification scheduler started with jobs:")
    logger.info("   - Deadline reminders: Daily at 9:00 AM")
    logger.info("   - Visa reminders: Daily at 9:05 AM")
    logger.info("   - Weekly digest: Mondays at 9:30 AM")


def stop_scheduler():
    """Stop the background scheduler"""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown()
        _scheduler = None
        logger.info("Notification scheduler stopped")


def get_scheduler() -> Optional[BackgroundScheduler]:
    """Get the scheduler instance"""
    return _scheduler
