from app.database import SessionLocal
from app.models.program import Program
db = SessionLocal()
p = db.query(Program).filter(Program.program_id == '10001').first()
if p:
    print(f"p.teaching_language = {repr(p.teaching_language)} (type: {type(p.teaching_language)})")
    print(f"p.full_time_part_time = {repr(p.full_time_part_time)} (type: {type(p.full_time_part_time)})")
else:
    print("Program 10001 not found.")
db.close()
