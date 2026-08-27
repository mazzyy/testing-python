import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

# 1. Login
print("Logging in...")
login_res = requests.post(
    f"{BASE_URL}/auth/login",
    data={"username": "admin@daad.de", "password": "admin"}
)

if login_res.status_code != 200:
    print("Login failed:", login_res.text)
    sys.exit(1)

token = login_res.json().get("access_token")
print(f"Got token: {token[:20]}...")

# 2. Chat
print("Sending chat request...")
chat_res = requests.post(
    f"{BASE_URL}/recommendations/chat",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "message": "Can you show me the files I have uploaded in my vault?",
        "include_recommendations": True,
        "n_results": 5
    }
)

if chat_res.status_code != 200:
    print("Chat failed:", chat_res.text)
    sys.exit(1)

data = chat_res.json()
print("\n=== RESPONSE ===")
print(data.get("response"))
print("\n=== VAULT DOCS ===")
docs = data.get("vault_documents", [])
print(f"Found {len(docs)} docs")
for d in docs:
    print(d)
