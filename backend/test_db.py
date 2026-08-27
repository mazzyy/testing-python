import sys
import os
sys.path.append('/app')
from app.database import SessionLocal
from app.models.program import Program

db = SessionLocal()
programs = db.query(Program).filter(Program.program_id.in_(['10000', '10001', '10317'])).all()
for p in programs:
    print(f"Program {p.program_id}:")
    print(f"  teaching_language = {repr(p.teaching_language)} (type: {type(p.teaching_language)})")
    print(f"  full_time_part_time = {repr(p.full_time_part_time)} (type: {type(p.full_time_part_time)})")
db.close()
