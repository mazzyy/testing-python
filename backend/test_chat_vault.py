import asyncio
import sys
import os

# Ensure the backend directory is in the import path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.services.rag_service import get_rag_service

async def main():
    db = SessionLocal()
    try:
        # Find user
        user = db.query(User).filter(User.email == "user@example.com").first()
        if not user:
            print("User not found!")
            return
            
        print(f"Testing chat for user: {user.id}")
        
        # Get RAG service
        rag = get_rag_service()
        
        # Call chat
        result = await rag.chat(
            query="Can you show me the files I have uploaded in my vault?",
            user=user,
            db=db,
            include_recommendations=True,
            n_results=5,
            chat_history=[]
        )
        
        print("\n=== CHAT RESULT ===")
        print(result.get("response"))
        print("\n=== VAULT DOCUMENTS EXTRACTED ===")
        vault_docs = result.get("vault_documents", [])
        print(f"Found {len(vault_docs)} documents.")
        for doc in vault_docs:
            print(f"- {doc.get('file_name')} ({doc.get('category')})")
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
