"""
Seed program data directly into Heroku PostgreSQL from local JSON files.

This script runs LOCALLY on your machine and connects directly to the
Heroku PostgreSQL database, so it never touches the Heroku web dyno's
512 MB memory limit.

Usage:
    # Seed all split files (program_details_1.json ... program_details_30.json)
    python scripts/seed_programs_heroku.py

    # Seed a specific file
    python scripts/seed_programs_heroku.py --file data/program_details_5.json

    # Seed the big combined file
    python scripts/seed_programs_heroku.py --file data/program_details.json

    # Clear all programs first, then seed
    python scripts/seed_programs_heroku.py --clear

Environment:
    Reads DATABASE_URL from .env  (or set it directly as an env var).
    For Heroku, grab the URL with:
        heroku config:get DATABASE_URL
"""

import os
import sys
import json
import glob
import argparse
from pathlib import Path

# Add the backend directory to the path so we can import app modules
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from slugify import slugify


# ── Helpers ──────────────────────────────────────────────────────────

def get_engine():
    """Create a SQLAlchemy engine from DATABASE_URL."""
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        print("ERROR: DATABASE_URL is not set. Set it in .env or as an env variable.")
        print("  Tip: heroku config:get DATABASE_URL")
        sys.exit(1)
    # Heroku uses postgres:// but SQLAlchemy needs postgresql://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    print(f"[DB] Connecting to: {db_url[:40]}...")
    return create_engine(db_url)


def trunc(val, length):
    """Truncate a string value to a max length."""
    return str(val)[:length] if val else val


def determine_degree_type(item):
    """Guess degree type from the degree field."""
    degree_str = (item.get("degree") or "").lower()
    if "bachelor" in degree_str:
        return "Bachelor"
    elif "master" in degree_str:
        return "Masters"
    elif "phd" in degree_str or "doctor" in degree_str:
        return "PhD"
    return None


# ── Core seeding logic ───────────────────────────────────────────────

BATCH_SIZE = 50  # commit every N programs – keeps memory low


def seed_file(session, filepath):
    """
    Read one JSON file and insert programs in batches.
    Returns (imported, skipped, errors).
    """
    print(f"\n[FILE] Processing {filepath} ...")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        data = [data]

    total_items = len(data)
    imported = 0
    skipped = 0
    errors = []
    
    print(f"   [INFO] Found {total_items} programs to process.")

    for i, item in enumerate(data):
        try:
            program_id = str(item.get("program_id", ""))
            if not program_id:
                errors.append(f"Row {i}: missing program_id")
                continue

            # Check if already exists
            exists = session.execute(
                text("SELECT 1 FROM programs WHERE program_id = :pid"),
                {"pid": trunc(program_id, 50)},
            ).first()
            if exists:
                skipped += 1
                continue

            degree_type = determine_degree_type(item)

            # Build insert dict
            row = dict(
                program_id=trunc(program_id, 50),
                url=trunc(item.get("url"), 500),
                program_name=trunc(item.get("program_name", "Unknown Program"), 500),
                university_name=trunc(item.get("university_name", "Unknown University"), 500),
                city=trunc(item.get("city"), 200),
                degree=trunc(item.get("degree"), 300),
                degree_type=trunc(degree_type, 50),
                course_location=trunc(item.get("course_location"), 200),
                teaching_language=json.dumps(item.get("teaching_language")) if item.get("teaching_language") else None,
                languages=item.get("languages"),
                full_time_part_time=json.dumps(item.get("full_time_part_time")) if item.get("full_time_part_time") else None,
                mode_of_study=trunc(item.get("mode_of_study"), 200),
                programme_duration=trunc(item.get("programme_duration"), 100),
                beginning=trunc(item.get("beginning"), 200),
                additional_info_beginning_duration_mode=item.get("additional_info_beginning_duration_mode"),
                application_deadline=item.get("application_deadline"),
                tuition_fees_per_semester_eur=trunc(item.get("tuition_fees_per_semester_eur"), 100),
                additional_info_tuition_fees=item.get("additional_info_tuition_fees"),
                semester_contribution=item.get("semester_contribution"),
                costs_of_living=item.get("costs_of_living"),
                combined_masters_phd=trunc(item.get("combined_masters_phd"), 50),
                joint_double_degree=trunc(item.get("joint_double_degree"), 50),
                description_content=item.get("description_content"),
                in_cooperation_with=item.get("in_cooperation_with"),
                course_organisation=item.get("course_organisation"),
                diploma_supplement_issued=trunc(item.get("diploma_supplement_issued"), 50),
                international_elements=json.dumps(item.get("international_elements")) if item.get("international_elements") else None,
                description_other_international_elements=item.get("description_other_international_elements"),
                integrated_study_abroad=item.get("integrated_study_abroad"),
                integrated_internships=item.get("integrated_internships"),
                german_language_courses=trunc(item.get("german_language_courses"), 50),
                english_language_courses=trunc(item.get("english_language_courses"), 50),
                funding_opportunities=item.get("funding_opportunities"),
                academic_admission_requirements=item.get("academic_admission_requirements"),
                language_requirements=item.get("language_requirements"),
                submit_application_to=item.get("submit_application_to"),
                accommodation=item.get("accommodation"),
                career_advisory_services=item.get("career_advisory_services"),
                support_international_students=json.dumps(item.get("support_international_students")) if item.get("support_international_students") else None,
                general_services_support=item.get("general_services_support"),
                contact_phone=trunc(item.get("contact_phone"), 100),
                contact_email=trunc(item.get("contact_email"), 255),
                contact_website=trunc(item.get("contact_website"), 500),
                contact_address=item.get("contact_address"),
                is_active=True,
            )

            # Build column and value lists dynamically
            cols = ", ".join(row.keys())
            placeholders = ", ".join(f":{k}" for k in row.keys())
            session.execute(
                text(f"INSERT INTO programs ({cols}) VALUES ({placeholders})"),
                row,
            )
            imported += 1

            # Batch commit
            if imported % BATCH_SIZE == 0:
                session.commit()
                processed = i + 1
                remaining = total_items - processed
                print(f"   ... [{processed}/{total_items}] Uploaded {imported} programs. Remaining in this file: {remaining}")

        except Exception as e:
            errors.append(f"program_id={item.get('program_id')}: {e}")
            session.rollback()

    # Final commit
    session.commit()
    print(f"   ... [{total_items}/{total_items}] Uploaded {imported} total programs (skipped {skipped}).")

    # Generate slugs for newly inserted programs that don't have one
    print("   [SLUGS] Generating slugs for new programs in batches...")
    
    # Process in batches to prevent timeouts
    offset = 0
    batch_size = 100
    updated_slugs = 0
    
    while True:
        rows = session.execute(
            text("SELECT id, program_name, university_name FROM programs WHERE slug IS NULL LIMIT :limit OFFSET :offset"),
            {"limit": batch_size, "offset": offset}
        ).fetchall()
        
        if not rows:
            break
            
        for r in rows:
            base_slug = slugify(f"{r[1]}-{r[2]}-{r[0]}", max_length=200)
            session.execute(
                text("UPDATE programs SET slug = :slug WHERE id = :id"),
                {"slug": base_slug, "id": r[0]},
            )
            updated_slugs += 1
            
        session.commit()
        print(f"   ... generated {updated_slugs} slugs so far")
        # Note: We don't advance offset because the previously fetched rows now have slug != NULL, 
        # so they won't appear in the next query of WHERE slug IS NULL.


    print(f"   [DONE] imported={imported}  skipped={skipped}  errors={len(errors)}")
    if errors:
        for e in errors[:5]:
            print(f"   [ERR] {e}")
    return imported, skipped, errors


# ── Main ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed programs into Heroku PostgreSQL")
    parser.add_argument("--file", help="Path to a specific JSON file to seed")
    parser.add_argument("--clear", action="store_true", help="Delete ALL programs before seeding")
    parser.add_argument("--db-url", help="Database URL (overrides DATABASE_URL env var)")
    args = parser.parse_args()

    if args.db_url:
        os.environ["DATABASE_URL"] = args.db_url

    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Verify connection
        result = session.execute(text("SELECT COUNT(*) FROM programs")).scalar()
        print(f"[DB] Connected. Current program count: {result}")

        if args.clear:
            print("[CLEAR] Deleting all programs...")
            session.execute(text("DELETE FROM programs"))
            session.commit()
            print("[CLEAR] Done.")

        if args.file:
            files = [args.file]
        else:
            # Default: seed all split files (program_details_1..30)
            data_dir = backend_dir / "data"
            files = sorted(
                glob.glob(str(data_dir / "program_details_[0-9]*.json")),
                key=lambda f: int(Path(f).stem.split("_")[-1]),
            )
            if not files:
                print("[ERROR] No program_details_*.json files found in data/")
                return

        total_imported = 0
        total_skipped = 0
        total_errors = 0

        for filepath in files:
            imp, skip, errs = seed_file(session, filepath)
            total_imported += imp
            total_skipped += skip
            total_errors += len(errs)

        final_count = session.execute(text("SELECT COUNT(*) FROM programs")).scalar()
        print(f"\n{'='*60}")
        print(f"  SEEDING COMPLETE")
        print(f"  Imported : {total_imported}")
        print(f"  Skipped  : {total_skipped}")
        print(f"  Errors   : {total_errors}")
        print(f"  Total DB : {final_count}")
        print(f"{'='*60}")

    finally:
        session.close()


if __name__ == "__main__":
    main()
