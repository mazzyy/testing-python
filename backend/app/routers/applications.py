from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.user_profile import UserApplication, UserProfile, ApplicationStatus
from app.models.program import Program
from app.models.application_tracker import (
    ApplicationChecklistItem, DocumentRequirement, LanguageProficiencyRecord,
    HECVerification, ApplicationCredential, EligibilityRequirement,
    ChecklistCategory, ChecklistStatus, DocumentType, HECVerificationStatus
)
from app.models.vault import UserCredential, CredentialCategory
from app.schemas.profile import UserApplicationUpdate, UserApplicationResponse
from app.schemas.application_tracker import (
    ApplicationCredentialCreate, ApplicationCredentialResponse
)

router = APIRouter(tags=["Applications"])

# -----------------------------------------------------------------------------
# Tracker Initialization & Retrieval
# -----------------------------------------------------------------------------

DEFAULT_CHECKLIST = [
    (ChecklistCategory.PROFILE_SETUP, "Complete Academic Profile", "Fill in GPA, Degree details"),
    (ChecklistCategory.PROFILE_SETUP, "Check Eligibility", "Verify if you meet program requirements"),
    (ChecklistCategory.LANGUAGE, "Check Language Requirements", "IELTS/TOEFL requirements"),
    (ChecklistCategory.LANGUAGE, "Book Test Date", "If score is not valid or available"),
    (ChecklistCategory.LANGUAGE, "Take Exam", "Attend IELTS/TOEFL/German test"),
    (ChecklistCategory.LANGUAGE, "Upload Result", "Upload score certificate to Documents"),
    (ChecklistCategory.DOCUMENTS, "Gather Transcripts", "Get official transcripts from university"),
    (ChecklistCategory.DOCUMENTS, "Prepare CV/Resume", "Update CV to European format (Europass)"),
    (ChecklistCategory.DOCUMENTS, "Draft SOP/Motivation Letter", "Write program-specific letter"),
    
    
    # University Application
    (ChecklistCategory.UNIVERSITY_APPLICATION, "Create Portal Account", "Sign up on university application portal"),
    (ChecklistCategory.UNIVERSITY_APPLICATION, "Fill Application Form", "Complete online details"),
    (ChecklistCategory.UNIVERSITY_APPLICATION, "Upload Documents", "Upload all required PDFs"),
    (ChecklistCategory.UNIVERSITY_APPLICATION, "Submit Application", "Pay fee and submit"),

    # Admission Confirmation
    (ChecklistCategory.ADMISSION_CONFIRMATION, "Accept Study Place", "Accept offer via university portal"),
    (ChecklistCategory.ADMISSION_CONFIRMATION, "Health Insurance (M10)", "Trigger M10 digital notification"),
    (ChecklistCategory.ADMISSION_CONFIRMATION, "Pay Semester Contribution", "Transfer fee (approx €100-400)"),
    (ChecklistCategory.ADMISSION_CONFIRMATION, "Mail Certified Documents", "Send hard copies if required"),
    (ChecklistCategory.ADMISSION_CONFIRMATION, "Student ID Received", "Matriculation number assigned"),

    # Financial Documents
    (ChecklistCategory.FINANCIAL_DOCUMENTS, "Bank Statement (6 Months)", "Min Balance: €11,904/year"),
    (ChecklistCategory.FINANCIAL_DOCUMENTS, "Blocked Account (Sperrkonto)", "Deposit €11,904 (Deutsche Bank/Fintiba/Expatrio)"),
    (ChecklistCategory.FINANCIAL_DOCUMENTS, "Confirmation Certificate", "Upload 06 Blocked Account confirmation"),

    # Visa Process
    (ChecklistCategory.VISA_PROCESS, "Book Appointment", "Book via Embassy/Consulate in your region"),
    (ChecklistCategory.VISA_PROCESS, "Fill Videx Form", "Online Visa Application Form"),
    (ChecklistCategory.VISA_PROCESS, "Prepare File (Orig + 2 Copies)", "Arrange docs in order"),
    (ChecklistCategory.VISA_PROCESS, "Visa Interview", "Attend appointment"),
    (ChecklistCategory.VISA_PROCESS, "Passport Collection", "Pick up stamped passport")
]

# India-specific verification items
INDIA_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "APS India Registration", "Register at aps-india.de — Create account and start application"),
    (ChecklistCategory.HEC_VERIFICATION, "University Transcript ", "Get official/student copy transcripts (sealed not required for APS)"),
    (ChecklistCategory.HEC_VERIFICATION, "Degree Certificate Copy", "Get copy of degree certificate (notarized optionally)"),
    (ChecklistCategory.HEC_VERIFICATION, "APS Document Submission", "Submit documents to APS India (New Delhi) via courier"),
    (ChecklistCategory.HEC_VERIFICATION, "APS Certificate Received", "Receive APS certificate — Required for university enrollment"),
    (ChecklistCategory.HEC_VERIFICATION, "MEA Apostille (For Visa)", "Get Apostille on original degree from MEA (eApostille) for Visa/Travel"),
]

# China-specific (APS China)
CHINA_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "APS China Registration", "Register at aps.org.cn (Beijing)"),
    (ChecklistCategory.HEC_VERIFICATION, "Submit Documents to APS", "Send academic transcripts and degree certificates to APS Beijing"),
    (ChecklistCategory.HEC_VERIFICATION, "Pay APS Fee", "Transfer processing fee (approx 2500 RMB)"),
    (ChecklistCategory.HEC_VERIFICATION, "APS Verification/Interview", "Attend interview or wait for document verification (Plausibility Check)"),
    (ChecklistCategory.HEC_VERIFICATION, "APS Certificate Received", "Receive APS certificate — Mandatory for visa"),
]

# Iran-specific (Legalization)
IRAN_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Official Translation", "Translate documents to German by approved translator"),
    (ChecklistCategory.HEC_VERIFICATION, "Ministry of Justice Stamp", "Get translation stamped by Iranian Ministry of Justice"),
    (ChecklistCategory.HEC_VERIFICATION, "MFA Attestation", "Get documents legalized by Iranian Ministry of Foreign Affairs (MFA)"),
    (ChecklistCategory.HEC_VERIFICATION, "Book Legalization Appt", "Book appointment at German Embassy (via VisaMetric)"),
    (ChecklistCategory.HEC_VERIFICATION, "Embassy Legalization", "Submit documents for final legalization at German Embassy Tehran"),
]

# Turkey-specific (Apostille)
TURKEY_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Notarize Documents", "Get copies notarized by a Turkish Notary"),
    (ChecklistCategory.HEC_VERIFICATION, "Apostille (Kaymakamlik)", "Get Apostille from District Governorate (Kaymakamlik) or Governor (Valilik)"),
    (ChecklistCategory.HEC_VERIFICATION, "Translation (If needed)", "Translate to German if university documents are in Turkish only"),
]

# Bangladesh-specific (Apostille/MoFA + Embassy Verification)
BANGLADESH_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Collect Academic Documents", "Get SSC, HSC, and university transcripts/degree certificates"),
    (ChecklistCategory.HEC_VERIFICATION, "Certified Translation", "Translate all Bengali documents to German or English by certified translator"),
    (ChecklistCategory.HEC_VERIFICATION, "MoFA e-Apostille", "Get Apostille via Bangladesh MoFA e-Apostille portal (apostille.mygov.bd)"),
    (ChecklistCategory.HEC_VERIFICATION, "Embassy Verification", "German Embassy Dhaka may verify documents — submit via appointment"),
    (ChecklistCategory.HEC_VERIFICATION, "Document assembly", "Prepare originals + notarized copies + translations in order"),
]

# USA-specific (Apostille via Secretary of State)
USA_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Request Official Transcripts", "Order sealed transcripts from your university registrar"),
    (ChecklistCategory.HEC_VERIFICATION, "Apostille (Secretary of State)", "Get Apostille from your state's Secretary of State office"),
    (ChecklistCategory.HEC_VERIFICATION, "Certified Translation", "Translate documents to German by ATA-certified translator (if required)"),
    (ChecklistCategory.HEC_VERIFICATION, "Notarize Copies", "Get copies notarized by a US Notary Public"),
    (ChecklistCategory.HEC_VERIFICATION, "Document Assembly", "Prepare originals + apostilled copies in order"),
]

# UK-specific (Apostille via FCDO)
UK_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Request Official Transcripts", "Order certified transcripts from your university"),
    (ChecklistCategory.HEC_VERIFICATION, "FCDO Apostille", "Get Apostille via UK FCDO Legalisation Office (gov.uk/get-document-legalised)"),
    (ChecklistCategory.HEC_VERIFICATION, "Certified Translation", "Translate documents to German by a certified translator (if required)"),
    (ChecklistCategory.HEC_VERIFICATION, "Solicitor Certification", "Get copies certified by a UK solicitor or notary public"),
    (ChecklistCategory.HEC_VERIFICATION, "Document Assembly", "Prepare originals + apostilled copies in order"),
]

# Canada-specific (Apostille via Global Affairs Canada)
CANADA_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Request Official Transcripts", "Order sealed transcripts from your university registrar"),
    (ChecklistCategory.HEC_VERIFICATION, "Apostille (Global Affairs Canada)", "Get Apostille from Global Affairs Canada (travel.gc.ca) — available since Jan 2024"),
    (ChecklistCategory.HEC_VERIFICATION, "Notarize Copies", "Get copies notarized by a Canadian Notary Public or Commissioner of Oaths"),
    (ChecklistCategory.HEC_VERIFICATION, "Certified Translation", "Translate documents to German by CTTIC-certified translator (if required)"),
    (ChecklistCategory.HEC_VERIFICATION, "Document Assembly", "Prepare originals + apostilled copies in order"),
]

# Nigeria-specific (Federal Ministry of Education + MFA Legalization)
NIGERIA_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Collect Academic Documents", "Get official transcripts and degree certificates from your institution"),
    (ChecklistCategory.HEC_VERIFICATION, "Federal Ministry of Education", "Verify academic documents at Federal Ministry of Education, Abuja"),
    (ChecklistCategory.HEC_VERIFICATION, "MFA Legalization", "Legalize documents at Ministry of Foreign Affairs, Abuja"),
    (ChecklistCategory.HEC_VERIFICATION, "Certified Translation", "Translate documents to German by certified translator (if not in English)"),
    (ChecklistCategory.HEC_VERIFICATION, "Embassy Authentication", "Submit documents to German Embassy Abuja/Lagos for final verification"),
    (ChecklistCategory.HEC_VERIFICATION, "Document Assembly", "Prepare originals + legalized copies in order"),
]

# Russia-specific (Apostille)
RUSSIA_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Notarize Copies", "Get copies of academic documents notarized"),
    (ChecklistCategory.HEC_VERIFICATION, "Apostille (Education Ministry)", "Get Apostille on academic documents from Department of Education/Rosobrnadzor"),
    (ChecklistCategory.HEC_VERIFICATION, "Certified Translation", "Translate documents and Apostille to German by notarized translator"),
    (ChecklistCategory.HEC_VERIFICATION, "Document Assembly", "Prepare originals + apostilled notarized copies"),
]

# Egypt-specific (Legalization via TLScontact)
EGYPT_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Ministry of Foreign Affairs", "Get pre-authentication stamp from Egyptian MFA (Cairo)"),
    (ChecklistCategory.HEC_VERIFICATION, "Certified Translation", "Translate documents to German by certified translator"),
    (ChecklistCategory.HEC_VERIFICATION, "German Embassy Legalization", "Book appointment via TLScontact for legalization"),
    (ChecklistCategory.HEC_VERIFICATION, "Document Assembly", "Prepare originals + MFA stamped copies + translations"),
]

# Indonesia-specific (Apostille)
INDONESIA_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Apostille (Kemenkumham/AHU)", "Get Apostille from Ministry of Law and Human Rights (AHU Online)"),
    (ChecklistCategory.HEC_VERIFICATION, "Certified Translation", "Translate documents + Apostille to German"),
    (ChecklistCategory.HEC_VERIFICATION, "Document Assembly", "Prepare originals + apostilled copies"),
]



# Ukraine-specific (Apostille)
UKRAINE_VERIFICATION_CHECKLIST = [
    (ChecklistCategory.HEC_VERIFICATION, "Apostille Process", "Get Apostille on educational documents (Ministry of Education)"),
    (ChecklistCategory.HEC_VERIFICATION, "Translation", "Translate documents to German (Sworn translator usually required)"),
    (ChecklistCategory.HEC_VERIFICATION, "Visa Application", "Check current VisaMetric/Embassy application slots in Kyiv"),
]



COUNTRY_CONFIG = {
    "india": INDIA_VERIFICATION_CHECKLIST,
    "china": CHINA_VERIFICATION_CHECKLIST,
    "iran": IRAN_VERIFICATION_CHECKLIST,
    "turkey": TURKEY_VERIFICATION_CHECKLIST,
    "bangladesh": BANGLADESH_VERIFICATION_CHECKLIST,
    "united states": USA_VERIFICATION_CHECKLIST,
    "united kingdom": UK_VERIFICATION_CHECKLIST,
    "canada": CANADA_VERIFICATION_CHECKLIST,
    "nigeria": NIGERIA_VERIFICATION_CHECKLIST,
    "russia": RUSSIA_VERIFICATION_CHECKLIST,
    "egypt": EGYPT_VERIFICATION_CHECKLIST,
    "ukraine": UKRAINE_VERIFICATION_CHECKLIST,
    "indonesia": INDONESIA_VERIFICATION_CHECKLIST,
    "pakistan": [
        (ChecklistCategory.HEC_VERIFICATION, "IBCC Attestation (SSC/HSSC)", "Attest verify Matric/Intermediate/O/A-Levels from IBCC (ibcc.edu.pk)"),
        (ChecklistCategory.HEC_VERIFICATION, "Transcript & Degree Attestation", "Start HEC attestation via E-Portal (eservices.hec.gov.pk)"),
        (ChecklistCategory.HEC_VERIFICATION, "Document Preparation", "Ensure degrees have Controller of Exams signature/stamp"),
        (ChecklistCategory.HEC_VERIFICATION, "Document Formatting", "Details must match CNIC/Passport exactly"),
        (ChecklistCategory.HEC_VERIFICATION, "Submission Mode", "Choose Courier (TCS/Gerry's) or Walk-in (urgent)"),
        (ChecklistCategory.HEC_VERIFICATION, "Certified Translation", "If documents not in English (optional for Germany)"),
        (ChecklistCategory.HEC_VERIFICATION, "MOFA Attestation", "Verify IBCC & HEC attestations at MOFA (Camp offices or Islamabad)"),
    ]
}

DEFAULT_DOCS = [
    (DocumentType.TRANSCRIPT, "Official Transcript"),
    (DocumentType.DEGREE_CERTIFICATE, "Degree Certificate"),
    (DocumentType.CV_RESUME, "CV / Resume"),
    (DocumentType.SOP, "Statement of Purpose"),
    (DocumentType.LOR, "Letter of Recommendation (1)"),
    (DocumentType.LOR, "Letter of Recommendation (2)"),
    (DocumentType.PASSPORT, "Passport Copy"),
    (DocumentType.OTHER, "Bank Statement"),
    (DocumentType.OTHER, "Blocked Account Confirmation"),
    (DocumentType.OTHER, "Admission Letter"),
]

@router.post("/applications/{application_id}/tracker/init")
def init_tracker(application_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Initialize the comprehensive tracker for an application"""
    
    # Verify ownership
    app = db.query(UserApplication).filter(
        UserApplication.id == application_id,
        UserApplication.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Check if already initialized (check if any checklist items exist)
    existing_items = db.query(ApplicationChecklistItem).filter(ApplicationChecklistItem.application_id == application_id).count()
    if existing_items > 0:
        return {"message": "Tracker already initialized"}
        
    # Create Default Checklist
    user_nationality = (current_user.profile.nationality or "").lower()
    
    # Determine target verification list
    target_verification_list = None
    for country, checklist in COUNTRY_CONFIG.items():
        if country in user_nationality:
            target_verification_list = checklist
            break

    for cat, name, desc in DEFAULT_CHECKLIST:
        # Skip generic HEC items if we have a specific country list
        # (The original DEFAULT_CHECKLIST had hardcoded Pakistan items, we should ideally remove them from DEFAULT_CHECKLIST 
        # or filter them out here if they match HEC_VERIFICATION category)
        if cat == ChecklistCategory.HEC_VERIFICATION:
            continue
            
        item = ApplicationChecklistItem(
            application_id=application_id,
            category=cat,
            item_name=name,
            description=desc,
            status=ChecklistStatus.NOT_STARTED
        )
        db.add(item)

    # Add Country-Specific Verification Items
    if target_verification_list:
        for cat, name, desc in target_verification_list:
            item = ApplicationChecklistItem(
                application_id=application_id,
                category=cat,
                item_name=name,
                description=desc,
                status=ChecklistStatus.NOT_STARTED
            )
            db.add(item)
    else:
        # Fallback: If no specific country, maybe add generic advice or nothing?
        # For now, we add nothing or maybe keep Pakistan as default if logic dictates? 
        # Actually existing logic defaulted to Pakistan for everyone if not filtered.
        # Let's assume if not matched, we don't add verification steps or add a generic one.
        pass
        
    # Create Default Documents
    for dtype, name in DEFAULT_DOCS:
        doc = DocumentRequirement(
            application_id=application_id,
            document_type=dtype,
            document_name=name,
            status=ChecklistStatus.NOT_STARTED,
            is_required=True
        )
        db.add(doc)
        
    db.commit()
    return {"message": "Tracker initialized successfully"}


@router.post("/applications/{application_id}/tracker/reinit")
def reinit_tracker(application_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Re-initialize the tracker checklist for an application.
    Deletes existing checklist items and recreates them based on the user's current nationality.
    Document requirements are preserved."""
    
    app = db.query(UserApplication).filter(
        UserApplication.id == application_id,
        UserApplication.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Delete existing checklist items (NOT documents — those have user uploads)
    db.query(ApplicationChecklistItem).filter(
        ApplicationChecklistItem.application_id == application_id
    ).delete()
    
    # Re-create based on current nationality
    user_nationality = (current_user.profile.nationality or "").lower()
    
    target_verification_list = None
    for country, checklist in COUNTRY_CONFIG.items():
        if country in user_nationality:
            target_verification_list = checklist
            break
    
    for cat, name, desc in DEFAULT_CHECKLIST:
        if cat == ChecklistCategory.HEC_VERIFICATION:
            continue
        item = ApplicationChecklistItem(
            application_id=application_id,
            category=cat,
            item_name=name,
            description=desc,
            status=ChecklistStatus.NOT_STARTED
        )
        db.add(item)
    
    if target_verification_list:
        for cat, name, desc in target_verification_list:
            item = ApplicationChecklistItem(
                application_id=application_id,
                category=cat,
                item_name=name,
                description=desc,
                status=ChecklistStatus.NOT_STARTED
            )
            db.add(item)
    
    db.commit()
    return {"message": "Tracker re-initialized with current nationality settings"}


@router.get("/applications/{application_id}/tracker")
def get_tracker_details(application_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get full tracker state including checklist, docs, etc."""
    
    app = db.query(UserApplication).filter(
        UserApplication.id == application_id,
        UserApplication.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Auto-Complete "Complete Academic Profile" if profile data is sufficient
    if current_user.profile and current_user.profile.cgpa and current_user.profile.current_degree:
        profile_item = db.query(ApplicationChecklistItem).filter(
            ApplicationChecklistItem.application_id == application_id,
            ApplicationChecklistItem.item_name == "Complete Academic Profile"
        ).first()
        if profile_item and profile_item.status != ChecklistStatus.COMPLETED:
            profile_item.status = ChecklistStatus.COMPLETED
            profile_item.completed_at = func.now()
            db.commit()
            
    # Auto-Complete "Check Eligibility" if eligibility checks exist
    eligibility_exists = db.query(EligibilityRequirement).filter(
        EligibilityRequirement.application_id == application_id
    ).count() > 0
    
    if eligibility_exists:
        eligibility_item = db.query(ApplicationChecklistItem).filter(
            ApplicationChecklistItem.application_id == application_id,
            ApplicationChecklistItem.item_name == "Check Eligibility"
        ).first()
        if eligibility_item and eligibility_item.status != ChecklistStatus.COMPLETED:
            eligibility_item.status = ChecklistStatus.COMPLETED
            eligibility_item.completed_at = func.now()
            db.commit()

    # 1. Checklist Items
    checklist = db.query(ApplicationChecklistItem).filter(
        ApplicationChecklistItem.application_id == application_id
    ).order_by(ApplicationChecklistItem.id).all()
    
    # 2. Document Requirements
    documents = db.query(DocumentRequirement).filter(
        DocumentRequirement.application_id == application_id
    ).all()
    
    # 3. Eligibility Checks
    eligibility = db.query(EligibilityRequirement).filter(
        EligibilityRequirement.application_id == application_id
    ).all()
    
    # 4. HEC Verification (User level, not per app, but relevant here)
    hec = db.query(HECVerification).filter(HECVerification.user_id == current_user.id).all()
    
    # 5. Credentials
    credentials = db.query(ApplicationCredential).filter(
        ApplicationCredential.application_id == application_id
    ).all()
    
    return {
        "checklist": checklist,
        "documents": documents,
        "eligibility": eligibility,
        "hec_verification": hec,
        "credentials": credentials,
        "program": app.program,
        "application_status": app.status,
        "profile_gpa": {
            "cgpa": current_user.profile.cgpa,
            "scale": current_user.profile.gpa_scale
        },
        "user_nationality": current_user.profile.nationality or ""
    }


# -----------------------------------------------------------------------------
# 1.1 Profile & Eligibility
# -----------------------------------------------------------------------------

@router.post("/tools/gpa-calculator")
def calculate_gpa(
    gpa: float, 
    scale: float, 
    min_passing_grade: Optional[float] = None
):
    """
    German Grade = 1 + 3 * (N_max - N_d) / (N_max - N_min)
    where:
    N_max = max score (scale)
    N_min = min passing score (defaulting to 50% of scale if not provided, or 2.0 for 4.0 scale)
    N_d = current score (gpa)
    """
    # Use shared utility for calculation
    from app.utils.gpa_utils import calculate_german_grade
    
    result = calculate_german_grade(gpa, scale, min_passing_grade)
    
    if "error" in result:
        return {"error": result["error"]}
        
    return {
        "german_grade": result["german_grade"],
        "classification": result["classification"],
        "original_gpa": gpa,
        "scale": scale,
        "formula": "1 + 3 * (Nmax - Nd) / (Nmax - Nmin)"
    }


@router.post("/applications/{application_id}/check-eligibility")
def run_eligibility_check(
    application_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyzes program requirements vs user profile with detailed 5-point analysis:
    1. Degree Level
    2. Field of Study
    3. GPA
    4. English Level
    5. German Level
    """
    app = db.query(UserApplication).filter(UserApplication.id == application_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
        
    program = app.program
    profile = current_user.profile
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    # Clear old checks
    db.query(EligibilityRequirement).filter(EligibilityRequirement.application_id == application_id).delete()
    
    # --- 1. Degree Level ---
    target_degree = str(program.degree_type or "Master")
    user_degree = str(profile.current_degree or "Not stated")
    
    degree_met = None
    required_prev_degree = "Bachelor's Degree"
    
    # Hierarchy Check
    # If Master is target, we need Bachelor OR Master OR PhD
    # If Bachelor is target, we need High School OR Bachelor...
    
    higher_degrees = ["master", "m.sc", "msc", "m.a", "mba", "phd", "doctorate", "post doc"]
    bachelor_degrees = ["bachelor", "undergrad", "bsc", "b.sc", "ba", "b.a", "b.eng"]
    
    if "Master" in target_degree:
        required_prev_degree = "Bachelor's Degree"
        # User passes if they have a bachelor OR anything higher
        if any(x in user_degree.lower() for x in bachelor_degrees + higher_degrees):
            degree_met = True
        elif user_degree.lower() == "not stated":
            degree_met = False
        else:
            degree_met = False
            
    elif "Bachelor" in target_degree:
        required_prev_degree = "High School / A-Level"
        degree_met = True # Assume true for typical users
        
    db.add(EligibilityRequirement(
        application_id=application_id,
        requirement_type="Academic",
        requirement_name="Degree Level",
        requirement_value=f"{required_prev_degree} or higher",
        user_value=user_degree,
        is_met=degree_met,
        is_mandatory=True
    ))

    # --- 2. Field of Study ---
    import re
    
    def normalize_field(text: str) -> str:
        if not text: return ""
        text = text.lower()
        # Handle specific abbreviations and common misspellings
        text = re.sub(r'\bai\b', 'artificial intelligence', text)
        text = re.sub(r'\bml\b', 'machine learning', text)
        text = re.sub(r'\bcs\b', 'computer science', text)
        text = re.sub(r'datascience', 'data science', text)
        # Replace punctuation with spaces
        text = re.sub(r'[.,&/\-]', ' ', text)
        # Normalize spaces
        return ' '.join(text.split())

    prog_name = (program.program_name or "").lower()
    user_field_raw = profile.field_of_study or "Not stated"
    
    # 1. Normalize both
    prog_norm = normalize_field(prog_name)
    user_norm = normalize_field(user_field_raw)
    
    field_met = None
    
    # Expanded Synonym Map
    # Keys should be the "canonical" terms we might find in program names
    # Values are list of user field tokens/synonyms that would be acceptable
    # Expanded Synonym Map
    # Keys should be the "canonical" terms we might find in program names
    # Values are list of user field tokens/synonyms that would be acceptable
    # Expanded Synonym Map
    # Keys should be the "canonical" terms we might find in program names
    # Values are list of user field tokens/synonyms that would be acceptable
    related_fields_map = {
        # --- CS & AI ---
        "computer science": ["informatics", "computing", "software", "web", "data", "cyber", "ai", "artificial intelligence", "programming", "it", "information technology", "computer application", "datascience"],
        "data science": ["analysis", "statistics", "math", "analytics", "engineering", "ai", "artificial intelligence", "machine learning", "big data", "datascience", "data mining"],
        "artificial intelligence": ["ai", "data science", "datascience", "computer science", "machine learning", "robotics", "automation", "cognitive science"],
        
        # --- Engineering ---
        "engineering": ["technology", "technical", "systems", "design", "industrial", "mechanical", "electrical", "civil", "robotics", "mechatronics", "automotive", "aerospace", "chemical"],
        "mechanical engineering": ["mechanical", "mechatronics", "automotive", "aerospace", "manufacturing", "production", "materials", "robotics"],
        "electrical engineering": ["electrical", "electronics", "communication", "telecommunication", "automation", "power", "control", "instrumentation"],
        "civil engineering": ["civil", "structural", "construction", "environmental", "transportation", "urban", "architecture"],
        "chemical engineering": ["chemical", "process", "biochemical", "pharmaceutical", "materials", "chemistry"],
        "mechatronics": ["mechanical", "electrical", "robotics", "automation", "electronics", "systems"],
        
        # --- Business & Management ---
        "business": ["management", "commerce", "marketing", "finance", "accounting", "admin", "entrepreneurship", "mba", "economics", "supply chain", "logistics", "hr", "human resources"],
        "management": ["business", "economics", "admin", "leadership", "strategy", "project management"],
        "finance": ["accounting", "banking", "commerce", "economics", "business", "investment", "financial"],
        "marketing": ["business", "communication", "advertising", "digital media", "brand", "pr", "public relations"],
        "economics": ["business", "finance", "econometrics", "political science", "social science"],
        
        # --- Natural Sciences ---
        "physics": ["astrophysics", "mechanics", "quantum", "engineering", "materials", "applied physics"],
        "chemistry": ["biochemistry", "chemical", "materials", "pharmacy", "organic", "inorganic"],
        "biology": ["biotech", "biomedical", "life science", "biochemistry", "molecular", "genetics", "microbiology"],
        "environmental science": ["ecology", "sustainability", "geography", "geology", "earth science", "climate"],
        "mathematics": ["statistics", "analysis", "data", "applied math", "computer science", "physics"],

        # --- Health & Medicine ---
        "medicine": ["medical", "clinical", "health", "surgery", "human biology"],
        "public health": ["health", "epidemiology", "healthcare", "medicine", "social science"],
        "pharmacy": ["pharmaceutical", "chemistry", "biology", "drug", "medicine"],
        "biomedical engineering": ["biomedical", "medical", "biology", "electronics", "engineering"],

        # --- Social Sciences & Humanities ---
        "psychology": ["cognitive", "neuroscience", "behavioral", "social science", "mental health"],
        "political science": ["international relations", "politics", "governance", "public policy", "law", "history"],
        "sociology": ["social science", "anthropology", "culture", "society"],
        "international relations": ["political science", "diplomacy", "global studies", "politics"],
        
        # --- Design & Architecture ---
        "architecture": ["urban", "planning", "design", "civil", "construction", "landscape"],
        "design": ["arts", "graphic", "media", "product", "ux", "ui", "communication"],
    }
    
    req_display = "Related Field"
    
    # Identify the key domain from program name
    detected_domain = None
    
    # Priority 1: Check if the Domain Key itself is in the program name
    for domain in related_fields_map.keys():
        if domain in prog_norm:
            detected_domain = domain
            req_display = domain.title()
            break
    
    # Priority 2: Check if any Synonym is in the program name (Reverse Lookup)
    # e.g. Program="MSc AI" -> matches "artificial intelligence" domain or "data science" domain
    if not detected_domain:
        for domain, synonyms in related_fields_map.items():
            for synonym in synonyms:
                # Use word boundaries for short acronyms like 'it' or 'ai' to avoid false positives (e.g. 'wait')
                if len(synonym) <= 3:
                     if re.search(r'\b' + re.escape(synonym) + r'\b', prog_norm):
                         detected_domain = domain
                         req_display = domain.title()
                         break
                elif synonym in prog_norm:
                    detected_domain = domain
                    req_display = domain.title()
                    break
            if detected_domain:
                break
            
    if user_field_raw.lower() in ["not stated", ""]:
        field_met = False
    else:
        # Check A: Direct overlap of normalized strings
        # e.g. "Data, Science" -> "data science" == "data science"
        if prog_norm in user_norm or user_norm in prog_norm:
             field_met = True
             
        # Check A2: Direct overlap of whitespace-stripped strings
        # e.g. "datascience" == "datascience"
        if not field_met:
            prog_stripped = prog_norm.replace(" ", "")
            user_stripped = user_norm.replace(" ", "")
            if prog_stripped in user_stripped or user_stripped in prog_stripped:
                field_met = True

        # Check B: Token overlap
        # If user has "AI Engineer", and program is "Data Science" -> "ai" token matches?
        if not field_met and detected_domain:
             allowed_synonyms = related_fields_map[detected_domain]
             
             # Also allow the domain name itself as a valid user field
             if detected_domain in user_norm:
                 field_met = True
             
             if not field_met: 
                 # Check if any allowed synonym is present in user field
                 for synonym in allowed_synonyms:
                     if len(synonym) <= 3:
                         if re.search(r'\b' + re.escape(synonym) + r'\b', user_norm):
                             field_met = True
                             req_display += f" (matched via '{synonym}')"
                             break
                     elif synonym in user_norm:
                         field_met = True
                         req_display += f" (matched via '{synonym}')"
                         break
        
        # Check C: Fallback for generic "Related" check
        if not field_met:
            # Simple token intersection
            prog_tokens = set(prog_norm.split())
            user_tokens = set(user_norm.split())
            common = prog_tokens.intersection(user_tokens)
            
            # Remove common stop words to avoid matching on "of", "in", "and"
            stop_words = {"in", "of", "and", "the", "for", "a", "an", "master", "bachelor", "science", "arts", "msc", "bsc"}
            common = common - stop_words
            
            if len(common) > 0:
                field_met = True
                
        if field_met is None:
            field_met = False

    db.add(EligibilityRequirement(
        application_id=application_id,
        requirement_type="Academic",
        requirement_name="Field of Study",
        requirement_value=req_display,
        user_value=user_field_raw,
        is_met=field_met,
        is_mandatory=True
    ))
    
    # --- 3. GPA / CGPA ---
    # Just show the comparison
    db.add(EligibilityRequirement(
        application_id=application_id,
        requirement_type="Academic",
        requirement_name="GPA / CGPA",
        requirement_value="Varies (See Requirements)",
        user_value=f"{profile.cgpa}/{profile.gpa_scale}" if profile.cgpa else "Not Set",
        is_met=True if profile.cgpa else False, 
        is_mandatory=True
    ))

    # --- 4. English Level ---
    req_text = (program.language_requirements or "").lower()
    user_eng = (profile.english_level or "Not stated").upper()
    user_cert = (profile.english_certificate or "").upper()
    
    eng_met = None
    req_eng = "B2" # Default heuristic
    
    if "c1" in req_text: req_eng = "C1"
    elif "b2" in req_text: req_eng = "B2"
    elif "ielts" in req_text: req_eng = "IELTS 6.0+"
    
    # Helper for Language Levels
    def get_lang_score(lvl):
        lvl = lvl.upper()
        if "C2" in lvl: return 6
        if "C1" in lvl: return 5
        if "B2" in lvl: return 4
        if "B1" in lvl: return 3
        if "A2" in lvl: return 2
        if "A1" in lvl: return 1
        return 0
        
    req_score = get_lang_score(req_eng)
    user_score = get_lang_score(user_eng)
    
    # Check
    if "ielts" in req_text and "IELTS" in user_cert:
        eng_met = True
    elif user_score >= req_score and user_score > 0:
        eng_met = True
    elif user_eng == "NOT STATED":
        eng_met = False
    else:
        eng_met = False
        
    db.add(EligibilityRequirement(
        application_id=application_id,
        requirement_type="Language",
        requirement_name="English Level",
        requirement_value=req_eng,
        user_value=f"{user_eng} ({user_cert})" if user_cert else user_eng,
        is_met=eng_met,
        is_mandatory=True
    ))
    
    # --- 5. German Level ---
    user_ger = (profile.german_level or "Not stated").upper()
    req_ger = "A1" # Default
    
    # Check for explicit "English Taught" signals or "No German"
    # Logic: If it mentions German but also says "not required" or "no german", ignore it.
    
    requires_german = "german" in req_text
    
    negative_phrases = [
        "no german", "german not required", "not mandatory", "english only", "entirely in english", "100% english",
        "can be fulfilled", "during the program", "after admission", "end of the", "within the first",
        "is not necessary", "no knowledge of german", "not a requirement", "optional", "knowledge of german is not"
    ]
    if any(phrase in req_text for phrase in negative_phrases):
        requires_german = False
        
    if requires_german:
        if "c1" in req_text: req_ger = "C1"
        elif "b2" in req_text: req_ger = "B2"
        elif "b1" in req_text: req_ger = "B1"
        elif "a2" in req_text: req_ger = "A2"
        else: req_ger = "A1"
    else:
        req_ger = "None (English Taught)"
        
    ger_met = True
    if "None" not in req_ger:
        if user_ger == "NOT STATED":
            ger_met = False
        else:
             req_ger_score = get_lang_score(req_ger)
             user_ger_score = get_lang_score(user_ger)
             if user_ger_score < req_ger_score:
                 ger_met = False
             
    db.add(EligibilityRequirement(
        application_id=application_id,
        requirement_type="Language",
        requirement_name="German Level",
        requirement_value=req_ger,
        user_value=user_ger,
        is_met=ger_met,
        is_mandatory="german" in req_text
    ))

    # --- Auto-Complete Checklist Items ---
    # 1. "Check Eligibility"
    eligibility_item = db.query(ApplicationChecklistItem).filter(
        ApplicationChecklistItem.application_id == application_id,
        ApplicationChecklistItem.item_name == "Check Eligibility"
    ).first()
    
    if eligibility_item and eligibility_item.status != ChecklistStatus.COMPLETED:
        eligibility_item.status = ChecklistStatus.COMPLETED
        eligibility_item.completed_at = func.now()
        
    # 2. "Complete Academic Profile" (Check if profile data is sufficient)
    # We consider it complete if CGPA and Degree are present
    if profile.cgpa and profile.current_degree:
        profile_item = db.query(ApplicationChecklistItem).filter(
            ApplicationChecklistItem.application_id == application_id,
            ApplicationChecklistItem.item_name == "Complete Academic Profile"
        ).first()
        
        if profile_item and profile_item.status != ChecklistStatus.COMPLETED:
            profile_item.status = ChecklistStatus.COMPLETED
            profile_item.completed_at = func.now()

    db.commit()
    return {"message": "Detailed eligibility check complete"}

# -----------------------------------------------------------------------------
# 1.2 Language
# -----------------------------------------------------------------------------

# Using existing UserProfile fields for now, or create new LanguageProficiencyRecord
# Implementing specific endpoint to update language scores from the tracker

@router.post("/users/me/language-score")
def update_language_score(
    test_type: str,
    overall_score: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    if test_type.lower() == "ielts":
        profile.english_certificate = "IELTS"
        profile.english_score = overall_score
    elif test_type.lower() == "toefl":
        profile.english_certificate = "TOEFL"
        profile.english_score = overall_score
        
    db.commit()
    return {"message": "Score updated"}

# -----------------------------------------------------------------------------
# 1.3 HEC & Documents
# -----------------------------------------------------------------------------

@router.put("/applications/{application_id}/checklist/{item_id}")
def update_checklist_status(
    application_id: int,
    item_id: int,
    status: ChecklistStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ApplicationChecklistItem).filter(
        ApplicationChecklistItem.id == item_id,
        ApplicationChecklistItem.application_id == application_id
    ).first()
    
    if not item:
        raise HTTPException(404, "Item not found")
        
    item.status = status
    if status == ChecklistStatus.COMPLETED:
        item.completed_at = func.now()
    else:
        item.completed_at = None
        
    db.commit()
    return item

@router.post("/applications/{application_id}/credentials", response_model=ApplicationCredentialResponse)
def add_credential(
    application_id: int,
    credential: ApplicationCredentialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a credential for an application portal.
    Also automatically adds it to the user's main Vault credentials.
    """
    # 1. Create ApplicationCredential (app specific)
    # We exclude password from this model as it's not in the table
    app_cred_data = credential.dict(exclude={"password"})
    app_cred = ApplicationCredential(
        application_id=application_id,
        **app_cred_data
    )
    db.add(app_cred)
    
    # 2. Create UserCredential (Vault - general)
    # We use the portal name or a default title
    from app.models.vault import UserCredential, CredentialCategory
    
    vault_title = credential.portal_name or f"Application Portal - {application_id}"
    
    vault_cred = UserCredential(
        user_id=current_user.id,
        title=vault_title,
        url=credential.portal_url,
        username=credential.username,
        password=credential.password, # Storing password here
        category=CredentialCategory.UNIVERSITY_PORTAL,
        notes=f"Linked to Application ID: {application_id}"
    )
    db.add(vault_cred)
    
    db.commit()
    db.refresh(app_cred)
    return app_cred

@router.put("/applications/{application_id}", response_model=UserApplicationResponse)
def update_application_details(
    application_id: int,
    application_data: UserApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update application details (e.g. visa appointment date)
    """
    app = db.query(UserApplication).filter(
        UserApplication.id == application_id,
        UserApplication.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Update allowed fields
    if application_data.visa_appointment_date is not None:
        app.visa_appointment_date = application_data.visa_appointment_date
        
    if application_data.user_notes is not None:
        app.user_notes = application_data.user_notes
        
    db.commit()
    db.refresh(app)
    return app


@router.post("/applications/{application_id}/documents")
async def upload_application_document(
    application_id: int,
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document for a specific application requirement.
    """
    # Verify application ownership
    app = db.query(UserApplication).filter(
        UserApplication.id == application_id,
        UserApplication.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Find the specific document requirement
    # We try to find a matching requirement that is NOT completed, or just the first matching type
    doc_req = db.query(DocumentRequirement).filter(
        DocumentRequirement.application_id == application_id,
        DocumentRequirement.document_type == document_type
    ).first()

    # If it doesn't exist (e.g. they are uploading an 'Other' doc not in default list), create it
    if not doc_req:
        doc_req = DocumentRequirement(
            application_id=application_id,
            document_type=document_type,
            document_name=file.filename,
            is_required=False
        )
        db.add(doc_req)
        db.commit() # Commit to get ID if needed, though we reload later
        db.refresh(doc_req)

    # Save file
    # Ensure directory exists
    upload_dir = f"uploads/applications/{application_id}"
    import os
    os.makedirs(upload_dir, exist_ok=True)
    
    # Safe filename
    import shutil
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = f"{upload_dir}/{safe_filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update DocumentRequirement
    doc_req.file_path = file_path
    doc_req.file_name = file.filename
    doc_req.status = ChecklistStatus.COMPLETED # Auto-mark as completed upon upload? Usually yes.
    doc_req.updated_at = func.now()
    
    # Also find corresponding checklist item if exists and mark it?
    # The checklist items are separate from DocumentRequirements in the current model but they are related logic-wise.
    # For now, we update the DocumentRequirement status which is what the UI implementation likely tracks for the file itself.
    
    db.commit()
    db.refresh(doc_req)
    
    return doc_req

@router.post("/applications/{application_id}/documents/link-vault")
async def link_vault_document(
    application_id: int,
    vault_document_id: int = Form(...),
    document_type: DocumentType = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Link an existing Vault document to an application requirement.
    """
    # Verify application ownership
    app = db.query(UserApplication).filter(
        UserApplication.id == application_id,
        UserApplication.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify Vault document ownership
    file_path = None
    file_name = None

    if vault_document_id < 0:
        # Handle transient system documents (Profile)
        profile = current_user.profile
        if not profile:
             raise HTTPException(status_code=404, detail="User profile not found")

        if vault_document_id == -1 and profile.cv_path:
            file_path = profile.cv_path
            file_name = "CV.pdf"
        elif vault_document_id == -2 and profile.transcript_path:
            file_path = profile.transcript_path
            file_name = "Transcript.pdf"
        elif vault_document_id == -3 and profile.degree_certificate_path:
            file_path = profile.degree_certificate_path
            file_name = "Degree_Certificate.pdf"
        else:
            raise HTTPException(status_code=404, detail="System document not found or path empty")
            
    else:
        # Handle regular Vault documents
        from app.models.vault import UserDocument
        vault_doc = db.query(UserDocument).filter(
            UserDocument.id == vault_document_id,
            UserDocument.user_id == current_user.id
        ).first()

        if not vault_doc:
            raise HTTPException(status_code=404, detail="Vault document not found")
            
        file_path = vault_doc.file_path
        file_name = vault_doc.file_name

    # Find or create Document Requirement
    doc_req = db.query(DocumentRequirement).filter(
        DocumentRequirement.application_id == application_id,
        DocumentRequirement.document_type == document_type
    ).first()

    if not doc_req:
        doc_req = DocumentRequirement(
            application_id=application_id,
            document_type=document_type,
            document_name=file_name,
            is_required=False
        )
        db.add(doc_req)
    
    # Link details
    doc_req.file_path = file_path
    doc_req.file_name = file_name
    doc_req.status = ChecklistStatus.COMPLETED
    doc_req.updated_at = func.now()
    # Note: We don't change document_type of the requirement as it defines the slot, 
    # but we use the vault doc's file.

    db.commit()
    db.refresh(doc_req)
    
    return doc_req

@router.delete("/applications/{application_id}/documents/{document_type}")
async def delete_application_document(
    application_id: int,
    document_type: DocumentType,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove (unlink) a document from an application requirement.
    """
    # Verify application ownership
    app = db.query(UserApplication).filter(
        UserApplication.id == application_id,
        UserApplication.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Find the document requirement
    doc_req = db.query(DocumentRequirement).filter(
        DocumentRequirement.application_id == application_id,
        DocumentRequirement.document_type == document_type
    ).first()

    if not doc_req:
        raise HTTPException(status_code=404, detail="Document requirement not found")

    # Unlink/Reset Fields
    doc_req.file_path = None
    doc_req.file_name = None
    doc_req.status = ChecklistStatus.NOT_STARTED
    doc_req.updated_at = func.now()

    db.commit()
    db.refresh(doc_req)
    
    return {"message": "Document removed successfully", "id": doc_req.id}


# -----------------------------------------------------------------------------
# 1.4 Document Preview
# -----------------------------------------------------------------------------

@router.get("/applications/{application_id}/requirements/{requirement_id}/file")
async def preview_requirement_file(
    application_id: int,
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Serve the file attached to a specific document requirement.
    Dedicated endpoint - avoids the brittle -(1000 + req_id) vault proxy pattern.
    """
    import os
    import mimetypes
    from fastapi.responses import FileResponse

    req = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.application_id == application_id,
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Document requirement not found")

    # Ownership check via application
    app = db.query(UserApplication).filter(
        UserApplication.id == application_id,
        UserApplication.user_id == current_user.id,
    ).first()
    if not app:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not req.file_path or not os.path.exists(req.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    media_type, _ = mimetypes.guess_type(req.file_path)
    return FileResponse(
        req.file_path,
        filename=req.file_name or "document",
        media_type=media_type or "application/octet-stream",
        content_disposition_type="inline",
    )
