from app.schemas.program import ProgramResponse

class DummyProgram:
    def __init__(self):
        self.id = 1
        self.program_id = 'test'
        self.program_name = 'Test'
        self.university_name = 'Test Uni'
        self.teaching_language = 'German'
        self.full_time_part_time = 'Full-time'
        self.international_elements = 'Element'
        self.is_active = True

obj = DummyProgram()
try:
    resp = ProgramResponse.model_validate(obj)
    print("Success!", resp.teaching_language)
except Exception as e:
    print("Failed!")
    import traceback
    traceback.print_exc()
