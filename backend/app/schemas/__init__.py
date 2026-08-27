"""Pydantic schemas for request/response validation"""
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserLogin,
    Token, TokenData
)
from app.schemas.program import (
    ProgramCreate, ProgramUpdate, ProgramResponse, ProgramListResponse,
    ProgramSearch
)
from app.schemas.profile import (
    UserProfileCreate, UserProfileUpdate, UserProfileResponse,
    UserApplicationCreate, UserApplicationUpdate, UserApplicationResponse
)
from app.schemas.recommendation import (
    RecommendationRequest, RecommendationResponse, ChatRequest, ChatResponse
)
from app.schemas.admin import (
    UserDetailResponse, UserStatsResponse, CachedRecommendationResponse
)
from app.schemas.application_tracker import (
    ChecklistItemCreate, ChecklistItemUpdate, ChecklistItemResponse,
    DocumentRequirementCreate, DocumentRequirementUpdate, DocumentRequirementResponse,
    LanguageProficiencyCreate, LanguageProficiencyUpdate, LanguageProficiencyResponse,
    HECVerificationCreate, HECVerificationUpdate, HECVerificationResponse,
    ApplicationCredentialCreate, ApplicationCredentialUpdate, ApplicationCredentialResponse,
    EligibilityRequirementCreate, EligibilityRequirementUpdate, EligibilityRequirementResponse,
    EligibilityAssessment, ApplicationTrackerSummary,
    DEFAULT_CHECKLIST_ITEMS, DEFAULT_DOCUMENT_REQUIREMENTS
)

__all__ = [
    "UserCreate", "UserUpdate", "UserResponse", "UserLogin",
    "Token", "TokenData",
    "ProgramCreate", "ProgramUpdate", "ProgramResponse", "ProgramListResponse",
    "ProgramSearch",
    "UserProfileCreate", "UserProfileUpdate", "UserProfileResponse",
    "UserApplicationCreate", "UserApplicationUpdate", "UserApplicationResponse",
    "RecommendationRequest", "RecommendationResponse", "ChatRequest", "ChatResponse",
    "UserDetailResponse", "UserStatsResponse", "CachedRecommendationResponse",
    "ChecklistItemCreate", "ChecklistItemUpdate", "ChecklistItemResponse",
    "DocumentRequirementCreate", "DocumentRequirementUpdate", "DocumentRequirementResponse",
    "LanguageProficiencyCreate", "LanguageProficiencyUpdate", "LanguageProficiencyResponse",
    "HECVerificationCreate", "HECVerificationUpdate", "HECVerificationResponse",
    "ApplicationCredentialCreate", "ApplicationCredentialUpdate", "ApplicationCredentialResponse",
    "EligibilityRequirementCreate", "EligibilityRequirementUpdate", "EligibilityRequirementResponse",
    "EligibilityAssessment", "ApplicationTrackerSummary",
    "DEFAULT_CHECKLIST_ITEMS", "DEFAULT_DOCUMENT_REQUIREMENTS"
]

