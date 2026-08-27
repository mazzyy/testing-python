"""
Program Service for managing DAAD programs/courses
"""
import json
from typing import Optional, List, Dict, Any
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import or_
from slugify import slugify

from app.models.program import Program
from app.schemas.program import ProgramCreate, ProgramUpdate


class ProgramService:
    """
    Service for managing DAAD programs in the database
    """
    
    def create_program(self, db: Session, program_data: ProgramCreate) -> Program:
        """
        Create a new program
        
        Args:
            db: Database session
            program_data: Program data
        
        Returns:
            Created program object
        """
        db_program = Program(**program_data.model_dump())
        
        # Generate slug if not provided
        if not db_program.slug:
            # We don't have the ID yet, so flush to get it before setting slug
            db.add(db_program)
            db.flush()
            base_slug = slugify(f"{db_program.program_name}-{db_program.university_name}-{db_program.id}", max_length=200)
            db_program.slug = base_slug
            
        db.add(db_program)
        db.commit()
        db.refresh(db_program)
        return db_program
    
    def get_program(self, db: Session, program_id: int) -> Optional[Program]:
        """
        Get a program by ID
        
        Args:
            db: Database session
            program_id: Program database ID
        
        Returns:
            Program object or None
        """
        return db.query(Program).filter(Program.id == program_id).first()
    
    
    def get_program_by_daad_id(self, db: Session, daad_id: str) -> Optional[Program]:
        """
        Get a program by DAAD program ID
        
        Args:
            db: Database session
            daad_id: DAAD program ID string
        
        Returns:
            Program object or None
        """
        return db.query(Program).filter(Program.program_id == daad_id).first()

    def get_program_by_slug(self, db: Session, slug: str) -> Optional[Program]:
        """
        Get a program by slug or exact program name
        
        Args:
            db: Database session
            slug: Program slug or program name
        
        Returns:
            Program object or None
        """
        import urllib.parse
        decoded = urllib.parse.unquote(slug)
        return db.query(Program).filter(
            or_(
                Program.slug == slug,
                Program.program_name == decoded
            )
        ).first()
    
    def get_programs(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        degree_type: Optional[str] = None,
        city: Optional[str] = None,
        university: Optional[str] = None,
        search_query: Optional[str] = None,
        teaching_language: Optional[str] = None,
        active_only: bool = True
    ) -> tuple[List[Program], int]:
        """
        Get programs with filters and pagination
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            degree_type: Filter by degree type
            city: Filter by city
            university: Filter by university name or slug
            search_query: Search in program name and description
            teaching_language: Filter by teaching language
            active_only: Only return active programs
        
        Returns:
            Tuple of (list of programs, total count)
        """
        query = db.query(Program)
        
        # Apply filters
        if active_only:
            query = query.filter(Program.is_active == True)
        
        if degree_type:
            query = query.filter(Program.degree_type == degree_type)
        
        if city:
            query = query.filter(Program.city.ilike(f"%{city}%"))
        
        if university:
            # Check if it's a slug or exact name
            from slugify import slugify
            query = query.filter(
                or_(
                    Program.university_name.ilike(f"%{university}%"),
                    Program.slug.ilike(f"%{slugify(university)}%")
                )
            )
        
        if teaching_language:
            from sqlalchemy import cast, String
            # Search in JSON array by casting to string to support SQLite and PG universally
            query = query.filter(
                cast(Program.teaching_language, String).ilike(f'%"{teaching_language}"%')
            )
        
        if search_query:
            search_term = f"%{search_query}%"
            query = query.filter(
                or_(
                    Program.program_name.ilike(search_term),
                    Program.description_content.ilike(search_term),
                    Program.university_name.ilike(search_term)
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        programs = query.offset(skip).limit(limit).all()
        
        return programs, total
    
    def update_program(
        self,
        db: Session,
        program_id: int,
        program_data: ProgramUpdate
    ) -> Optional[Program]:
        """
        Update a program
        
        Args:
            db: Database session
            program_id: Program ID
            program_data: Updated program data
        
        Returns:
            Updated program object or None
        """
        program = self.get_program(db, program_id)
        if not program:
            return None
        
        update_data = program_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(program, field, value)
        
        db.commit()
        db.refresh(program)
        return program
    
    def delete_program(self, db: Session, program_id: int) -> bool:
        """
        Delete a program (soft delete by setting is_active=False)
        
        Args:
            db: Database session
            program_id: Program ID
        
        Returns:
            True if deleted, False if not found
        """
        program = self.get_program(db, program_id)
        if not program:
            return False
        
        program.is_active = False
        db.commit()
        return True
    
    def hard_delete_program(self, db: Session, program_id: int) -> bool:
        """
        Permanently delete a program
        
        Args:
            db: Database session
            program_id: Program ID
        
        Returns:
            True if deleted, False if not found
        """
        program = self.get_program(db, program_id)
        if not program:
            return False
        
        db.delete(program)
        db.commit()
        return True
    
    def load_programs_from_json(
        self,
        db: Session,
        json_file_path: str,
        degree_type: str = None
    ) -> int:
        """
        Load programs from a JSON file
        
        Args:
            db: Database session
            json_file_path: Path to JSON file
            degree_type: Degree type to assign (Bachelor, Masters, PhD)
        
        Returns:
            Number of programs loaded
        """
        file_path = Path(json_file_path)
        if not file_path.exists():
            print(f"[ERROR] File not found: {json_file_path}")
            return 0
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle both array and single object
        if isinstance(data, dict):
            programs_data = [data]
        else:
            programs_data = data
        
        loaded = 0
        for item in programs_data:
            try:
                # Check if program already exists
                existing = self.get_program_by_daad_id(db, str(item.get('program_id')))
                if existing:
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
                
                # Create program
                program = Program(
                    program_id=str(item.get('program_id')),
                    url=item.get('url'),
                    program_name=item.get('program_name', 'Unknown Program'),
                    university_name=item.get('university_name', 'Unknown University'),
                    city=item.get('city'),
                    degree=item.get('degree'),
                    degree_type=program_degree_type,
                    course_location=item.get('course_location'),
                    teaching_language=item.get('teaching_language'),
                    languages=item.get('languages'),
                    full_time_part_time=item.get('full_time_part_time'),
                    mode_of_study=item.get('mode_of_study'),
                    programme_duration=item.get('programme_duration'),
                    beginning=item.get('beginning'),
                    additional_info_beginning_duration_mode=item.get('additional_info_beginning_duration_mode'),
                    application_deadline=item.get('application_deadline'),
                    tuition_fees_per_semester_eur=item.get('tuition_fees_per_semester_eur'),
                    additional_info_tuition_fees=item.get('additional_info_tuition_fees'),
                    semester_contribution=item.get('semester_contribution'),
                    costs_of_living=item.get('costs_of_living'),
                    combined_masters_phd=item.get('combined_masters_phd'),
                    joint_double_degree=item.get('joint_double_degree'),
                    description_content=item.get('description_content'),
                    in_cooperation_with=item.get('in_cooperation_with'),
                    course_organisation=item.get('course_organisation'),
                    diploma_supplement_issued=item.get('diploma_supplement_issued'),
                    international_elements=item.get('international_elements'),
                    description_other_international_elements=item.get('description_other_international_elements'),
                    integrated_study_abroad=item.get('integrated_study_abroad'),
                    integrated_internships=item.get('integrated_internships'),
                    german_language_courses=item.get('german_language_courses'),
                    english_language_courses=item.get('english_language_courses'),
                    funding_opportunities=item.get('funding_opportunities'),
                    academic_admission_requirements=item.get('academic_admission_requirements'),
                    language_requirements=item.get('language_requirements'),
                    submit_application_to=item.get('submit_application_to'),
                    accommodation=item.get('accommodation'),
                    career_advisory_services=item.get('career_advisory_services'),
                    support_international_students=item.get('support_international_students'),
                    general_services_support=item.get('general_services_support'),
                    contact_phone=item.get('contact_phone'),
                    contact_email=item.get('contact_email'),
                    contact_website=item.get('contact_website'),
                    contact_address=item.get('contact_address'),
                    is_active=True
                )
                
                db.add(program)
                db.flush() # Get ID
                
                # Generate slug
                base_slug = slugify(f"{program.program_name}-{program.university_name}-{program.id}", max_length=200)
                program.slug = base_slug
                
                loaded += 1
                
            except Exception as e:
                print(f"[WARN]  Error loading program {item.get('program_id')}: {e}")
                continue
        
        db.commit()
        print(f"[OK] Loaded {loaded} programs from {json_file_path}")
        return loaded
    
    def get_statistics(self, db: Session) -> Dict[str, Any]:
        """
        Get program statistics
        
        Args:
            db: Database session
        
        Returns:
            Statistics dictionary
        """
        total = db.query(Program).count()
        active = db.query(Program).filter(Program.is_active == True).count()
        
        # Count by degree type
        bachelor = db.query(Program).filter(Program.degree_type == 'Bachelor').count()
        masters = db.query(Program).filter(Program.degree_type == 'Masters').count()
        phd = db.query(Program).filter(Program.degree_type == 'PhD').count()
        
        # Get unique cities
        cities = db.query(Program.city).distinct().count()
        
        # Get unique universities
        universities = db.query(Program.university_name).distinct().count()
        
        return {
            'total_programs': total,
            'active_programs': active,
            'inactive_programs': total - active,
            'by_degree_type': {
                'Bachelor': bachelor,
                'Masters': masters,
                'PhD': phd
            },
            'unique_cities': cities,
            'unique_universities': universities
        }


# Singleton instance
_program_service: Optional[ProgramService] = None


def get_program_service() -> ProgramService:
    """Get or create program service instance"""
    global _program_service
    if _program_service is None:
        _program_service = ProgramService()
    return _program_service
