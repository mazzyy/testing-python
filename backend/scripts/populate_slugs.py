import os
import sys
from slugify import slugify
from sqlalchemy.orm import Session
import argparse

# Add the parent directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.program import Program

def populate_slugs(batch_size: int = 100):
    """
    Populate the slug field for all programs that don't have one
    """
    print("Starting slug population for programs...")
    db = SessionLocal()
    
    try:
        # Get programs without a slug
        programs = db.query(Program).filter(
            (Program.slug == None) | (Program.slug == '')
        ).all()
        
        total = len(programs)
        print(f"Found {total} programs needing slugs.")
        
        if total == 0:
            print("All programs already have slugs. Exiting.")
            return

        updated_count = 0
        for i, program in enumerate(programs):
            # Generate base slug from name and university
            base_slug = slugify(f"{program.program_name}-{program.university_name}-{program.id}", max_length=200)
            
            # Since we appended the unique ID, we don't need to check for duplicates
            program.slug = base_slug
            updated_count += 1
            
            # Commit in batches
            if updated_count % batch_size == 0:
                db.commit()
                print(f"Processed {updated_count}/{total} programs...")
                
        # Final commit for remaining programs
        db.commit()
        print(f"Successfully generated slugs for {updated_count} programs.")

    except Exception as e:
        print(f"Error populating slugs: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Populate program slugs")
    parser.add_argument("--batch-size", type=int, default=100, help="Batch size for database commits")
    args = parser.parse_args()
    
    populate_slugs(args.batch_size)
