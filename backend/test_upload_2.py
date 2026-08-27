import sys
sys.path.append('/app')
from jose import jwt
import datetime
import requests

payload = {
    'sub': '1', 
    'email': 'admin@daad.de', 
    'role': 'admin', 
    'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
}
token = jwt.encode(payload, 'your-super-secret-key-change-in-production-min-32-chars', algorithm='HS256')

headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
with open('/app/program_details.json', 'rb') as f:
    files = {"file": f}
    resp = requests.post("http://localhost:8000/api/programs/import/json", headers=headers, files=files)
    print("Status Code:", resp.status_code)
    try:
        print("Response JSON:", resp.json())
    except:
        print(resp.text)
