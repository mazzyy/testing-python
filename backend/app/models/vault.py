"""
Vault models for documents and credentials
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class DocumentCategory(str, enum.Enum):
    """Categories for user documents"""
    CV = "cv"
    TRANSCRIPT = "transcript"
    DEGREE = "degree"
    CERTIFICATE = "certificate"
    RECOMMENDATION = "recommendation"
    COVER_LETTER = "cover_letter"
    IDENTIFICATION = "identification"
    FINANCIAL = "financial"
    SOP = "sop"
    TEST_SCORE = "test_score"
    RESEARCH_PROPOSAL = "research_proposal"
    PORTFOLIO = "portfolio"
    OTHER = "other"


class CredentialCategory(str, enum.Enum):
    """Categories for stored credentials"""
    UNIVERSITY_PORTAL = "university_portal"
    VISA_PORTAL = "visa_portal"
    SCHOLARSHIP_PORTAL = "scholarship_portal"
    TEST_PORTAL = "test_portal"
    OTHER = "other"


class UserDocument(Base):
    """
    Model for storing user documents in the Vault.
    This stores metadata about the file. The actual file is stored on disk/S3.
    """
    __tablename__ = "user_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # File details
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)  # Path relative to upload dir or URL
    file_type = Column(String(100), nullable=True)   # MIME type or extension
    file_size = Column(Integer, nullable=True)       # Size in bytes

    # Organization
    category = Column(Enum(DocumentCategory), default=DocumentCategory.OTHER, nullable=False)
    description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="vault_documents")

    def __repr__(self):
        return f"<UserDocument(id={self.id}, name={self.file_name}, category={self.category})>"


class UserCredential(Base):
    """
    Model for storing user credentials for various portals.
    WARNING: Passwords should be stored with care. 
    For this MVP, we will store them but they should ideally be encrypted at rest if possible.
    """
    __tablename__ = "user_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Credential details
    title = Column(String(255), nullable=False)  # e.g. "TU Munich Portal"
    url = Column(String(500), nullable=True)
    username = Column(String(255), nullable=True)
    password = Column(String(500), nullable=True)  # In a real app, encrypt this field!
    
    # Organization
    category = Column(Enum(CredentialCategory), default=CredentialCategory.OTHER, nullable=False)
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="vault_credentials")

    def __repr__(self):
        return f"<UserCredential(id={self.id}, title={self.title})>"
