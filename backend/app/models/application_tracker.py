"""
Application Tracker models for comprehensive admission tracking
"""
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class ChecklistCategory(str, enum.Enum):
    """Categories for checklist items"""
    PROFILE_SETUP = "profile_setup"
    ELIGIBILITY = "eligibility"
    LANGUAGE = "language"
    DOCUMENTS = "documents"
    HEC_VERIFICATION = "hec_verification"
    UNIVERSITY_APPLICATION = "university_application"
    ADMISSION_CONFIRMATION = "admission_confirmation"
    FINANCIAL_DOCUMENTS = "financial_documents"
    VISA_PROCESS = "visa_process"


class ChecklistStatus(str, enum.Enum):
    """Status options for checklist items"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    NOT_APPLICABLE = "not_applicable"


class DocumentType(str, enum.Enum):
    """Document types for applications"""
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


class LanguageTestType(str, enum.Enum):
    """Language test types"""
    IELTS = "ielts"
    TOEFL = "toefl"
    PTE = "pte"
    DUOLINGO = "duolingo"
    TESTDAF = "testdaf"
    DSH = "dsh"
    GOETHE = "goethe"
    TELC = "telc"


class HECVerificationStatus(str, enum.Enum):
    """HEC verification status options"""
    NOT_STARTED = "not_started"
    DOCUMENTS_GATHERED = "documents_gathered"
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    VERIFIED = "verified"
    REJECTED = "rejected"


class ApplicationChecklistItem(Base):
    """Individual checklist items for application tracking"""
    __tablename__ = "application_checklist_items"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("user_applications.id", ondelete="CASCADE"), nullable=False)
    
    # Item details
    category = Column(Enum(ChecklistCategory), nullable=False)
    item_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Status tracking
    status = Column(Enum(ChecklistStatus), default=ChecklistStatus.NOT_STARTED, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Dates
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Order for display
    display_order = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    application = relationship("UserApplication", backref="checklist_items")
    
    def __repr__(self):
        return f"<ChecklistItem(id={self.id}, category={self.category}, item={self.item_name}, status={self.status})>"


class DocumentRequirement(Base):
    """Track required documents for each application"""
    __tablename__ = "document_requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("user_applications.id", ondelete="CASCADE"), nullable=False)
    
    # Document details
    document_type = Column(Enum(DocumentType), nullable=False)
    document_name = Column(String(255), nullable=True)  # Custom name if type is OTHER
    is_required = Column(Boolean, default=True)
    
    # Status
    status = Column(Enum(ChecklistStatus), default=ChecklistStatus.NOT_STARTED, nullable=False)
    
    # File info
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    
    # Verification
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String(255), nullable=True)  # Who verified it
    
    # Notes
    notes = Column(Text, nullable=True)
    requirements_text = Column(Text, nullable=True)  # Specific format requirements
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    application = relationship("UserApplication", backref="document_requirements")
    
    def __repr__(self):
        return f"<DocumentRequirement(id={self.id}, type={self.document_type}, status={self.status})>"


class LanguageProficiencyRecord(Base):
    """Store language test scores for users"""
    __tablename__ = "language_proficiency_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Test details
    test_type = Column(Enum(LanguageTestType), nullable=False)
    language = Column(String(50), default="english")  # english, german, etc.
    
    # Scores
    overall_score = Column(String(20), nullable=True)
    band_scores = Column(JSON, nullable=True)  # e.g., {"listening": 7.0, "reading": 7.5, "writing": 6.5, "speaking": 7.0}
    
    # Test dates
    test_date = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)  # Usually 2 years from test date
    
    # Certificate file
    certificate_path = Column(String(500), nullable=True)
    
    # Additional info
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="language_records")
    
    def __repr__(self):
        return f"<LanguageProficiency(id={self.id}, test={self.test_type}, score={self.overall_score})>"


class HECVerification(Base):
    """Track HEC (Higher Education Commission) verification for Pakistan users"""
    __tablename__ = "hec_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Degree info
    degree_type = Column(String(100), nullable=False)  # Bachelor, Masters, etc.
    degree_name = Column(String(255), nullable=True)
    university_name = Column(String(300), nullable=True)
    graduation_year = Column(String(10), nullable=True)
    
    # Verification details
    verification_status = Column(Enum(HECVerificationStatus), default=HECVerificationStatus.NOT_STARTED)
    tracking_number = Column(String(100), nullable=True)
    
    # Dates
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    expected_completion = Column(DateTime(timezone=True), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Documents
    verification_letter_path = Column(String(500), nullable=True)
    
    # Cost tracking
    fee_paid = Column(Float, nullable=True)
    fee_currency = Column(String(10), default="PKR")
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="hec_verifications")
    
    def __repr__(self):
        return f"<HECVerification(id={self.id}, degree={self.degree_type}, status={self.verification_status})>"


class ApplicationCredential(Base):
    """Store portal credentials for university applications"""
    __tablename__ = "application_credentials"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("user_applications.id", ondelete="CASCADE"), nullable=False)
    
    # Portal details
    portal_name = Column(String(255), nullable=True)
    portal_url = Column(String(500), nullable=True)
    
    # Credentials (only username/email - no passwords for security)
    username = Column(String(255), nullable=True)
    email_used = Column(String(255), nullable=True)
    
    # Application details on portal
    portal_application_id = Column(String(100), nullable=True)  # Application ID on their system
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    application = relationship("UserApplication", backref="credentials")
    
    def __repr__(self):
        return f"<ApplicationCredential(id={self.id}, portal={self.portal_name})>"


class EligibilityRequirement(Base):
    """Track eligibility requirements for programs"""
    __tablename__ = "eligibility_requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("user_applications.id", ondelete="CASCADE"), nullable=False)
    
    # Requirement details
    requirement_type = Column(String(100), nullable=False)  # gpa, gre, experience, language, etc.
    requirement_name = Column(String(255), nullable=False)
    requirement_value = Column(String(255), nullable=True)  # What's required
    
    # User's value
    user_value = Column(String(255), nullable=True)  # What user has
    
    # Match status
    is_met = Column(Boolean, nullable=True)  # None = not checked, True/False = checked
    is_mandatory = Column(Boolean, default=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    application = relationship("UserApplication", backref="eligibility_requirements")
    
    def __repr__(self):
        return f"<EligibilityRequirement(id={self.id}, type={self.requirement_type}, met={self.is_met})>"
