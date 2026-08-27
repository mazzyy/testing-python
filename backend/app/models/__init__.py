"""Database models"""
from app.models.user import User, UserRole
from app.models.program import Program
from app.models.user_profile import UserProfile, UserApplication
from app.models.cached_recommendation import CachedRecommendation
from app.models.scholarship import Scholarship
from app.models.token_usage import TokenUsage
from app.models.cost_of_living import CostOfLiving
from app.models.notification import (
    Notification, UserNotificationPreference, NotificationType, NotificationPriority
)
from app.models.application_tracker import (
    ApplicationChecklistItem, DocumentRequirement, LanguageProficiencyRecord,
    HECVerification, ApplicationCredential, EligibilityRequirement,
    ChecklistCategory, ChecklistStatus, DocumentType, LanguageTestType, HECVerificationStatus
)

from app.models.cached_scholarship_recommendation import CachedScholarshipRecommendation
from app.models.sop_draft import SOPDraft


from app.models.vault import UserDocument, UserCredential, DocumentCategory, CredentialCategory

__all__ = [
    "User", "UserRole", "Program", "UserProfile", "UserApplication", 
    "CachedRecommendation", "Scholarship", "TokenUsage", "CostOfLiving",
    "Notification", "UserNotificationPreference", "NotificationType", "NotificationPriority",
    "ApplicationChecklistItem", "DocumentRequirement", "LanguageProficiencyRecord",
    "HECVerification", "ApplicationCredential", "EligibilityRequirement",
    "ChecklistCategory", "ChecklistStatus", "DocumentType", "LanguageTestType", "HECVerificationStatus",
    "CachedScholarshipRecommendation",
    "SOPDraft",
    "UserDocument", "UserCredential", "DocumentCategory", "CredentialCategory"
]

