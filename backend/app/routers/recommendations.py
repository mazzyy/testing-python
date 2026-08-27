"""
Recommendations Router - AI-powered program recommendations and chat
"""
import asyncio
import hashlib
import json
from typing import Optional, Dict, Any, List, Tuple
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.program import Program
from app.models.cached_recommendation import CachedRecommendation
from app.schemas.recommendation import (
    RecommendationRequest, RecommendationResponse, ProgramRecommendation,
    ChatRequest, ChatResponse
)
from app.schemas.program import ProgramResponse
from app.schemas.scholarship import ScholarshipResponse
from app.auth import get_current_user
from app.services.rag_service import get_rag_service
from app.services.azure_openai import get_azure_openai_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


def get_profile_hash(user_profile: Dict[str, Any]) -> str:
    """Generate hash from profile fields that affect recommendations"""
    key_fields = ['desired_degree', 'desired_fields', 'field_of_study', 
                  'english_level', 'german_level', 'preferred_language',
                  'current_degree', 'cgpa']
    data = {k: user_profile.get(k) for k in key_fields if user_profile.get(k)}
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:32]


@router.post("", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized program recommendations based on user profile
    
    - **query**: Optional search query to refine recommendations
    - **use_profile**: Whether to use user's profile for personalization (default: True)
    - **n_results**: Number of recommendations to return
    - **degree_type**: Filter by Bachelor, Masters, or PhD
    - **city**: Filter by city
    - **teaching_language**: Filter by teaching language
    """
    rag_service = get_rag_service()
    ai_service = get_azure_openai_service()
    
    # Get user profile if requested
    user_profile = {}
    if request.use_profile:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if profile:
            user_profile = {
                'current_degree': profile.current_degree,
                'field_of_study': profile.field_of_study,
                'university': profile.university,
                'cgpa': profile.cgpa,
                'gpa_scale': profile.gpa_scale,
                'english_level': profile.english_level,
                'german_level': profile.german_level,
                'desired_degree': profile.desired_degree,
                'desired_fields': profile.desired_fields,
                'preferred_cities': profile.preferred_cities,
                'preferred_language': profile.preferred_language
            }
    
    # Require profile for personalized recommendations
    # Check if user has at least some profile fields filled
    # Primary fields give the best recommendations
    primary_fields = ['desired_degree', 'desired_fields', 'field_of_study']
    has_primary_data = any(user_profile.get(field) for field in primary_fields)
    
    # Secondary fields can still produce useful recommendations
    secondary_fields = ['current_degree', 'english_level', 'preferred_language', 'cgpa']
    has_secondary_data = any(user_profile.get(field) for field in secondary_fields)
    
    if request.use_profile and not has_primary_data and not has_secondary_data:
        # User wants personalized recommendations but hasn't completed their profile at all
        # Return empty list - frontend will show a message to complete profile
        return RecommendationResponse(
            recommendations=[],
            total_found=0,
            query_used="",
            filters_applied={}
        )
    
    # Build search query
    search_parts = []
    
    if request.query:
        search_parts.append(request.query)
    
    if user_profile.get('desired_degree'):
        search_parts.append(f"{user_profile['desired_degree']} degree")
    elif user_profile.get('current_degree'):
        # If they have a current degree but no desired degree, suggest the next level
        degree_progression = {
            'Bachelor': 'Masters',
            'Masters': 'PhD',
            'PhD': 'PhD'
        }
        next_degree = degree_progression.get(user_profile['current_degree'], 'Masters')
        search_parts.append(f"{next_degree} degree")
    
    if user_profile.get('desired_fields'):
        fields = user_profile['desired_fields']
        if isinstance(fields, list):
            search_parts.extend(fields[:3])  # Limit to 3 fields
        else:
            search_parts.append(fields)
    
    if user_profile.get('field_of_study'):
        search_parts.append(user_profile['field_of_study'])
    
    if request.teaching_language:
        search_parts.append(f"taught in {request.teaching_language}")
    elif user_profile.get('preferred_language'):
        search_parts.append(f"taught in {user_profile['preferred_language']}")
    
    search_query = " ".join(search_parts) if search_parts else "university program Germany"
    
    # Get degree filter
    degree_filter = request.degree_type
    degree_map = {
        'bachelor': 'Bachelor',
        'masters': 'Masters',
        'master': 'Masters',
        'phd': 'PhD',
        'doctorate': 'PhD'
    }
    if not degree_filter and user_profile.get('desired_degree'):
        degree_filter = degree_map.get(user_profile['desired_degree'].lower())
    elif not degree_filter and user_profile.get('current_degree'):
        # Suggest programs at next level based on current degree
        degree_progression = {
            'bachelor': 'Masters',
            'masters': 'PhD',
        }
        degree_filter = degree_progression.get(user_profile['current_degree'].lower())
    
    # Search programs
    search_results = rag_service.search_programs(
        query=search_query,
        n_results=request.n_results * 2,  # Get more to filter
        degree_type=degree_filter,
        cities=[request.city] if request.city else None,
        db=db
    )
    
    # Build recommendations with match scores (using cache and parallel processing)
    recommendations = []
    profile_hash = get_profile_hash(user_profile) if user_profile else ""
    
    # Clear cache for this user if force_refresh is requested
    if request.force_refresh and user_profile and profile_hash:
        try:
            db.query(CachedRecommendation).filter(
                CachedRecommendation.user_id == current_user.id
            ).delete()
            db.commit()
        except Exception:
            db.rollback()
    
    # Separate programs into cached and uncached for parallel processing
    programs_to_process = []
    cached_recommendations = []
    
    for result in search_results[:request.n_results]:
        program_db_id = result.get('db_id')
        if program_db_id:
            program = db.query(Program).filter(Program.id == int(program_db_id)).first()
            if program:
                match_info = None
                
                # Check cache first (only if using profile and not force refreshing)
                if user_profile and profile_hash and not request.force_refresh:
                    cached = db.query(CachedRecommendation).filter(
                        CachedRecommendation.user_id == current_user.id,
                        CachedRecommendation.program_id == program.id,
                        CachedRecommendation.profile_hash == profile_hash
                    ).first()
                    
                    if cached:
                        # Use cached result
                        match_info = {
                            'match_score': cached.match_score,
                            'match_reasons': cached.match_reasons or [],
                            'concerns': cached.gaps or [],
                            'recommendation': cached.highlights
                        }
                        cached_recommendations.append(ProgramRecommendation(
                            program=ProgramResponse.model_validate(program),
                            match_score=match_info.get('match_score', 50),
                            match_reasons=match_info.get('match_reasons', []),
                            gaps=match_info.get('concerns', []),
                            highlights=match_info.get('recommendation')
                        ))
                        continue
                
                # Add to list for parallel processing
                programs_to_process.append(program)
    
    from app.utils.gpa_utils import calculate_german_grade

    # Pre-calculate German grade if profile has GPA data
    german_grade_info = None
    if user_profile and user_profile.get('cgpa') and user_profile.get('gpa_scale'):
        try:
            german_grade_info = calculate_german_grade(
                gpa=float(user_profile['cgpa']),
                scale=float(user_profile['gpa_scale']),
                nationality=user_profile.get('nationality')
            )
        except Exception as e:
            print(f"Error calculating German grade: {e}")

    # Process uncached programs using batch scoring (single API call)
    if programs_to_process:
        # Prepare program data for batch scoring
        program_data_list = []
        for program in programs_to_process:
            program_data_list.append({
                'program_name': program.program_name,
                'degree': program.degree,
                'university_name': program.university_name,
                'teaching_language': program.teaching_language,
                'academic_admission_requirements': program.academic_admission_requirements,
                'language_requirements': program.language_requirements
            })
        
        # Batch score all programs in a single OpenAI call  
        batch_results = await ai_service.calculate_batch_match_score_async(
            user_profile if user_profile else {},
            program_data_list,
            user_id=current_user.id,
            german_grade=german_grade_info
        )
        
        # Process batch results and save to cache
        for idx, match_info in enumerate(batch_results):
            if idx >= len(programs_to_process):
                break
            program = programs_to_process[idx]
            
            recommendation = ProgramRecommendation(
                program=ProgramResponse.model_validate(program),
                match_score=match_info.get('match_score', 50),
                match_reasons=match_info.get('match_reasons', []),
                gaps=match_info.get('concerns', []),
                highlights=match_info.get('recommendation')
            )
            recommendations.append(recommendation)
            
            # Save to cache (only if using profile)
            if user_profile and profile_hash:
                try:
                    db.query(CachedRecommendation).filter(
                        CachedRecommendation.user_id == current_user.id,
                        CachedRecommendation.program_id == program.id
                    ).delete()
                    
                    cached_rec = CachedRecommendation(
                        user_id=current_user.id,
                        program_id=program.id,
                        match_score=match_info.get('match_score', 50),
                        match_reasons=match_info.get('match_reasons', []),
                        gaps=match_info.get('concerns', []),
                        highlights=match_info.get('recommendation'),
                        profile_hash=profile_hash
                    )
                    db.add(cached_rec)
                    db.commit()
                except Exception:
                    db.rollback()
    
    # Combine cached and newly processed recommendations
    recommendations.extend(cached_recommendations)
    
    # Sort by match score
    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    
    # Track filters applied
    filters_applied = {}
    if degree_filter:
        filters_applied['degree_type'] = degree_filter
    if request.city:
        filters_applied['city'] = request.city
        filters_applied['teaching_language'] = request.teaching_language
    
    return RecommendationResponse(
        recommendations=recommendations,
        total_found=len(recommendations),
        query_used=search_query,
        filters_applied=filters_applied
    )

@router.get("/debug_sql")
async def debug_sql(query: str = "Computer Science", db: Session = Depends(get_db)):
    rag_service = get_rag_service()
    results = rag_service._sql_search(query=query, n_results=10, degree_type=None, cities=None, teaching_language=None, db=db)
    return {
        "status": "success",
        "count": len(results),
        "results": results
    }


@router.get("/stream")
async def stream_recommendations(
    query: Optional[str] = None,
    use_profile: bool = True,
    n_results: int = Query(default=10, ge=1, le=50),
    degree_type: Optional[str] = None,
    city: Optional[str] = None,
    teaching_language: Optional[str] = None,
    force_refresh: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stream program recommendations using Server-Sent Events (SSE).
    Yields programs one by one as they are scored.
    """
    from fastapi.responses import StreamingResponse
    import json
    
    rag_service = get_rag_service()
    ai_service = get_azure_openai_service()
    
    # 1. Gather User Profile (same logic as POST)
    user_profile = {}
    if use_profile:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if profile:
            user_profile = {
                'current_degree': profile.current_degree,
                'field_of_study': profile.field_of_study,
                'university': profile.university,
                'cgpa': profile.cgpa,
                'gpa_scale': profile.gpa_scale,
                'english_level': profile.english_level,
                'german_level': profile.german_level,
                'desired_degree': profile.desired_degree,
                'desired_fields': profile.desired_fields,
                'preferred_cities': profile.preferred_cities,
                'preferred_language': profile.preferred_language
            }
            
            
    # Always allow the search to proceed, even if the user profile is completely empty, 
    # to guarantee we don't return an empty stream prematurely if they provided filters or a manual query!

    # 2. Build Search Query (same logic as POST)
    search_parts = []
    if query: search_parts.append(query)
    
    if user_profile.get('desired_degree'):
        search_parts.append(f"{user_profile['desired_degree']} degree")
    elif user_profile.get('current_degree'):
        degree_progression = {'Bachelor': 'Masters', 'Masters': 'PhD', 'PhD': 'PhD'}
        next_degree = degree_progression.get(user_profile['current_degree'], 'Masters')
        search_parts.append(f"{next_degree} degree")
        
    if user_profile.get('desired_fields'):
        fields = user_profile['desired_fields']
        if isinstance(fields, list): search_parts.extend(fields[:3])
        else: search_parts.append(fields)
        
    if user_profile.get('field_of_study'):
        search_parts.append(user_profile['field_of_study'])
        
    if teaching_language:
        search_parts.append(f"taught in {teaching_language}")
    elif user_profile.get('preferred_language'):
        search_parts.append(f"taught in {user_profile['preferred_language']}")
        
    search_query = " ".join(search_parts) if search_parts else "university program Germany"
    
    # Degree filter mapping
    degree_filter = degree_type
    degree_map = {'bachelor': 'Bachelor', 'masters': 'Masters', 'master': 'Masters', 'phd': 'PhD', 'doctorate': 'PhD'}
    if not degree_filter and user_profile.get('desired_degree'):
        degree_filter = degree_map.get(user_profile['desired_degree'].lower())
    elif not degree_filter and user_profile.get('current_degree'):
        degree_progression = {'bachelor': 'Masters', 'masters': 'PhD'}
        degree_filter = degree_progression.get(user_profile['current_degree'].lower())
    # Determine the strict teaching language filter: explicitly requested > profile preference > default 'English'
    strict_teaching_language = teaching_language or user_profile.get('preferred_language') or "English"

    # 3. Search RAG/SQL
    search_results = rag_service.search_programs(
        query=search_query,
        n_results=n_results * 2,
        degree_type=degree_filter,
        cities=[city] if city else None,
        teaching_language=strict_teaching_language,
        db=db
    )

    profile_hash = get_profile_hash(user_profile) if user_profile else ""
    if force_refresh and user_profile and profile_hash:
        try:
            db.query(CachedRecommendation).filter(CachedRecommendation.user_id == current_user.id).delete()
            db.commit()
        except Exception:
            db.rollback()

    # Pre-calculate German grade
    from app.utils.gpa_utils import calculate_german_grade
    german_grade_info = None
    if user_profile and user_profile.get('cgpa') and user_profile.get('gpa_scale'):
        try:
            german_grade_info = calculate_german_grade(
                gpa=float(user_profile['cgpa']),
                scale=float(user_profile['gpa_scale']),
                nationality=user_profile.get('nationality')
            )
        except Exception:
            pass

    # 4. separate cached and uncached
    programs_to_process = []
    cached_recommendations = []
    
    for result in search_results[:n_results]:
        program_db_id = result.get('db_id')
        if not program_db_id: continue
        
        program = db.query(Program).filter(Program.id == int(program_db_id)).first()
        if not program: continue
            
        if user_profile and profile_hash and not force_refresh:
            cached = db.query(CachedRecommendation).filter(
                CachedRecommendation.user_id == current_user.id,
                CachedRecommendation.program_id == program.id,
                CachedRecommendation.profile_hash == profile_hash
            ).first()
            if cached:
                cached_recommendations.append(ProgramRecommendation(
                    program=ProgramResponse.model_validate(program),
                    match_score=cached.match_score,
                    match_reasons=cached.match_reasons or [],
                    gaps=cached.gaps or [],
                    highlights=cached.highlights
                ))
                continue
                
        programs_to_process.append(program)

    # Define the generator
    async def recommendation_generator():
        # First, yield all cached ones immediately
        for cached_rec in cached_recommendations:
            payload = cached_rec.model_dump_json()
            yield f"data: {payload}\n\n"
            
        if not programs_to_process:
            yield "event: done\ndata: null\n\n"
            return

        async def score_single_program(program: Program):
            try:
                if user_profile:
                    match_info = await ai_service.calculate_match_score_async(
                        user_profile, 
                        {
                            'program_name': program.program_name,
                            'degree': program.degree,
                            'university_name': program.university_name,
                            'teaching_language': program.teaching_language,
                            'academic_admission_requirements': program.academic_admission_requirements,
                            'language_requirements': program.language_requirements
                        },
                        user_id=current_user.id,
                        german_grade=german_grade_info
                    )
                else:
                    match_info = {'match_score': 70, 'match_reasons': ['Search match'], 'concerns': [], 'recommendation': ''}
                
                # Check for the fallback "Error in analysis"
                is_error = match_info.get("match_score") == 50 and "Error" in str(match_info.get("match_reasons", []))
                
                recommendation = ProgramRecommendation(
                    program=ProgramResponse.model_validate(program),
                    match_score=match_info.get('match_score', 50),
                    match_reasons=match_info.get('match_reasons', []),
                    gaps=match_info.get('concerns', []),
                    highlights=match_info.get('recommendation')
                )
                
                # Save to cache if successful
                if not is_error and user_profile and profile_hash:
                    try:
                        db.query(CachedRecommendation).filter(
                            CachedRecommendation.user_id == current_user.id,
                            CachedRecommendation.program_id == program.id
                        ).delete()
                        
                        cached_rec = CachedRecommendation(
                            user_id=current_user.id,
                            program_id=program.id,
                            match_score=recommendation.match_score,
                            match_reasons=recommendation.match_reasons,
                            gaps=recommendation.gaps,
                            highlights=recommendation.highlights,
                            profile_hash=profile_hash
                        )
                        db.add(cached_rec)
                        db.commit()
                    except Exception:
                        db.rollback()
                        
                return recommendation, is_error
                
            except Exception as e:
                # Total failure case
                error_rec = ProgramRecommendation(
                    program=ProgramResponse.model_validate(program),
                    match_score=50,
                    match_reasons=["Error: " + str(e)],
                    gaps=[],
                    highlights=None
                )
                return error_rec, True

        # Launch all tasks and yield them as soon as they complete
        tasks = [score_single_program(p) for p in programs_to_process]
        for completed_task in asyncio.as_completed(tasks):
            try:
                rec, is_error = await completed_task
                payload = rec.model_dump_json()
                
                if is_error:
                    yield f"event: error\ndata: {payload}\n\n"
                else:
                    yield f"data: {payload}\n\n"
            except Exception as e:
                print(f"Stream error on single task: {e}")
                
        # Send closing event
        yield "event: done\ndata: null\n\n"

    # Return the StreamingResponse with headers to bypass Heroku buffering
    return StreamingResponse(
        recommendation_generator(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_advisor(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat with AI advisor about programs
    
    - **message**: Your question or message
    - **include_recommendations**: Whether to include program recommendations in response
    - **n_results**: Number of programs to use as context
    """
    from datetime import datetime, timezone, timedelta
    from app.models.token_usage import TokenUsage
    
    # Check daily chat limit (10 messages per day) unless admin
    if not current_user.is_admin:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        daily_usage_count = db.query(TokenUsage).filter(
            TokenUsage.user_id == current_user.id,
            TokenUsage.operation_type == 'chat',
            TokenUsage.created_at >= today_start
        ).count()
        
        if daily_usage_count >= 10:
            reset_date = (today_start + timedelta(days=1)).strftime("%Y-%m-%d")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"You have reached the quota limit for chat. You can resume using this model at next day {reset_date}. Premium features with unlimited chat coming soon!"
            )

    rag_service = get_rag_service()
    
    # Get user profile for context
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    user_profile = None
    if profile:
        user_profile = {
            'current_degree': profile.current_degree,
            'field_of_study': profile.field_of_study,
            'cgpa': profile.cgpa,
            'gpa_scale': profile.gpa_scale,
            'nationality': profile.nationality,
            'desired_degree': profile.desired_degree,
            'english_level': profile.english_level,
            'german_level': profile.german_level,
            'preferred_language': profile.preferred_language,
            'desired_fields': profile.desired_fields,
            'preferred_cities': profile.preferred_cities
        }
    
    # Get chat response
    result = await rag_service.chat(
        query=request.message,
        db=db,
        user_profile=user_profile,
        n_context_programs=request.n_results,
        user_id=current_user.id
    )
    
    # Build the structured data response body
    structured_data = {
        "sources": result.get('sources', []),
        "recommendations": [],
        "scholarships": [],
        "universities": [],
        "vault_documents": []
    }
    
    # Include recommendations if requested
    if result.get('recommendations'):
        structured_data["recommendations"] = [
            ProgramRecommendation(
                program=ProgramResponse.model_validate(rec['program']),
                match_score=rec['match_score'],
                match_reasons=rec['match_reasons'],
                gaps=rec['gaps'],
                highlights=rec['highlights']
            ).model_dump() for rec in result['recommendations']
        ]
    
    # Include scholarships if returned by tools
    if result.get('scholarships'):
        structured_data["scholarships"] = [
            ScholarshipResponse.model_validate(sch).model_dump()
            for sch in result['scholarships']
        ]
    
    # Include universities if returned by tools
    if result.get('universities'):
        structured_data["universities"] = result['universities']
        
    # Include vault documents if returned by tools
    if result.get('vault_documents'):
        structured_data["vault_documents"] = result['vault_documents']
        
    # Return standard JSON response instead of SSE streaming
    response = ChatResponse(
        response=result.get('response', ''),
        **structured_data
    )
    return response


@router.get("/quick", response_model=RecommendationResponse)
async def quick_recommendations(
    query: str = Query(..., min_length=2, description="Search query"),
    degree_type: Optional[str] = None,
    n_results: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Quick recommendations without authentication (for browsing)
    
    - **query**: Search query
    - **degree_type**: Filter by Bachelor, Masters, or PhD
    - **n_results**: Number of results
    """
    rag_service = get_rag_service()
    
    # Search programs
    search_results = rag_service.search_programs(
        query=query,
        n_results=n_results,
        degree_type=degree_type,
        db=db
    )
    
    # Build basic recommendations
    recommendations = []
    for result in search_results:
        program_db_id = result.get('db_id')
        if program_db_id:
            program = db.query(Program).filter(Program.id == int(program_db_id)).first()
            if program:
                # Simple relevance-based score
                base_score = 80 - (len(recommendations) * 3)
                
                recommendations.append(ProgramRecommendation(
                    program=ProgramResponse.model_validate(program),
                    match_score=max(50, base_score),
                    match_reasons=["Matches your search query"],
                    highlights=None
                ))
    
    return RecommendationResponse(
        recommendations=recommendations,
        total_found=len(recommendations),
        query_used=query,
        filters_applied={'degree_type': degree_type} if degree_type else {}
    )


from fastapi import BackgroundTasks
import time

@router.get("/test-perf")
async def recommendations_test_perf(
    n_results: int = 10,
    db: Session = Depends(get_db)
):
    """
    Test performance of recommendations without auth
    """
    start_time = time.time()
    
    # Fake profile
    user_profile = {
        'current_degree': 'Bachelor',
        'field_of_study': 'Computer Science',
        'cgpa': 2.5,
        'gpa_scale': 4.0,
        'english_level': 'C1'
    }
    
    request = RecommendationRequest(
        query="Computer Science",
        use_profile=False,
        n_results=n_results
    )
    
    rag_service = get_rag_service()
    
    # Run the optimized function
    recs = await rag_service.get_recommendations(db, user_profile, query="Computer Science", n_results=n_results)
    
    end_time = time.time()
    
    return {
        "time_taken": end_time - start_time,
        "n_results": len(recs)
    }


@router.get("/for-profile", response_model=RecommendationResponse)
async def recommendations_for_profile(
    n_results: int = Query(10, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recommendations automatically based on user profile (no query needed)
    """
    # Get user profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile first to get personalized recommendations"
        )
    
    # Check if profile has enough info (primary or secondary fields)
    has_primary = profile.desired_degree or profile.field_of_study or profile.desired_fields
    has_secondary = profile.current_degree or profile.english_level or profile.preferred_language or profile.cgpa
    if not has_primary and not has_secondary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please add your desired degree or field of study to your profile"
        )
    
    # Build request from profile
    request = RecommendationRequest(
        use_profile=True,
        n_results=n_results
    )
    
    # Use the main recommendations endpoint
    return await get_recommendations(request, current_user, db)
