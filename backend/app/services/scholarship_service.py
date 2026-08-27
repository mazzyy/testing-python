"""
Scholarship Service for managing Scholarships
"""
import json
from typing import Optional, List
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.scholarship import Scholarship
from app.schemas.scholarship import ScholarshipCreate


class ScholarshipService:
    """
    Service for managing Scholarships in the database
    """
    
    def create_scholarship(self, db: Session, scholarship_data: ScholarshipCreate) -> Scholarship:
        """Create a new scholarship"""
        db_scholarship = Scholarship(**scholarship_data.model_dump())
        db.add(db_scholarship)
        db.commit()
        db.refresh(db_scholarship)
        return db_scholarship
    
    def get_scholarship(self, db: Session, scholarship_id: int) -> Optional[Scholarship]:
        """Get a scholarship by database ID"""
        return db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()
    
    def get_scholarship_by_daad_id(self, db: Session, daad_id: int) -> Optional[Scholarship]:
        """Get a scholarship by original DAAD ID"""
        return db.query(Scholarship).filter(Scholarship.scholarship_id == daad_id).first()
    
    def get_scholarships(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        search_query: Optional[str] = None,
        active_only: bool = True
    ) -> tuple[List[Scholarship], int]:
        """
        Get scholarships with filters and pagination
        """
        query = db.query(Scholarship)
        
        if active_only:
            query = query.filter(Scholarship.is_active == True)
        
        if search_query:
            search_term = f"%{search_query}%"
            query = query.filter(
                or_(
                    Scholarship.title.ilike(search_term),
                    Scholarship.eligibility.ilike(search_term),
                    Scholarship.objective.ilike(search_term)
                )
            )
        
        total = query.count()
        scholarships = query.order_by(Scholarship.title).offset(skip).limit(limit).all()
        
        return scholarships, total
    
    def load_scholarships_from_json(self, db: Session, json_file_path: str) -> int:
        """
        Load scholarships from a JSON file
        """
        file_path = Path(json_file_path)
        if not file_path.exists():
            print(f"[ERROR] File not found: {json_file_path}")
            return 0
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if isinstance(data, dict):
            scholarships_data = [data]
        else:
            scholarships_data = data
        
        loaded = 0
        for item in scholarships_data:
            try:
                existing = self.get_scholarship_by_daad_id(db, item.get('id'))
                if existing:
                    continue
                
                details = item.get('details', {})
                
                scholarship = Scholarship(
                    scholarship_id=item.get('id'),
                    title=item.get('title', 'Unknown Scholarship'),
                    link=item.get('link'),
                    objective=details.get('objective'),
                    eligibility=details.get('eligibility'),
                    value_benefits=details.get('value_benefits'),
                    duration=details.get('duration'),
                    deadline=details.get('deadline'),
                    selection_criteria=details.get('selection_criteria'),
                    is_active=True
                )
                
                db.add(scholarship)
                loaded += 1
                
            except Exception as e:
                print(f"[WARN]  Error loading scholarship {item.get('id')}: {e}")
                continue
        
        db.commit()
        print(f"[OK] Loaded {loaded} scholarships from {json_file_path}")
        return loaded


# Singleton instance
_scholarship_service: Optional[ScholarshipService] = None


def get_scholarship_service() -> ScholarshipService:
    """Get or create scholarship service instance"""
    global _scholarship_service
    if _scholarship_service is None:
        _scholarship_service = ScholarshipService()
    return _scholarship_service
