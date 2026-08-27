import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.security import create_access_token
token = create_access_token(data={"sub": "1", "email": "admin@daad.de", "role": "admin"})
print(token)
