"""
Email service for sending notifications via SMTP
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP"""
    
    def __init__(self):
        self.enabled = bool(settings.SMTP_HOST and settings.SMTP_USER)
        if not self.enabled:
            logger.info("Email service disabled - SMTP not configured")
    
    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Send an email via SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML content of the email
            text_body: Plain text fallback (optional)
        
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.enabled:
            logger.debug(f"Email not sent (disabled): {subject} -> {to_email}")
            return False
        
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email
            
            # Attach text and HTML versions
            if text_body:
                msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))
            
            # Send via SMTP
            if settings.SMTP_PORT == 465:
                # Use implicit SSL for port 465
                with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            else:
                # Use STARTTLS for 587 or others
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    if settings.SMTP_USE_TLS:
                        server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            
            logger.info(f"Email sent: {subject} -> {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    # ============== Email Templates ==============
    
    def send_password_reset_email(self, to_email: str, reset_link: str) -> bool:
        """Send password reset email"""
        subject = "🔐 Reset Your Password - UniAdvisor"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4F46E5, #3B82F6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }}
                .btn {{ background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 15px; font-weight: bold; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
                .warning {{ background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; font-size: 14px; color: #92400e; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🔐 Password Reset</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    
                    <p>We received a request to reset your password for your UniAdvisor account.</p>
                    
                    <p>Click the button below to reset your password. This link is valid for 15 minutes.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" class="btn">Reset Password</a>
                    </div>
                    
                    <div class="warning">
                        If you didn't request a password reset, you can safely ignore this email. Your password will not change.
                    </div>
                    
                    <p class="footer">
                        © 2024 UniAdvisorAI. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_body)
    
    def send_deadline_reminder(
        self, 
        to_email: str, 
        user_name: str,
        program_name: str, 
        university_name: str,
        deadline: str,
        days_remaining: int,
        application_link: str
    ) -> bool:
        """Send deadline reminder email"""
        urgency = "[WARN] URGENT: " if days_remaining <= 3 else ""
        
        subject = f"{urgency}Application Deadline in {days_remaining} day(s): {program_name}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4F46E5, #3B82F6); color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }}
                .deadline-badge {{ background: {'#dc2626' if days_remaining <= 3 else '#f59e0b'}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }}
                .program-card {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5; }}
                .btn {{ background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 15px; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">📚 UniAdvisor</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Application Deadline Reminder</p>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    
                    <p>This is a friendly reminder that your application deadline is approaching:</p>
                    
                    <div class="program-card">
                        <h3 style="margin: 0 0 10px 0; color: #4F46E5;">{program_name}</h3>
                        <p style="margin: 0; color: #64748b;">{university_name}</p>
                        <div style="margin-top: 15px;">
                            <span class="deadline-badge">{days_remaining} day(s) remaining</span>
                        </div>
                        <p style="margin: 15px 0 0 0;"><strong>Deadline:</strong> {deadline}</p>
                    </div>
                    
                    <p>Make sure you have all your documents ready and submitted before the deadline.</p>
                    
                    <a href="{application_link}" class="btn">View Application →</a>
                    
                    <p class="footer">
                        You're receiving this because you have an active application on UniAdvisor.<br>
                        <a href="#" style="color: #4F46E5;">Manage notification preferences</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_body)
    
    def send_status_change(
        self, 
        to_email: str, 
        user_name: str,
        program_name: str, 
        university_name: str,
        old_status: str,
        new_status: str,
        application_link: str
    ) -> bool:
        """Send application status change notification"""
        
        status_colors = {
            "accepted": "#22c55e",
            "rejected": "#ef4444",
            "under_review": "#f59e0b",
            "submitted": "#3b82f6",
            "draft": "#6b7280",
            "withdrawn": "#9ca3af"
        }
        
        status_emojis = {
            "accepted": "🎉",
            "rejected": "😔",
            "under_review": "[SEARCH]",
            "submitted": "📤",
            "draft": "📝",
            "withdrawn": "↩️"
        }
        
        emoji = status_emojis.get(new_status.lower(), "📋")
        color = status_colors.get(new_status.lower(), "#4F46E5")
        
        subject = f"{emoji} Application Update: {program_name} - {new_status.replace('_', ' ').title()}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4F46E5, #3B82F6); color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }}
                .status-badge {{ background: {color}; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px; }}
                .program-card {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .btn {{ background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 15px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">📚 UniAdvisor</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Application Status Update</p>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    
                    <p>Your application status has been updated:</p>
                    
                    <div class="program-card" style="text-align: center;">
                        <h3 style="margin: 0 0 5px 0;">{program_name}</h3>
                        <p style="margin: 0 0 20px 0; color: #64748b;">{university_name}</p>
                        <span class="status-badge">{emoji} {new_status.replace('_', ' ').title()}</span>
                    </div>
                    
                    <a href="{application_link}" class="btn">View Application Details →</a>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_body)
    
    def send_visa_reminder(
        self, 
        to_email: str, 
        user_name: str,
        appointment_date: str,
        days_remaining: int,
        program_name: str
    ) -> bool:
        """Send visa appointment reminder"""
        
        subject = f"🛂 Visa Appointment in {days_remaining} day(s) - Don't Forget!"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }}
                .date-badge {{ background: #10b981; color: white; padding: 15px 25px; border-radius: 12px; display: inline-block; font-size: 20px; font-weight: bold; }}
                .checklist {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .checklist li {{ margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🛂 Visa Appointment Reminder</h1>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    
                    <p>Your visa appointment is coming up!</p>
                    
                    <div style="text-align: center; margin: 25px 0;">
                        <span class="date-badge">📅 {appointment_date}</span>
                        <p style="margin-top: 10px; color: #64748b;">{days_remaining} day(s) remaining</p>
                    </div>
                    
                    <p><strong>For:</strong> {program_name}</p>
                    
                    <div class="checklist">
                        <h4 style="margin: 0 0 15px 0;">📋 Don't forget to bring:</h4>
                        <ul>
                            <li>Passport (valid for at least 6 months)</li>
                            <li>Admission letter from university</li>
                            <li>Blocked account confirmation</li>
                            <li>Health insurance proof</li>
                            <li>Completed VIDEX form</li>
                            <li>Biometric photos</li>
                            <li>Appointment confirmation</li>
                        </ul>
                    </div>
                    
                    <p>Good luck with your appointment! 🍀</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_body)
    
    def send_weekly_digest(
        self, 
        to_email: str, 
        user_name: str,
        pending_applications: int,
        upcoming_deadlines: list,
        completed_tasks: int,
        total_tasks: int
    ) -> bool:
        """Send weekly progress digest"""
        
        subject = f"📊 Your Weekly UniAdvisor Summary"
        
        deadlines_html = ""
        for deadline in upcoming_deadlines[:5]:
            deadlines_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{deadline.get('program', 'N/A')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">{deadline.get('days', 'N/A')} days</td>
            </tr>
            """
        
        if not deadlines_html:
            deadlines_html = "<tr><td colspan='2' style='padding: 10px; color: #64748b;'>No upcoming deadlines</td></tr>"
        
        progress_percent = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4F46E5, #3B82F6); color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }}
                .stat-box {{ background: white; padding: 20px; border-radius: 8px; text-align: center; }}
                .stat-number {{ font-size: 36px; font-weight: bold; color: #4F46E5; }}
                .progress-bar {{ background: #e5e7eb; border-radius: 10px; height: 20px; overflow: hidden; }}
                .progress-fill {{ background: linear-gradient(90deg, #4F46E5, #3B82F6); height: 100%; border-radius: 10px; }}
                table {{ width: 100%; border-collapse: collapse; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">📊 Weekly Progress Summary</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Here's what's happening with your applications</p>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    
                    <table style="margin: 20px 0;">
                        <tr>
                            <td style="width: 50%; padding-right: 10px;">
                                <div class="stat-box">
                                    <div class="stat-number">{pending_applications}</div>
                                    <div style="color: #64748b;">Active Applications</div>
                                </div>
                            </td>
                            <td style="width: 50%; padding-left: 10px;">
                                <div class="stat-box">
                                    <div class="stat-number">{completed_tasks}/{total_tasks}</div>
                                    <div style="color: #64748b;">Tasks Completed</div>
                                </div>
                            </td>
                        </tr>
                    </table>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin: 0 0 10px 0;">📈 Overall Progress</h4>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: {progress_percent:.0f}%;"></div>
                        </div>
                        <p style="text-align: right; margin: 5px 0 0 0; color: #64748b;">{progress_percent:.0f}% complete</p>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin: 0 0 15px 0;">⏰ Upcoming Deadlines</h4>
                        <table>
                            {deadlines_html}
                        </table>
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="#" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Dashboard →</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_body)


# Singleton instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get the email service singleton"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
