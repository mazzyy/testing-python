"""
Application Tracker schemas for request/response validation
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ============== Enums as strings for API ==============

class ChecklistCategoryEnum:
    PROFILE_SETUP = "profile_setup"
    ELIGIBILITY = "eligibility"
    LANGUAGE = "language"
    DOCUMENTS = "documents"
    HEC_VERIFICATION = "hec_verification"
    UNIVERSITY_APPLICATION = "university_application"


class ChecklistStatusEnum:
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    NOT_APPLICABLE = "not_applicable"


class DocumentTypeEnum:
    PERSONAL_STATEMENT = "personal_statement"
    SOP = "sop"
    LOR = "lor"
    TRANSCRIPT = "transcript"
    DEGREE_CERTIFICATE = "degree_certificate"
    CV_RESUME = "cv_resume"
    RESEARCH_PROPOSAL = "research_proposal"
    PORTFOLIO = "portfolio"
    PASSPORT = "passport"
    LANGUAGE_CERTIFICATE = "language_certificate"
    GRE_SCORE = "gre_score"
    GMAT_SCORE = "gmat_score"
    HEC_VERIFICATION = "hec_verification"
    OTHER = "other"


# ============== Checklist Item Schemas ==============

class ChecklistItemBase(BaseModel):
    category: str
    item_name: str
    description: Optional[str] = None
    status: str = "not_started"
    notes: Optional[str] = None
    due_date: Optional[datetime] = None
    display_order: int = 0


class ChecklistItemCreate(ChecklistItemBase):
    pass


class ChecklistItemUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ChecklistItemResponse(ChecklistItemBase):
    id: int
    application_id: int
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== Document Requirement Schemas ==============

class DocumentRequirementBase(BaseModel):
    document_type: str
    document_name: Optional[str] = None
    is_required: bool = True
    requirements_text: Optional[str] = None


class DocumentRequirementCreate(DocumentRequirementBase):
    pass


class DocumentRequirementUpdate(BaseModel):
    status: Optional[str] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    is_verified: Optional[bool] = None
    notes: Optional[str] = None


class DocumentRequirementResponse(DocumentRequirementBase):
    id: int
    application_id: int
    status: str
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    is_verified: bool = False
    verified_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== Language Proficiency Schemas ==============

class LanguageProficiencyBase(BaseModel):
    test_type: str
    language: str = "english"
    overall_score: Optional[str] = None
    band_scores: Optional[Dict[str, Any]] = None
    test_date: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None


class LanguageProficiencyCreate(LanguageProficiencyBase):
    pass


class LanguageProficiencyUpdate(BaseModel):
    overall_score: Optional[str] = None
    band_scores: Optional[Dict[str, Any]] = None
    test_date: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    certificate_path: Optional[str] = None
    notes: Optional[str] = None


class LanguageProficiencyResponse(LanguageProficiencyBase):
    id: int
    user_id: int
    certificate_path: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== HEC Verification Schemas ==============

class HECVerificationBase(BaseModel):
    degree_type: str
    degree_name: Optional[str] = None
    university_name: Optional[str] = None
    graduation_year: Optional[str] = None


class HECVerificationCreate(HECVerificationBase):
    pass


class HECVerificationUpdate(BaseModel):
    verification_status: Optional[str] = None
    tracking_number: Optional[str] = None
    submitted_at: Optional[datetime] = None
    expected_completion: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    verification_letter_path: Optional[str] = None
    fee_paid: Optional[float] = None
    fee_currency: Optional[str] = None
    notes: Optional[str] = None


class HECVerificationResponse(HECVerificationBase):
    id: int
    user_id: int
    verification_status: str
    tracking_number: Optional[str] = None
    submitted_at: Optional[datetime] = None
    expected_completion: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    verification_letter_path: Optional[str] = None
    fee_paid: Optional[float] = None
    fee_currency: str = "PKR"
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== Application Credential Schemas ==============

class ApplicationCredentialBase(BaseModel):
    portal_name: Optional[str] = None
    portal_url: Optional[str] = None
    username: Optional[str] = None
    email_used: Optional[str] = None
    portal_application_id: Optional[str] = None
    notes: Optional[str] = None


class ApplicationCredentialCreate(ApplicationCredentialBase):
    password: Optional[str] = None


class ApplicationCredentialUpdate(ApplicationCredentialBase):
    pass


class ApplicationCredentialResponse(ApplicationCredentialBase):
    id: int
    application_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== Eligibility Requirement Schemas ==============

class EligibilityRequirementBase(BaseModel):
    requirement_type: str
    requirement_name: str
    requirement_value: Optional[str] = None
    user_value: Optional[str] = None
    is_met: Optional[bool] = None
    is_mandatory: bool = True
    notes: Optional[str] = None


class EligibilityRequirementCreate(EligibilityRequirementBase):
    pass


class EligibilityRequirementUpdate(BaseModel):
    user_value: Optional[str] = None
    is_met: Optional[bool] = None
    notes: Optional[str] = None


class EligibilityRequirementResponse(EligibilityRequirementBase):
    id: int
    application_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== Eligibility Assessment Schema ==============

class EligibilityAssessment(BaseModel):
    """Complete eligibility assessment for a program"""
    overall_eligibility: str  # "eligible", "partially_eligible", "not_eligible"
    eligibility_score: float  # 0-100
    
    # Academic requirements
    gpa_requirement: Optional[Dict[str, Any]] = None  # {required: "3.0", user: "3.5", met: True, note: "..."}
    degree_requirement: Optional[Dict[str, Any]] = None
    
    # Test requirements
    gre_requirement: Optional[Dict[str, Any]] = None
    gmat_requirement: Optional[Dict[str, Any]] = None
    
    # Language requirements
    english_requirement: Optional[Dict[str, Any]] = None
    german_requirement: Optional[Dict[str, Any]] = None
    
    # Experience requirements
    work_experience_requirement: Optional[Dict[str, Any]] = None
    research_experience_requirement: Optional[Dict[str, Any]] = None
    
    # Other requirements
    other_requirements: List[Dict[str, Any]] = []
    
    # Gaps and recommendations
    gaps: List[str] = []
    recommendations: List[str] = []
    
    # Summary
    summary: Optional[str] = None


# ============== Application Tracker Summary ==============

class ApplicationTrackerSummary(BaseModel):
    """Summary of all tracking data for an application"""
    application_id: int
    program_name: str
    university_name: str
    
    # Overall progress
    overall_progress: float  # 0-100
    
    # Category progress
    profile_progress: float = 0
    eligibility_progress: float = 0
    language_progress: float = 0
    documents_progress: float = 0
    hec_progress: float = 0
    application_progress: float = 0
    
    # Deadlines
    application_deadline: Optional[datetime] = None
    days_until_deadline: Optional[int] = None
    
    # Counts
    total_checklist_items: int = 0
    completed_checklist_items: int = 0
    total_documents: int = 0
    completed_documents: int = 0
    
    # Alerts
    has_urgent_items: bool = False
    urgent_items_count: int = 0


# ============== Default Checklist Templates ==============

DEFAULT_CHECKLIST_ITEMS = [
    # Profile Setup & Eligibility
    {"category": "profile_setup", "item_name": "Complete personal information", "display_order": 1},
    {"category": "profile_setup", "item_name": "Add academic background", "display_order": 2},
    {"category": "profile_setup", "item_name": "Upload transcript", "display_order": 3},
    {"category": "profile_setup", "item_name": "Upload CV/Resume", "display_order": 4},
    
    # Eligibility
    {"category": "eligibility", "item_name": "Verify GPA meets requirements", "display_order": 1},
    {"category": "eligibility", "item_name": "Check degree requirement match", "display_order": 2},
    {"category": "eligibility", "item_name": "Review GRE/GMAT requirements", "display_order": 3},
    {"category": "eligibility", "item_name": "Confirm experience requirements", "display_order": 4},
    
    # Language
    {"category": "language", "item_name": "Check language requirements", "display_order": 1},
    {"category": "language", "item_name": "Take language test (if needed)", "display_order": 2},
    {"category": "language", "item_name": "Upload language certificate", "display_order": 3},
    
    # Documents
    {"category": "documents", "item_name": "Prepare transcripts for attestation", "display_order": 1},
    {"category": "documents", "item_name": "Get certified translations (if needed)", "display_order": 2},
    {"category": "documents", "item_name": "Collect required stamps/signatures", "display_order": 3},
    
    # HEC Verification (Pakistan)
    {"category": "hec_verification", "item_name": "Gather HEC verification documents", "display_order": 1},
    {"category": "hec_verification", "item_name": "Submit to HEC portal", "display_order": 2},
    {"category": "hec_verification", "item_name": "Pay verification fee", "display_order": 3},
    {"category": "hec_verification", "item_name": "Track verification status", "display_order": 4},
    
    # University Application
    {"category": "university_application", "item_name": "Create portal account", "display_order": 1},
    {"category": "university_application", "item_name": "Fill application form", "display_order": 2},
    {"category": "university_application", "item_name": "Write Statement of Purpose", "display_order": 3},
    {"category": "university_application", "item_name": "Request Letters of Recommendation", "display_order": 4},
    {"category": "university_application", "item_name": "Upload all documents", "display_order": 5},
    {"category": "university_application", "item_name": "Pay application fee", "display_order": 6},
    {"category": "university_application", "item_name": "Submit application", "display_order": 7},
]


DEFAULT_DOCUMENT_REQUIREMENTS = [
    {"document_type": "personal_statement", "is_required": True},
    {"document_type": "sop", "is_required": True},
    {"document_type": "lor", "is_required": True, "requirements_text": "Usually 2-3 letters required"},
    {"document_type": "transcript", "is_required": True},
    {"document_type": "degree_certificate", "is_required": True},
    {"document_type": "cv_resume", "is_required": True},
    {"document_type": "passport", "is_required": True},
    {"document_type": "language_certificate", "is_required": True},
    {"document_type": "research_proposal", "is_required": False, "requirements_text": "Required for PhD programs"},
    {"document_type": "portfolio", "is_required": False, "requirements_text": "Required for design/art programs"},
]
