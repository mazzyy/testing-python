"""
Pydantic schemas for Community feature
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
# User Summary Schema
class UserSummary(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Vote Schemas
class VoteCreate(BaseModel):
    value: int # 1 or -1
    post_id: Optional[int] = None
    comment_id: Optional[int] = None

# Comment Schemas
class CommentBase(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str

class CommentResponse(CommentBase):
    id: int
    post_id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: Optional[UserSummary] = None
    vote_count: int = 0
    user_vote: int = 0 # Current user's vote on this comment
    replies: List['CommentResponse'] = Field(default_factory=list)

    class Config:
        from_attributes = True

# Post Schemas
class PostBase(BaseModel):
    title: str
    content: str
    category: Optional[str] = None

class PostCreate(PostBase):
    tags: List[str] = []

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class PostResponse(PostBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: Optional[UserSummary] = None
    comment_count: int = 0
    vote_count: int = 0
    user_vote: int = 0 # Current user's vote on this post
    tags: List[str] = []
    is_saved: bool = False

    @field_validator('tags', mode='before')
    @classmethod
    def parse_tags(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v

    class Config:
        from_attributes = True

class PostDetailResponse(PostResponse):
    comments: List[CommentResponse] = Field(default_factory=list)
