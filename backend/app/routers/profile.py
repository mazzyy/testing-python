"""
Profile Router - User profile management and document uploads
"""
import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.user_profile import UserProfile, UserApplication, ApplicationStatus
from app.models.program import Program
from app.schemas.profile import (
    UserProfileCreate, UserProfileUpdate, UserProfileResponse,
    UserApplicationCreate, UserApplicationUpdate, UserApplicationResponse
)
from app.auth import get_current_user, get_current_admin_user
from app.services.document_parser import get_document_parser_service
from app.config import settings

router = APIRouter(prefix="/profile", tags=["User Profile"])

# Ensure uploads directory exists
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's profile
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create a profile first."
        )
    
    return profile


@router.post("", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a profile for the current user
    """
    # Check if profile already exists
    existing = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists. Use PUT to update."
        )
    
    # Create profile
    profile = UserProfile(
        user_id=current_user.id,
        **profile_data.model_dump()
    )
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return profile


@router.put("", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current user's profile
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        # Create if doesn't exist
        profile = UserProfile(
            user_id=current_user.id,
            **profile_data.model_dump(exclude_unset=True)
        )
        db.add(profile)
    else:
        # Update existing
        update_data = profile_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    
    return profile


@router.post("/upload-document")
async def upload_document(
    document_type: str = Form(..., description="Type: transcript, cv, degree, language_cert"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse a document (transcript, CV, degree certificate, or language certificate)
    
    The document will be parsed using AI to extract relevant information
    """
    # Validate document type
    valid_types = ['transcript', 'cv', 'degree', 'language_cert']
    if document_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type. Must be one of: {valid_types}"
        )
    
    # Validate file type
    filename = file.filename.lower()
    if not (filename.endswith('.pdf') or filename.endswith('.docx') or filename.endswith('.doc')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported"
        )
    
    # Check file size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE / (1024*1024):.1f}MB"
        )
    
    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{current_user.id}_{document_type}_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Parse document
    parser_service = get_document_parser_service()
    result = parser_service.parse_document(content, file.filename, document_type, user_id=current_user.id)
    
    # Get or create user profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    # Update profile with file path
    if document_type == 'transcript':
        profile.transcript_path = file_path
        if result['success'] and result['extracted_data']:
            profile.parsed_transcript = result['extracted_data']
    elif document_type == 'cv':
        profile.cv_path = file_path
        if result['success'] and result['extracted_data']:
            profile.parsed_cv = result['extracted_data']
    elif document_type == 'degree':
        profile.degree_certificate_path = file_path
    elif document_type == 'language_cert':
        profile.language_certificate_path = file_path
    
    # Update profile fields from parsed data
    if result['success'] and result['extracted_data']:
        data = result['extracted_data']
        
        # Debug: print extracted data and field mapping
        print(f"\n{'='*60}")
        print(f"CV UPLOAD - EXTRACTED DATA for user {current_user.id}:")
        print(f"{'='*60}")
        for key, value in data.items():
            print(f"  extracted['{key}'] = {repr(value)}")
        print(f"{'='*60}")
        print(f"FIELD MAPPING (extracted_key -> profile_field -> value):")
        print(f"  student_name -> full_name: {repr(data.get('student_name'))}")
        print(f"  nationality -> nationality: {repr(data.get('nationality'))}")
        print(f"  phone -> phone: {repr(data.get('phone'))}")
        print(f"  university -> university: {repr(data.get('university'))}")
        print(f"  degree -> current_degree: {repr(data.get('degree'))}")
        print(f"  major -> field_of_study: {repr(data.get('major'))}")
        print(f"  cgpa -> cgpa: {repr(data.get('cgpa'))}")
        print(f"  gpa_scale -> gpa_scale: {repr(data.get('gpa_scale'))}")
        print(f"  graduation_date -> graduation_date: {repr(data.get('graduation_date'))}")
        print(f"  work_experience -> work_experience: {repr(data.get('work_experience'))}")
        print(f"  research_experience -> research_experience: {repr(data.get('research_experience'))}")
        print(f"  english_level -> english_level: {repr(data.get('english_level'))}")
        print(f"  german_level -> german_level: {repr(data.get('german_level'))}")
        print(f"{'='*60}\n")
        
        # Update personal info (always overwrite with CV data)
        if data.get('student_name'):
            profile.full_name = data['student_name']
        if data.get('nationality'):
            profile.nationality = data['nationality']
        if data.get('phone'):
            profile.phone = data['phone']
        
        # Update academic info
        if data.get('university'):
            profile.university = data['university']
        if data.get('degree'):
            profile.current_degree = data['degree']
        if data.get('major'):
            profile.field_of_study = data['major']
        if data.get('cgpa'):
            try:
                profile.cgpa = float(data['cgpa'])
            except (ValueError, TypeError):
                pass
        if data.get('gpa_scale'):
            try:
                profile.gpa_scale = float(data['gpa_scale'])
            except (ValueError, TypeError):
                pass
        if data.get('graduation_date'):
            profile.graduation_date = data['graduation_date']
        
        # Update skills and courses (ensure they are lists because columns are JSON)
        if data.get('skills'):
            skills_data = data['skills']
            if isinstance(skills_data, str):
                profile.skills = [s.strip() for s in skills_data.split(',')]
            elif isinstance(skills_data, list):
                profile.skills = skills_data
                
        if data.get('courses'):
            courses_data = data['courses']
            if isinstance(courses_data, str):
                profile.relevant_courses = [c.strip() for c in courses_data.split(',')]
            elif isinstance(courses_data, list):
                profile.relevant_courses = courses_data
                
        if data.get('honors'):
            profile.honors_awards = str(data['honors'])
        
        # Update work experience
        if data.get('work_experience'):
            profile.work_experience = data['work_experience']
        if data.get('research_experience'):
            profile.research_experience = data['research_experience']
        
        # Update language info
        if data.get('english_level'):
            profile.english_level = data['english_level']
        if data.get('german_level'):
            profile.german_level = data['german_level']
    
    try:
        db.commit()
    except Exception as db_err:
        import traceback
        db.rollback()
        err_str = f"Database save error: {type(db_err).__name__}: {str(db_err)}"
        print(f"[ERROR] {err_str}", flush=True)
        return {
            "success": False,
            "document_type": document_type,
            "error": err_str
        }
    
    return {
        "success": result['success'],
        "document_type": document_type,
        "file_saved": file_path,
        "extracted_data": result['extracted_data'],
        "raw_text_preview": result['raw_text_preview'],
        "error": result['error']
    }


# ============== Applications ==============

@router.get("/applications", response_model=list[UserApplicationResponse])
async def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all applications for the current user
    """
    applications = db.query(UserApplication).filter(
        UserApplication.user_id == current_user.id
    ).all()
    
    # Load program data and calculate progress for each application
    for app in applications:
        app.program = db.query(Program).filter(Program.id == app.program_id).first()
        
        # Calculate checklist progress and current phase
        app.current_phase = "Documents" # Default
        
        if hasattr(app, 'checklist_items') and app.checklist_items:
            # Filter out hidden items (e.g. WES legacy items) - matching frontend logic
            visible_items = []
            for item in app.checklist_items:
                is_hidden = False
                if item.category in ['hec_verification', 'documents']:
                    if 'wes' in (item.item_name or '').lower():
                        is_hidden = True
                
                if not is_hidden:
                    visible_items.append(item)
            
            # Calculate Progress
            total_items = len(visible_items)
            completed = sum(1 for item in visible_items if item.status in ["completed", "not_applicable"])
            app.checklist_progress = round((completed / total_items) * 100) if total_items > 0 else 0
            
            # Calculate Phase
            # Map categories to phases
            # Documents: profile_setup, eligibility, language, documents, hec_verification
            # Application: university_application
            # Admission: admission_confirmation
            # Finance: financial_documents
            # Visa: visa_process
            
            phase_map = {
                'profile_setup': 'Documents',
                'eligibility': 'Documents',
                'language': 'Documents',
                'documents': 'Documents',
                'hec_verification': 'Documents',
                'university_application': 'Application',
                'admission_confirmation': 'Admission',
                'financial_documents': 'Finance',
                'visa_process': 'Visa'
            }
            
            ordered_phases = ['Documents', 'Application', 'Admission', 'Finance', 'Visa']
            phase_items = {p: [] for p in ordered_phases}
            
            for item in visible_items:
                # Handle Enum or string category
                cat_val = item.category.value if hasattr(item.category, 'value') else item.category
                phase = phase_map.get(cat_val)
                if phase:
                    phase_items[phase].append(item)
            
            # Determine Phase Logic:
            # 1. Start at Documents (index 0)
            # 2. If a phase has ANY activity (completed/in_progress), jump to that phase.
            # 3. If a phase is FULLY completed, jump to the NEXT phase.
            
            current_phase_index = 0
            
            for i, phase in enumerate(ordered_phases):
                items = phase_items[phase]
                if not items:
                    continue
                
                # Check 1: Has Activity?
                # If user has started working on this phase (or finished it), we are at least here.
                has_activity = any(it.status in ["completed", "in_progress"] for it in items)
                if has_activity:
                    current_phase_index = max(current_phase_index, i)
                
                # Check 2: Is Fully Completed?
                # If yes, we are ready for the NEXT phase.
                is_completed = all(it.status in ["completed", "not_applicable"] for it in items)
                if is_completed:
                    current_phase_index = max(current_phase_index, i + 1)
            
            # Ensure we don't go out of bounds (e.g. after Visa completed)
            current_phase_index = min(current_phase_index, len(ordered_phases) - 1)
            
            app.current_phase = ordered_phases[current_phase_index]

        else:
            app.checklist_progress = 0
            app.current_phase = "Documents"
            
    return applications


@router.post("/applications", response_model=UserApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_data: UserApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new application for a program
    """
    # Check if program exists
    program = db.query(Program).filter(Program.id == application_data.program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )
    
    # Check if application already exists
    existing = db.query(UserApplication).filter(
        UserApplication.user_id == current_user.id,
        UserApplication.program_id == application_data.program_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an application for this program"
        )
    
    # Create application
    application = UserApplication(
        user_id=current_user.id,
        program_id=application_data.program_id,
        user_notes=application_data.user_notes,
        status=ApplicationStatus.DRAFT
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    application.program = program
    return application


@router.put("/applications/{application_id}", response_model=UserApplicationResponse)
async def update_application(
    application_id: int,
    application_data: UserApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an application
    """
    application = db.query(UserApplication).filter(
        UserApplication.id == application_id,
        UserApplication.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Users can only update notes and visa appointment, not status
    if application_data.user_notes is not None:
        application.user_notes = application_data.user_notes
        
    if application_data.visa_appointment_date is not None:
        application.visa_appointment_date = application_data.visa_appointment_date
    
    db.commit()
    db.refresh(application)
    
    application.program = db.query(Program).filter(Program.id == application.program_id).first()
    return application


@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an application
    """
    application = db.query(UserApplication).filter(
        UserApplication.id == application_id,
        UserApplication.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    db.delete(application)
    db.commit()


# ============== Admin Application Management ==============

@router.get("/admin/applications", response_model=list[UserApplicationResponse])
async def admin_list_applications(
    user_id: Optional[int] = None,
    status_filter: Optional[ApplicationStatus] = None,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all applications (Admin only)
    """
    query = db.query(UserApplication)
    
    if user_id:
        query = query.filter(UserApplication.user_id == user_id)
    
    if status_filter:
        query = query.filter(UserApplication.status == status_filter)
    
    applications = query.all()
    
    for app in applications:
        app.program = db.query(Program).filter(Program.id == app.program_id).first()
    
    return applications


@router.put("/admin/applications/{application_id}", response_model=UserApplicationResponse)
async def admin_update_application(
    application_id: int,
    application_data: UserApplicationUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update any application (Admin only)
    
    Admins can update status and admin notes
    """
    application = db.query(UserApplication).filter(
        UserApplication.id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Track old status for notification
    old_status = application.status.value if application.status else None
    
    update_data = application_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
    
    db.commit()
    db.refresh(application)
    
    # Send status change notification if status was updated
    if application_data.status and old_status and application_data.status.value != old_status:
        from app.services.notification_service import get_notification_service
        notification_service = get_notification_service()
        notification_service.send_status_change_notification(
            db=db,
            application=application,
            old_status=old_status,
            new_status=application_data.status.value
        )
    
    application.program = db.query(Program).filter(Program.id == application.program_id).first()
    return application

