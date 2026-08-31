"""
UniAdvisor Course Recommendation System - FastAPI Backend
Main application entry point
"""
import os
# Disable ChromaDB's PostHog telemetry before chromadb is imported anywhere
os.environ.setdefault("ANONYMIZED_TELEMETRY", "false")

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import init_db, get_db, SessionLocal
from app.models.user import User, UserRole
from app.auth import get_password_hash
from app.services.rag_service import get_rag_service

# Import routers
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.programs import router as programs_router
from app.routers.profile import router as profile_router
from app.routers.recommendations import router as recommendations_router
from app.routers.scholarships import router as scholarships_router
from app.routers.token_usage import router as token_usage_router
from app.routers.applications import router as applications_router
from app.routers.notifications import router as notifications_router
from app.routers.community import router as community_router
from app.routers.sop import router as sop_router
from app.routers.cv_generator import router as cv_generator_router
from app.services.scholarship_service import get_scholarship_service
from app.services.scheduler import start_scheduler, stop_scheduler


def create_default_admin():
    """Create default admin user if not exists"""
    import os
    
    admin_email = settings.ADMIN_EMAIL
    # Default password only for dev if not provided, but we should encourage env var
    # For security audit compliance, we prefer no hardcoded default in code, 
    # but to avoid breaking existing dev setups without .env, we'll check carefully.
    
    # Secure approach: Get from env, if not present, do not create default admin or log warning.
    admin_password = settings.ADMIN_PASSWORD
    
    if not admin_password:
        print("[WARN] ADMIN_PASSWORD not set. Skipping default admin creation.")
        return

    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            # Create default admin
            admin = User(
                email=admin_email,
                username="admin",
                hashed_password=get_password_hash(admin_password),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            print(f"[OK] Default admin user created ({admin_email})")
        else:
            print("[INFO]  Admin user already exists")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("="*60)
    print(f"[START] Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print("="*60)
    
    # Initialize database
    print("[DB] Initializing database...")
    init_db()
    print("[OK] Database initialized")
    
    # Create default admin
    create_default_admin()
    
    # Semantic search is now lazy-loaded — ChromaDB + ONNX model are NOT
    # initialised at startup to save memory on Heroku.
    # They will be loaded transparently on the first search request.
    print("[SEARCH] Semantic search (ChromaDB) will initialise on first use")
    try:
        db = SessionLocal()
        rag_service = get_rag_service()
        # index_programs does a lightweight count-only peek at startup;
        # it only loads the ONNX model if the collection is empty.
        count = rag_service.index_programs(db)
        print(f"[OK] {count} programs available for search")
        db.close()
    except Exception as e:
        print(f"[WARN]  Search index check failed: {e}")
    
    # Seed scholarships if empty
    print("[DOCS] Checking scholarships...")
    try:
        db = SessionLocal()
        scholarship_service = get_scholarship_service()
        scholarships, total = scholarship_service.get_scholarships(db, limit=1)
        if total == 0:
            import os
            json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "daad_scholarships_detailed.json")
            if os.path.exists(json_path):
                loaded = scholarship_service.load_scholarships_from_json(db, json_path)
                print(f"[OK] Seeded {loaded} scholarships")
            else:
                print(f"[WARN]  Scholarship JSON not found at {json_path}")
        else:
            print(f"[INFO]  {total} scholarships already in database")
        db.close()
    except Exception as e:
        print(f"[WARN]  Failed to seed scholarships: {e}")
    
    # Start notification scheduler
    print(" Starting notification scheduler...")
    try:
        start_scheduler()
    except Exception as e:
        print(f"[WARN]  Failed to start scheduler: {e}")
    
    print("="*60)
    print("[OK] Application started successfully!")
    print(f" API docs: http://localhost:8000/docs")
    print("="*60)
    
    yield
    
    # Shutdown
    print("\n[BYE] Shutting down application...")
    stop_scheduler()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="""
## UniAdvisorAI - Course Recommendation System API

A comprehensive API for finding and applying to German university programs.

### Features:
-  **Authentication**: JWT-based authentication with role-based access control
-  **User Profiles**: Store academic information and preferences
-  **Programs**: Browse, search, and filter German university programs
-  **AI Recommendations**: Get personalized program recommendations
-  **Chat**: Ask questions about programs with AI assistance
- [FILE] **Document Parsing**: Upload and parse academic documents

### Roles:
- **Admin**: Full access to all features including user management
- **User**: Access to profile, recommendations, and applications
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable GZip compression for all responses (minimum 500 bytes)
app.add_middleware(GZipMiddleware, minimum_size=500)

# HTTPS redirect for production (Heroku)
class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Heroku sets X-Forwarded-Proto header
        forwarded_proto = request.headers.get("x-forwarded-proto", "https")
        if forwarded_proto == "http":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url=str(url), status_code=301)
        return await call_next(request)

if not settings.DEBUG:
    app.add_middleware(HTTPSRedirectMiddleware)

# Security Headers (V-01, V-02)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Content Security Policy (CSP)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.uniadvisorai.com http://localhost:* ws://localhost:*; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        # Keep old X-Frame-Options as fallback for older browsers
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(programs_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")
app.include_router(scholarships_router, prefix="/api")
app.include_router(token_usage_router, prefix="/api")
app.include_router(applications_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(community_router, prefix="/api")
app.include_router(sop_router, prefix="/api")
app.include_router(cv_generator_router, prefix="/api")

# Vault Router
from app.routers.vault import router as vault_router
app.include_router(vault_router)



# Health check endpoints
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - basic health check"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "connected",
        "db_url": settings.DATABASE_URL
    }


@app.get("/api/health", tags=["Health"])
async def api_health():
    """API health check"""
    return {"status": "healthy", "message": "API is running"}


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    print(f"[ERROR] Unhandled error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
