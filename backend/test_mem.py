import sys
import psutil
import os

proc = psutil.Process()
print(f"[BOOT] Initial RAM: {proc.memory_info().rss / 1024**2:.1f} MB")

import fastapi
print(f"[LOAD] FastAPI: {proc.memory_info().rss / 1024**2:.1f} MB")

import sqlalchemy
print(f"[LOAD] SQLAlchemy: {proc.memory_info().rss / 1024**2:.1f} MB")

from app.database import SessionLocal
print(f"[LOAD] app.database: {proc.memory_info().rss / 1024**2:.1f} MB")

from app.models.program import Program
print(f"[LOAD] app.models.program: {proc.memory_info().rss / 1024**2:.1f} MB")

import chromadb
print(f"[LOAD] chromadb: {proc.memory_info().rss / 1024**2:.1f} MB")

