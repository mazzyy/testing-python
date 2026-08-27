# script to get admin token
import sys
import os
sys.path.append('/app')
from app.database import SessionLocal
from app.models.user import User
from app.core.security import create_access_token

db = SessionLocal()
admin = db.query(User).filter_by(role='admin').first()
db.close()

if admin:
    token = create_access_token({"sub": str(admin.id), "email": admin.email, "role": "admin"})
    print(token)
else:
    print("Admin not found")
