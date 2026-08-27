import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.services.azure_openai import get_azure_openai_service
    
    print("Initializing Azure OpenAI service...")
    service = get_azure_openai_service()
    
    print(f"Service initialized. Model: {service.model}")
    print("Testing generate_response...")
    
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Be concise."},
        {"role": "user", "content": "Say 'Azure OpenAI API is working beautifully!'"}
    ]
    
    response = service.generate_response(messages=messages, max_tokens=50, temperature=0.7)
    
    print("-" * 50)
    print("SUCCESS: Response received from Azure OpenAI:")
    print(f"\n{response}\n")
    print("-" * 50)
    
except Exception as e:
    print("-" * 50)
    print("ERROR testing Azure OpenAI:")
    print(f"{type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    print("-" * 50)
