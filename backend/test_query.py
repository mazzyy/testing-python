import sys
import os
sys.path.append('.') # Add backend to path

from app.database import SessionLocal
from app.models.program import Program

from sqlalchemy import cast, String

def test():
    db = SessionLocal()
    query_fallback = db.query(Program).filter(
        cast(Program.teaching_language, String).ilike('%"English"%')
    )
    print("Fallback count:", query_fallback.count())

if __name__ == "__main__":
    test()
