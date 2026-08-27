import os
from dotenv import load_dotenv

print("Before load_dotenv:")
print("POSTGRES_URL:", os.getenv("POSTGRES_URL"))
print("DATABASE_URL:", os.getenv("DATABASE_URL"))

load_dotenv(override=True)

print("\nAfter load_dotenv:")
print("POSTGRES_URL:", os.getenv("POSTGRES_URL"))
print("DATABASE_URL:", os.getenv("DATABASE_URL"))
