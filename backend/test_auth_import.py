import sys
sys.path.append('/app')
import requests
from app.database import SessionLocal
from app.models.user import User
from app.core.security import create_access_token

db = SessionLocal()
admin = db.query(User).filter_by(role='admin').first()
db.close()

if admin:
    token = create_access_token({"sub": str(admin.id), "email": admin.email, "role": "admin"})
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    with open('/app/data/program_details.json', 'rb') as f:
        files = {"file": f}
        resp = requests.post("http://localhost:8000/api/programs/import/json", headers=headers, files=files)
        print("Status Code:", resp.status_code)
        print("Response JSON:", resp.json())
else:
    print("Admin not found")
