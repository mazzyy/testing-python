"""
Programs Router - DAAD program/course management
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
import json
from slugify import slugify

from app.database import get_db
from app.models.user import User
from app.models.program import Program
from app.schemas.program import (
    ProgramCreate, ProgramUpdate, ProgramResponse, 
    ProgramListResponse, ProgramSearch
)
from app.auth import get_current_user, get_current_admin_user
from app.services.program_service import get_program_service
from app.services.rag_service import get_rag_service

router = APIRouter(prefix="/programs", tags=["Programs"])
program_service = get_program_service()


@router.get("", response_model=ProgramListResponse)
async def list_programs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    degree_type: Optional[str] = None,
    city: Optional[str] = None,
    university: Optional[str] = None,
    search: Optional[str] = None,
    teaching_language: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all programs with filters and pagination
    
    - **degree_type**: Filter by Bachelor, Masters, or PhD
    - **city**: Filter by city name
    - **university**: Filter by university name
    - **search**: Search in program name and description
    - **teaching_language**: Filter by teaching language (e.g., English, German)
    """
    skip = (page - 1) * page_size
    
    programs, total = program_service.get_programs(
        db=db,
        skip=skip,
        limit=page_size,
        degree_type=degree_type,
        city=city,
        university=university,
        search_query=search,
        teaching_language=teaching_language
    )
    
    return ProgramListResponse(
        programs=[ProgramResponse.model_validate(p) for p in programs],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/cities")
async def list_cities(
    db: Session = Depends(get_db)
):
    """
    List all unique cities from programs
    
    Returns list of city names sorted alphabetically
    """
    cities = db.query(Program.city).filter(
        Program.is_active == True,
        Program.city.isnot(None),
        Program.city != ''
    ).distinct().all()
    
    city_names = sorted([c[0] for c in cities if c[0]])
    return {"cities": city_names}


@router.get("/universities")
async def list_universities(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    search: Optional[str] = None,
    city: Optional[str] = None,
    degree_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all universities with aggregated information from programs
    
    Returns unique universities with:
    - name: University name
    - city: Primary city (most common from programs)
    - program_count: Total number of programs
    - degree_types: Available degree types
    
    - **page**: Page number (default 1)
    - **page_size**: Number of results per page (default 12)
    - **city**: Filter by city name (universities with programs in this city)
    - **degree_type**: Filter by degree type
    """
    from sqlalchemy import func, case
    
    # Get all active programs grouped by university
    query = db.query(Program).filter(Program.is_active == True)
    
    if search:
        query = query.filter(Program.university_name.ilike(f"%{search}%"))
        
    if degree_type:
        query = query.filter(Program.degree_type == degree_type)
    
    programs = query.all()
    
    # Aggregate by university
    universities_map = {}
    for p in programs:
        name = p.university_name
        if name not in universities_map:
            universities_map[name] = {
                "name": name,
                "cities": {},
                "degree_types": set(),
                "program_count": 0
            }
        
        universities_map[name]["program_count"] += 1
        
        if p.city:
            cities_dict = universities_map[name]["cities"]
            cities_dict[p.city] = cities_dict.get(p.city, 0) + 1
        
        if p.degree_type:
            universities_map[name]["degree_types"].add(p.degree_type)
    
    # Format response
    universities = []
    for uni_data in universities_map.values():
        uni_cities = sorted(list(uni_data["cities"].keys()))
        
        # If city filter is applied, only include universities that have this city
        if city and not any(city.lower() in c.lower() for c in uni_cities):
            continue
            
        universities.append({
            "name": uni_data["name"],
            "cities": uni_cities,
            "program_count": uni_data["program_count"],
            "degree_types": sorted(list(uni_data["degree_types"]))
        })
    
    # Sort by program count descending
    universities.sort(key=lambda x: x["program_count"], reverse=True)
    
    # Implement pagination
    total = len(universities)
    start = (page - 1) * page_size
    end = start + page_size
    paginated_universities = universities[start:end]
    
    return {
        "universities": paginated_universities,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/universities/{university_name}/programs", response_model=ProgramListResponse)
async def get_university_programs(
    university_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    degree_type: Optional[str] = None,
    search: Optional[str] = None,
    teaching_language: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all programs for a specific university
    """
    from urllib.parse import unquote
    
    # Decode URL-encoded university name
    decoded_name = unquote(university_name)
    
    skip = (page - 1) * page_size
    
    programs, total = program_service.get_programs(
        db=db,
        skip=skip,
        limit=page_size,
        degree_type=degree_type,
        university=decoded_name,
        search_query=search,
        teaching_language=teaching_language,
        city=city
    )
    
    return ProgramListResponse(
        programs=[ProgramResponse.model_validate(p) for p in programs],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/statistics")
async def get_program_statistics(
    db: Session = Depends(get_db)
):
    """
    Get program statistics (public access)
    """
    return program_service.get_statistics(db)


@router.get("/{program_identifier}", response_model=ProgramResponse)
async def get_program(
    program_identifier: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific program by ID or Slug
    """
    # Check if it's an ID (numeric)
    if program_identifier.isdigit():
        program = program_service.get_program(db, int(program_identifier))
    else:
        # Assume it's a slug
        program = program_service.get_program_by_slug(db, program_identifier)
    
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )
    
    return program


@router.post("", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_program(
    program_data: ProgramCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Create a new program (Admin only)
    """
    # Check if program_id already exists
    existing = program_service.get_program_by_daad_id(db, program_data.program_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Program with this ID already exists"
        )
    
    return program_service.create_program(db, program_data)


@router.put("/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: int,
    program_data: ProgramUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Update a program (Admin only)
    """
    program = program_service.update_program(db, program_id, program_data)
    
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )
    
    return program


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(
    program_id: int,
    hard_delete: bool = False,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Delete a program (Admin only)
    
    - **hard_delete**: If True, permanently delete. Otherwise, soft delete (deactivate)
    """
    if hard_delete:
        success = program_service.hard_delete_program(db, program_id)
    else:
        success = program_service.delete_program(db, program_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )


@router.post("/import/json", status_code=status.HTTP_201_CREATED)
async def import_programs_from_json(
    file: UploadFile = File(...),
    degree_type: Optional[str] = None,
    skip_indexing: bool = True,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Import programs from JSON file (Admin only)
    
    Upload a JSON file containing an array of program objects.
    
    - **skip_indexing**: Skip RAG re-indexing after import (default True).
      Set to False ONLY on machines with enough RAM (>1GB).
      On Heroku free/eco dynos, always keep True to avoid R14 OOM errors.
      You can trigger indexing separately via POST /programs/index.
    """
    if not file.filename.endswith('.json'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a JSON file"
        )
    
    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        # Free the raw bytes immediately
        del content
        
        # Handle both array and single object
        if isinstance(data, dict):
            programs_data = [data]
        else:
            programs_data = data
        
        imported = 0
        skipped = 0
        errors = []
        
        for item in programs_data:
            try:
                # Check if program already exists
                existing = program_service.get_program_by_daad_id(
                    db, str(item.get('program_id'))
                )
                if existing:
                    skipped += 1
                    continue
                
                # Determine degree type
                program_degree_type = degree_type
                if not program_degree_type:
                    degree_str = item.get('degree', '').lower()
                    if 'bachelor' in degree_str:
                        program_degree_type = 'Bachelor'
                    elif 'master' in degree_str:
                        program_degree_type = 'Masters'
                    elif 'phd' in degree_str or 'doctor' in degree_str:
                        program_degree_type = 'PhD'
                
                def trunc(val, length):
                    return str(val)[:length] if val else val

                # Create program
                program = Program(
                    program_id=trunc(item.get('program_id'), 50),
                    url=trunc(item.get('url'), 500),
                    program_name=trunc(item.get('program_name', 'Unknown Program'), 500),
                    university_name=trunc(item.get('university_name', 'Unknown University'), 500),
                    city=trunc(item.get('city'), 200),
                    degree=trunc(item.get('degree'), 300),
                    degree_type=trunc(program_degree_type, 50),
                    course_location=trunc(item.get('course_location'), 200),
                    teaching_language=item.get('teaching_language'),
                    languages=item.get('languages'),  # Text
                    full_time_part_time=item.get('full_time_part_time'),
                    mode_of_study=trunc(item.get('mode_of_study'), 200),
                    programme_duration=trunc(item.get('programme_duration'), 100),
                    beginning=trunc(item.get('beginning'), 200),
                    additional_info_beginning_duration_mode=item.get('additional_info_beginning_duration_mode'),  # Text
                    application_deadline=item.get('application_deadline'),  # Text
                    tuition_fees_per_semester_eur=trunc(item.get('tuition_fees_per_semester_eur'), 100),
                    additional_info_tuition_fees=item.get('additional_info_tuition_fees'),  # Text
                    semester_contribution=item.get('semester_contribution'),  # Text
                    costs_of_living=item.get('costs_of_living'),  # Text
                    combined_masters_phd=trunc(item.get('combined_masters_phd'), 50),
                    joint_double_degree=trunc(item.get('joint_double_degree'), 50),
                    description_content=item.get('description_content'),  # Text
                    in_cooperation_with=item.get('in_cooperation_with'),  # Text
                    course_organisation=item.get('course_organisation'),  # Text
                    diploma_supplement_issued=trunc(item.get('diploma_supplement_issued'), 50),
                    international_elements=item.get('international_elements'),  # JSON
                    description_other_international_elements=item.get('description_other_international_elements'),  # Text
                    integrated_study_abroad=item.get('integrated_study_abroad'),  # Text
                    integrated_internships=item.get('integrated_internships'),  # Text
                    german_language_courses=trunc(item.get('german_language_courses'), 50),
                    english_language_courses=trunc(item.get('english_language_courses'), 50),
                    funding_opportunities=item.get('funding_opportunities'),  # Text
                    academic_admission_requirements=item.get('academic_admission_requirements'),  # Text
                    language_requirements=item.get('language_requirements'),  # Text
                    submit_application_to=item.get('submit_application_to'),  # Text
                    accommodation=item.get('accommodation'),  # Text
                    career_advisory_services=item.get('career_advisory_services'),  # Text
                    support_international_students=item.get('support_international_students'),  # JSON
                    general_services_support=item.get('general_services_support'),  # Text
                    contact_phone=trunc(item.get('contact_phone'), 100),
                    contact_email=trunc(item.get('contact_email'), 255),
                    contact_website=trunc(item.get('contact_website'), 500),
                    contact_address=item.get('contact_address'),  # Text
                    is_active=True
                )
                
                db.add(program)
                db.flush()
                
                base_slug = slugify(f"{program.program_name}-{program.university_name}-{program.id}", max_length=200)
                program.slug = base_slug
                
                imported += 1
                
                # Batch commit every 50 to keep memory low
                if imported % 50 == 0:
                    db.commit()
                
            except Exception as e:
                errors.append(f"Error with program {item.get('program_id')}: {str(e)}")
        
        db.commit()
        
        # Optionally index into RAG pipeline (skip on Heroku to avoid OOM)
        indexed_count = 0
        if not skip_indexing:
            try:
                rag_service = get_rag_service()
                indexed_count = rag_service.index_programs(db, force_reload=True)
            except Exception as e:
                errors.append(f"RAG indexing failed: {str(e)}")
        
        return {
            "success": True,
            "imported": imported,
            "skipped": skipped,
            "indexed": indexed_count,
            "indexing_skipped": skip_indexing,
            "errors": errors[:10] if errors else [],
            "note": "Use POST /programs/index to trigger RAG indexing separately" if skip_indexing else ""
        }
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON file"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing programs: {str(e)}"
        )


@router.post("/index", status_code=status.HTTP_200_OK)
async def index_programs_for_search(
    force_reload: bool = False,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Index all programs into the vector database for semantic search (Admin only)
    
    - **force_reload**: If True, clear existing index and rebuild
    """
    rag_service = get_rag_service()
    count = rag_service.index_programs(db, force_reload=force_reload)
    
    return {
        "success": True,
        "indexed_count": count,
        "message": f"Successfully indexed {count} programs"
    }


@router.get("/search/semantic", response_model=List[ProgramResponse])
async def semantic_search_programs(
    query: str = Query(..., min_length=2),
    n_results: int = Query(10, ge=1, le=50),
    degree_type: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Semantic search for programs using AI embeddings
    
    - **query**: Search query (natural language)
    - **n_results**: Number of results to return
    - **degree_type**: Filter by degree type
    - **city**: Filter by city
    """
    rag_service = get_rag_service()
    
    search_results = rag_service.search_programs(
        query=query,
        n_results=n_results,
        degree_type=degree_type,
        city=city
    )
    
    # Get full program details from database
    programs = []
    for result in search_results:
        program_db_id = result.get('db_id')
        if program_db_id:
            program = db.query(Program).filter(Program.id == int(program_db_id)).first()
            if program:
                programs.append(program)
    
    return programs
