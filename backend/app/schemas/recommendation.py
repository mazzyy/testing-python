"""
Recommendation and Chat schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from app.schemas.program import ProgramResponse
from app.schemas.scholarship import ScholarshipResponse


class RecommendationRequest(BaseModel):
    """Request for getting recommendations"""
    query: Optional[str] = None
    use_profile: bool = True  # Whether to use user profile for context
    n_results: int = Field(default=10, ge=1, le=50)
    degree_type: Optional[str] = None  # Filter by degree type
    city: Optional[str] = None
    teaching_language: Optional[str] = None
    force_refresh: bool = False  # Force recalculation (clears cache)


class ProgramRecommendation(BaseModel):
    """A single program recommendation"""
    program: ProgramResponse
    match_score: float = Field(..., ge=0, le=100)
    match_reasons: List[str] = []
    gaps: List[str] = []  # Potential concerns or missing requirements
    highlights: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Response with recommendations"""
    recommendations: List[ProgramRecommendation]
    total_found: int
    query_used: Optional[str] = None
    filters_applied: dict = {}


class ChatRequest(BaseModel):
    """Chat request for Q&A about programs"""
    message: str = Field(..., min_length=1, max_length=2000)
    include_recommendations: bool = False
    n_results: int = Field(default=5, ge=1, le=20)


class ChatMessage(BaseModel):
    """A chat message"""
    role: str  # "user" or "assistant"
    content: str


class ChatResponse(BaseModel):
    """Chat response"""
    response: str
    recommendations: Optional[List[ProgramRecommendation]] = None
    scholarships: Optional[List[ScholarshipResponse]] = None
    universities: Optional[List[dict]] = None
    vault_documents: Optional[List[dict]] = None
    sources: Optional[List[str]] = None  # Program names used as context


class DocumentParseRequest(BaseModel):
    """Request to parse uploaded document"""
    document_type: str = Field(..., description="Type: transcript, cv, degree, language_cert")


class DocumentParseResponse(BaseModel):
    """Response from document parsing"""
    success: bool
    extracted_data: Optional[dict] = None
    error: Optional[str] = None
    raw_text_preview: Optional[str] = None
