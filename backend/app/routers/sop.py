from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.services.azure_openai import get_azure_openai_service, AzureOpenAIService
from app.schemas.sop import (
    SOPRequest, SOPResponse, TemplateType,
    SOPDraftResponse, SOPDraftListResponse, SOPDraftCompareResponse
)
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.auth import get_current_user
from app.models.user import User
from app.models.sop_draft import SOPDraft
from app.services.program_service import get_program_service, ProgramService
from typing import Optional

router = APIRouter(
    prefix="/sop",
    tags=["SOP Generator"]
)


# =============================================================================
# SOP Generation
# =============================================================================

@router.post("/generate", response_model=SOPResponse)
async def generate_sop(
    request: SOPRequest,
    current_user: User = Depends(get_current_user),
    ai_service: AzureOpenAIService = Depends(get_azure_openai_service),
    program_service: ProgramService = Depends(get_program_service),
    db: Session = Depends(get_db)
):
    """
    Generate a personalized Statement of Purpose (SOP) based on user input and program details.
    Supports different templates (research, course, daad) and configurable word count.
    Requires authentication.
    """
    # 1. Fetch program details
    print(f"DEBUG: SOP generation request. Program: {request.program_id}, Template: {request.template_type}")
    program = program_service.get_program_by_daad_id(db, request.program_id)
    
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program with ID '{request.program_id}' not found"
        )
    
    # 2. Prepare user data from Profile if not provided in Request
    profile = current_user.profile
    
    def get_profile_academic_background(p):
        if not p: return None
        parts = []
        if p.current_degree and p.field_of_study:
            parts.append(f"Completed {p.current_degree} in {p.field_of_study}")
        if p.university:
            parts.append(f"at {p.university}")
        if p.cgpa:
            scale = f"/{p.gpa_scale}" if p.gpa_scale else ""
            parts.append(f"with a CGPA of {p.cgpa}{scale}")
        if p.graduation_date:
            parts.append(f"(Graduated: {p.graduation_date})")
        if parts:
            return " ".join(parts) + "."
        return None

    def get_profile_achievements(p):
        if not p: return None
        parts = []
        if p.work_experience:
            parts.append(f"Work Experience: {p.work_experience}")
        if p.research_experience:
            parts.append(f"Research Experience: {p.research_experience}")
        if p.honors_awards:
            parts.append(f"Awards: {p.honors_awards}")
        if parts:
            return "\n".join(parts)
        return None

    user_data = {
        "full_name": request.full_name or current_user.full_name or current_user.username,
        "academic_background": request.academic_background or get_profile_academic_background(profile) or "Generate a strong academic background suitable for this program.",
        "future_goals": request.future_goals or (f"Aiming for {profile.desired_degree} in {profile.desired_fields}" if profile and profile.desired_degree else "Generate ambitious career goals aligned with this program."),
        "key_achievements": request.key_achievements or get_profile_achievements(profile) or "Not specified",
        "why_this_program": request.why_this_program or "Generate a compelling motivation based on the program details."
    }
    
    # 3. Generate SOP with template and word count
    try:
        sop_content = await ai_service.generate_sop(
            program_data=program.__dict__,
            user_data=user_data,
            user_id=current_user.id,
            template_type=request.template_type.value,
            target_word_count=request.target_word_count
        )
        
        # Calculate actual word count
        word_count = len(sop_content.split())
        
        # 4. Save draft if requested
        draft_id = None
        version = 1
        
        if request.save_draft:
            # Get next version number for this program
            max_version = db.query(func.max(SOPDraft.version)).filter(
                SOPDraft.user_id == current_user.id,
                SOPDraft.program_id == request.program_id
            ).scalar() or 0
            version = max_version + 1
            
            # Create draft
            draft = SOPDraft(
                user_id=current_user.id,
                program_id=request.program_id,
                program_name=getattr(program, 'program_name', None),
                university_name=getattr(program, 'university_name', None),
                version=version,
                content=sop_content,
                word_count=word_count,
                template_type=request.template_type.value,
                target_word_count=request.target_word_count,
                generation_params={
                    "why_this_program": request.why_this_program,
                    "academic_background": request.academic_background,
                    "future_goals": request.future_goals,
                    "key_achievements": request.key_achievements
                }
            )
            db.add(draft)
            db.commit()
            db.refresh(draft)
            draft_id = draft.id
            print(f"DEBUG: Saved SOP draft v{version} with ID {draft_id}")
        
        return SOPResponse(
            sop_content=sop_content,
            word_count=word_count,
            draft_id=draft_id,
            version=version
        )
        
    except Exception as e:
        print(f"Error generating SOP: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate SOP: {str(e)}"
        )


# =============================================================================
# Draft Management
# =============================================================================

@router.get("/drafts", response_model=SOPDraftListResponse)
async def list_drafts(
    program_id: Optional[str] = Query(None, description="Filter by program ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all SOP drafts for the current user.
    Optionally filter by program ID.
    """
    query = db.query(SOPDraft).filter(SOPDraft.user_id == current_user.id)
    
    if program_id:
        query = query.filter(SOPDraft.program_id == program_id)
    
    drafts = query.order_by(SOPDraft.created_at.desc()).all()
    
    return SOPDraftListResponse(
        drafts=[SOPDraftResponse.model_validate(d) for d in drafts],
        total=len(drafts)
    )


@router.get("/drafts/{draft_id}", response_model=SOPDraftResponse)
async def get_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific SOP draft by ID."""
    draft = db.query(SOPDraft).filter(
        SOPDraft.id == draft_id,
        SOPDraft.user_id == current_user.id
    ).first()
    
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )
    
    return SOPDraftResponse.model_validate(draft)


@router.put("/drafts/{draft_id}/favorite", response_model=SOPDraftResponse)
async def toggle_favorite(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle favorite status of a draft."""
    draft = db.query(SOPDraft).filter(
        SOPDraft.id == draft_id,
        SOPDraft.user_id == current_user.id
    ).first()
    
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )
    
    draft.is_favorite = not draft.is_favorite
    db.commit()
    db.refresh(draft)
    
    return SOPDraftResponse.model_validate(draft)


@router.delete("/drafts/{draft_id}")
async def delete_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific SOP draft."""
    draft = db.query(SOPDraft).filter(
        SOPDraft.id == draft_id,
        SOPDraft.user_id == current_user.id
    ).first()
    
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )
    
    db.delete(draft)
    db.commit()
    
    return {"message": "Draft deleted successfully", "id": draft_id}


@router.post("/drafts/compare", response_model=SOPDraftCompareResponse)
async def compare_drafts(
    draft_id_1: int,
    draft_id_2: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare two SOP drafts side by side."""
    draft_1 = db.query(SOPDraft).filter(
        SOPDraft.id == draft_id_1,
        SOPDraft.user_id == current_user.id
    ).first()
    
    draft_2 = db.query(SOPDraft).filter(
        SOPDraft.id == draft_id_2,
        SOPDraft.user_id == current_user.id
    ).first()
    
    if not draft_1 or not draft_2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both drafts not found"
        )
    
    return SOPDraftCompareResponse(
        draft_1=SOPDraftResponse.model_validate(draft_1),
        draft_2=SOPDraftResponse.model_validate(draft_2),
        word_count_diff=draft_2.word_count - draft_1.word_count
    )
