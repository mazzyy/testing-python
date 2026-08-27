from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class TemplateType(str, Enum):
    """SOP template types"""
    RESEARCH = "research"  # Emphasizes research interests and methodology
    COURSE = "course"  # Emphasizes career goals and practical skills
    DAAD = "daad"  # Follows DAAD scholarship structure


class SOPRequest(BaseModel):
    """Request model for SOP generation"""
    program_id: str = Field(..., description="ID of the target program")
    why_this_program: Optional[str] = Field(None, description="User's motivation for this specific program")
    academic_background: Optional[str] = Field(None, description="Summary of user's academic history")
    future_goals: Optional[str] = Field(None, description="User's career goals")
    key_achievements: Optional[str] = Field(None, description="Key achievements or relevant experience")
    full_name: Optional[str] = Field(None, description="User's full name")
    
    # New fields
    template_type: TemplateType = Field(default=TemplateType.COURSE, description="Type of SOP template to use")
    target_word_count: int = Field(default=750, ge=400, le=1200, description="Target word count for the SOP")
    save_draft: bool = Field(default=True, description="Whether to save this generation as a draft")


class SOPResponse(BaseModel):
    """Response model for SOP generation"""
    sop_content: str = Field(..., description="The generated Statement of Purpose text")
    word_count: int = Field(default=0, description="Actual word count of the generated SOP")
    draft_id: Optional[int] = Field(None, description="ID of the saved draft, if saved")
    version: Optional[int] = Field(None, description="Version number of this draft")


class SOPDraftBase(BaseModel):
    """Base schema for SOP drafts"""
    program_id: str
    program_name: Optional[str] = None
    university_name: Optional[str] = None
    content: str
    word_count: int = 0
    template_type: str = "course"
    target_word_count: int = 750
    is_favorite: bool = False


class SOPDraftCreate(SOPDraftBase):
    """Schema for creating a new draft"""
    generation_params: Optional[Dict[str, Any]] = None


class SOPDraftResponse(SOPDraftBase):
    """Schema for draft response"""
    id: int
    version: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SOPDraftListResponse(BaseModel):
    """Response for listing drafts"""
    drafts: List[SOPDraftResponse]
    total: int


class SOPDraftCompareRequest(BaseModel):
    """Request to compare two drafts"""
    draft_id_1: int
    draft_id_2: int


class SOPDraftCompareResponse(BaseModel):
    """Response for draft comparison"""
    draft_1: SOPDraftResponse
    draft_2: SOPDraftResponse
    word_count_diff: int  # Positive = draft_2 has more words
