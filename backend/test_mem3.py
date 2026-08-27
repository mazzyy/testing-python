import sys
import psutil
import asyncio

async def test_startup():
    from app.main import app
    
    # Manually trigger startup
    try:
        if hasattr(app.router, "startup"):
            for handler in app.router.startup:
                await handler()
        
        proc = psutil.Process()
        print(f"[BOOT] Memory after startup hooks: {proc.memory_info().rss / 1024**2:.1f} MB")
    except Exception as e:
        print(e)
    
asyncio.run(test_startup())
