"""
Pydantic schemas for the Vault feature
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.vault import DocumentCategory, CredentialCategory


# --- Document Schemas ---

class DocumentBase(BaseModel):
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    category: DocumentCategory = DocumentCategory.OTHER
    description: Optional[str] = None


class DocumentCreate(DocumentBase):
    pass  # file_path is handled by backend logic on upload


class DocumentUpdate(BaseModel):
    file_name: Optional[str] = None
    category: Optional[DocumentCategory] = None
    description: Optional[str] = None


class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    file_path: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# --- Credential Schemas ---

class CredentialBase(BaseModel):
    title: str
    url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    category: CredentialCategory = CredentialCategory.OTHER
    notes: Optional[str] = None


class CredentialCreate(CredentialBase):
    pass


class CredentialUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    category: Optional[CredentialCategory] = None
    notes: Optional[str] = None


class CredentialResponse(CredentialBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
