import sys
import psutil
proc = psutil.Process()
print(f"[BOOT] Initial: {proc.memory_info().rss / 1024**2:.1f} MB")

from app.main import app
print(f"[LOAD] app.main complete: {proc.memory_info().rss / 1024**2:.1f} MB")
