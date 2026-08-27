"""
Scholarships Router - DAAD scholarship management
"""
from typing import Optional, List, Dict, Any
import hashlib
import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.scholarship import Scholarship
from app.models.cached_scholarship_recommendation import CachedScholarshipRecommendation
from app.schemas.scholarship import (
    ScholarshipResponse,
    ScholarshipDetailResponse,
    ScholarshipListResponse,
    ScholarshipEligibility,
    ScholarshipEligibilityResponse
)
from app.services.scholarship_service import get_scholarship_service
from app.services.azure_openai import get_azure_openai_service
from app.auth import get_current_user
from fastapi import UploadFile, File

router = APIRouter(prefix="/scholarships", tags=["Scholarships"])
scholarship_service = get_scholarship_service()

def trunc(text, max_len):
    """Truncate string to match database VARCHAR limits to prevent StringDataRightTruncation errors."""
    if text and isinstance(text, str) and len(text) > max_len:
        return text[:max_len]
    return text

@router.post("/import/json", status_code=status.HTTP_200_OK)
async def import_scholarships_from_json(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import scholarships from a JSON file.
    Only admin users can perform this action.
    Triggers RAG indexing automatically.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can import scholarships"
        )
        
    if not file.filename.endswith('.json'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSON files are supported"
        )
        
    try:
        content = await file.read()
        data = json.loads(content)
        
        if not isinstance(data, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="JSON file must contain an array of scholarships"
            )
            
        imported = 0
        skipped = 0
        errors = []
        
        for item in data:
            try:
                # Basic validation
                if 'id' not in item or 'title' not in item:
                    skipped += 1
                    continue
                    
                # Check if scholarship already exists
                existing_scholarship = db.query(Scholarship).filter(
                    Scholarship.scholarship_id == item['id']
                ).first()
                
                if existing_scholarship:
                    skipped += 1
                    continue
                    
                details = item.get('details', {})
                
                # Create scholarship carefully matching VARCHAR limits in model
                # title is String(500), link is String(500), duration is String(500)
                # others are Text (no limit)
                scholarship = Scholarship(
                    scholarship_id=item['id'],
                    title=trunc(item.get('title', 'Unknown Scholarship'), 500),
                    link=trunc(item.get('link'), 500),
                    objective=details.get('objective'),
                    eligibility=details.get('eligibility'),
                    value_benefits=details.get('value_benefits'),
                    duration=trunc(details.get('duration'), 500),
                    deadline=details.get('deadline'),
                    selection_criteria=details.get('selection_criteria'),
                    is_active=True
                )
                
                db.add(scholarship)
                imported += 1
                
            except Exception as e:
                errors.append(f"Error with scholarship {item.get('id')}: {str(e)}")
        
        db.commit()
        
        # Automatically index imported scholarships into RAG pipeline
        indexed_count = 0
        try:
            from app.services.rag_service import get_rag_service
            rag_service = get_rag_service()
            indexed_count = rag_service.index_scholarships(db, force_reload=True)
        except Exception as e:
            errors.append(f"RAG indexing failed: {str(e)}")
        
        return {
            "success": True,
            "imported": imported,
            "skipped": skipped,
            "indexed": indexed_count,
            "errors": errors[:10] if errors else []
        }
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON file"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing scholarships: {str(e)}"
        )


def get_profile_hash(user_profile: Dict[str, Any]) -> str:
    """Generate hash from profile fields that affect recommendations"""
    key_fields = ['desired_degree', 'field_of_study', 'cgpa', 'english_level', 
                  'german_level', 'nationality', 'needs_funding']
    data = {k: user_profile.get(k) for k in key_fields if user_profile.get(k)}
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:32]

@router.get("", response_model=ScholarshipListResponse)
async def list_scholarships(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all scholarships with pagination and optional search
    
    - **search**: Search in title, eligibility, and objective
    """
    skip = (page - 1) * page_size
    
    scholarships, total = scholarship_service.get_scholarships(
        db=db,
        skip=skip,
        limit=page_size,
        search_query=search
    )
    
    return ScholarshipListResponse(
        scholarships=[ScholarshipResponse.model_validate(s) for s in scholarships],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/eligible", response_model=ScholarshipEligibilityResponse)
async def get_eligible_scholarships(
    n_results: int = Query(6, ge=1, le=10),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get scholarships with AI-calculated eligibility scores based on user profile.
    Uses parallel processing to improve performance.
    """
    import asyncio
    ai_service = get_azure_openai_service()
    
    # Get user profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile first to get personalized scholarship recommendations"
        )
    
    # Build user profile dict
    user_profile = {
        'current_degree': profile.current_degree,
        'field_of_study': profile.field_of_study,
        'cgpa': profile.cgpa,
        'gpa_scale': profile.gpa_scale,
        'english_level': profile.english_level,
        'german_level': profile.german_level,
        'desired_degree': profile.desired_degree,
        'nationality': profile.nationality,
        'needs_funding': profile.needs_funding
    }
    
    # Check which key fields are missing
    key_fields = ['current_degree', 'desired_degree', 'nationality']
    missing_fields_set = set()
    profile_complete = True
    
    for field in key_fields:
        if not user_profile.get(field):
            missing_fields_set.add(field)
            profile_complete = False
    
    # Get recommendations - check cache first
    profile_hash = get_profile_hash(user_profile)
    
    # Get all potential scholarships
    candidate_limit = 10
    scholarships, _ = scholarship_service.get_scholarships(
        db=db,
        skip=0,
        limit=candidate_limit
    )
    
    # Separate into cached and uncached
    cached_results = []
    uncached_scholarships = []
    
    for scholarship in scholarships:
        # Check cache
        cached = db.query(CachedScholarshipRecommendation).filter(
            CachedScholarshipRecommendation.user_id == current_user.id,
            CachedScholarshipRecommendation.scholarship_id == scholarship.id,
            CachedScholarshipRecommendation.profile_hash == profile_hash
        ).first()
        
        if cached:
            cached_results.append(ScholarshipEligibility(
                scholarship=ScholarshipResponse.model_validate(scholarship),
                eligibility_score=cached.eligibility_score,
                reasons=cached.reasons or [],
                concerns=cached.concerns or [],
                recommendation=cached.recommendation
            ))
        else:
            uncached_scholarships.append(scholarship)
    
    # Process uncached scholarships
    new_results = []
    if uncached_scholarships:
        # Create coroutines for parallel execution
        tasks = []
        for scholarship in uncached_scholarships:
            scholarship_data = {
                'title': scholarship.title,
                'eligibility': scholarship.eligibility,
                'duration': scholarship.duration,
                'value_benefits': scholarship.value_benefits,
                'deadline': scholarship.deadline
            }
            tasks.append(ai_service.calculate_scholarship_eligibility_async(
                user_profile, 
                scholarship_data,
                user_id=current_user.id
            ))
        
        # Execute AI calls in parallel
        print(f"🚀 Analyzing {len(tasks)} scholarships in parallel...")
        ai_results = await asyncio.gather(*tasks)
        
        # Process and cache results
        for scholarship, eligibility_info in zip(uncached_scholarships, ai_results):
            # Add any missing fields detected by AI
            for field in eligibility_info.get('missing_fields', []):
                missing_fields_set.add(field)
            
            # Create response object
            eligibility_obj = ScholarshipEligibility(
                scholarship=ScholarshipResponse.model_validate(scholarship),
                eligibility_score=eligibility_info.get('eligibility_score', 50),
                reasons=eligibility_info.get('reasons', []),
                concerns=eligibility_info.get('concerns', []),
                recommendation=eligibility_info.get('recommendation')
            )
            new_results.append(eligibility_obj)
            
            # Save to cache
            try:
                # Remove old cache for this scholarship if exists (different profile)
                db.query(CachedScholarshipRecommendation).filter(
                    CachedScholarshipRecommendation.user_id == current_user.id,
                    CachedScholarshipRecommendation.scholarship_id == scholarship.id
                ).delete()
                
                # Add new cache
                cached_rec = CachedScholarshipRecommendation(
                    user_id=current_user.id,
                    scholarship_id=scholarship.id,
                    eligibility_score=eligibility_obj.eligibility_score,
                    reasons=eligibility_obj.reasons,
                    concerns=eligibility_obj.concerns,
                    recommendation=eligibility_obj.recommendation,
                    profile_hash=profile_hash
                )
                db.add(cached_rec)
            except Exception as e:
                print(f"⚠️ Failed to cache recommendation: {e}")
        
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"⚠️ Failed to commit cache: {e}")
            
    # Combine results
    eligible_scholarships = cached_results + new_results
    
    # Sort by eligibility score
    eligible_scholarships.sort(key=lambda x: x.eligibility_score, reverse=True)
    
    # Return top results specified by n_results (default 5)
    return ScholarshipEligibilityResponse(
        scholarships=eligible_scholarships[:n_results],
        total=len(eligible_scholarships[:n_results]),
        missing_fields=list(missing_fields_set),
        profile_complete=profile_complete and len(missing_fields_set) == 0
    )


@router.get("/{scholarship_id}", response_model=ScholarshipDetailResponse)
async def get_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific scholarship by ID with full details
    """
    scholarship = scholarship_service.get_scholarship(db, scholarship_id)
    
    if not scholarship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scholarship not found"
        )
    
    return scholarship
