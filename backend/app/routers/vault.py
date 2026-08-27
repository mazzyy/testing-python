"""
API Router for Vault Feature
Handles document aggregation, upload, and credential management.
"""
from typing import List, Optional
import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.vault import UserDocument, UserCredential, DocumentCategory, CredentialCategory
from app.models.user_profile import UserProfile
from app.models.application_tracker import DocumentRequirement, ApplicationCredential, DocumentType
from app.schemas.vault import (
    DocumentResponse, DocumentCreate, DocumentUpdate,
    CredentialResponse, CredentialCreate, CredentialUpdate
)

router = APIRouter(
    prefix="/api/vault",
    tags=["vault"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_DIR = "uploads/vault"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# --- Document Endpoints ---

@router.get("/documents", response_model=List[DocumentResponse])
async def get_vault_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all documents for the user.
    Aggregates from:
    1. UserDocument (Vault specific uploads)
    2. UserProfile (CV, Transcript, etc.)
    3. DocumentRequirement (Application specific files)
    """
    return get_all_user_documents(current_user, db)


def get_all_user_documents(user: User, db: Session) -> List[DocumentResponse]:
    """Helper service to fetch all documents for a user across different tables."""
    # 1. Fetch Vault Documents
    vault_docs = db.query(UserDocument).filter(UserDocument.user_id == user.id).all()
    
    combined_docs = []
    
    # Add Vault Docs
    for doc in vault_docs:
        combined_docs.append(DocumentResponse(
            id=doc.id,
            user_id=doc.user_id,
            file_name=doc.file_name,
            file_path=doc.file_path,
            file_type=doc.file_type,
            file_size=doc.file_size,
            category=doc.category,
            description=doc.description,
            created_at=doc.created_at,
            updated_at=doc.updated_at
        ))

    # 2. Fetch Profile Documents
    profile = user.profile
    if profile:
        # Check standard profile docs
        if profile.cv_path:
            combined_docs.append(_create_transient_doc(user.id, "CV", profile.cv_path, DocumentCategory.CV, -1))
        if profile.transcript_path:
            combined_docs.append(_create_transient_doc(user.id, "Transcript", profile.transcript_path, DocumentCategory.TRANSCRIPT, -2))
        if profile.degree_certificate_path:
            combined_docs.append(_create_transient_doc(user.id, "Degree Certificate", profile.degree_certificate_path, DocumentCategory.DEGREE, -3))

    for app in user.applications:
        for req in app.document_requirements:
            if req.file_path:
                # 1. Determine Category Mapping
                cat = DocumentCategory.OTHER
                dt = req.document_type
                
                # Mapping logic from DocumentType to DocumentCategory
                if dt == DocumentType.CV_RESUME:
                    cat = DocumentCategory.CV
                elif dt == DocumentType.TRANSCRIPT:
                    cat = DocumentCategory.TRANSCRIPT
                elif dt == DocumentType.DEGREE_CERTIFICATE:
                    cat = DocumentCategory.DEGREE
                elif dt == DocumentType.LOR:
                    cat = DocumentCategory.RECOMMENDATION
                elif dt == DocumentType.SOP or dt == DocumentType.PERSONAL_STATEMENT:
                    cat = DocumentCategory.SOP
                elif dt == DocumentType.RESEARCH_PROPOSAL:
                    cat = DocumentCategory.RESEARCH_PROPOSAL
                elif dt == DocumentType.PORTFOLIO:
                    cat = DocumentCategory.PORTFOLIO
                elif dt == DocumentType.GRE_SCORE or dt == DocumentType.GMAT_SCORE:
                    cat = DocumentCategory.TEST_SCORE
                elif dt == DocumentType.LANGUAGE_CERTIFICATE:
                    cat = DocumentCategory.CERTIFICATE
                elif dt == DocumentType.PASSPORT:
                    cat = DocumentCategory.IDENTIFICATION

                # 2. Format File Name with University Context
                uni_name = app.program.university_name if app.program else "Application"
                base_name = req.file_name or req.document_type.value.replace('_', ' ').title()
                display_name = base_name

                # Use a deterministic hash or unique negative ID for these
                fake_id = -(1000 + req.id) 
                combined_docs.append(_create_transient_doc(
                    user.id, 
                    display_name, 
                    req.file_path, 
                    cat, 
                    fake_id,
                    description=f"Application to {uni_name}"
                ))

    return combined_docs


def _create_transient_doc(user_id, name, path, category, fake_id, description=None):
    """Helper to create a DocumentResponse from other sources"""
    return DocumentResponse(
        id=fake_id,
        user_id=user_id,
        file_name=name,
        file_path=path,
        category=category,
        description=description,
        created_at=datetime.utcnow(), # Approximate
        updated_at=None
    )


@router.post("/documents", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    category: DocumentCategory = Form(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a new document to the Vault
    """
    file_location = f"{UPLOAD_DIR}/{current_user.id}_{int(datetime.utcnow().timestamp())}_{file.filename}"
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # Get file size
    file_size = os.path.getsize(file_location)
    
    new_doc = UserDocument(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=file_location,
        file_type=file.content_type,
        file_size=file_size,
        category=category,
        description=description
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return new_doc


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document. 
    Only allows deleting UserDocuments (positive IDs).
    Transient documents (negative IDs) cannot be deleted here.
    """
    if doc_id < 0:
        raise HTTPException(status_code=400, detail="Cannot delete system-generated document references from Vault. Delete them from their source (Profile/Application).")

    doc = db.query(UserDocument).filter(UserDocument.id == doc_id, UserDocument.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        
    db.delete(doc)
    db.commit()
    return None


from fastapi.responses import FileResponse

@router.get("/documents/{doc_id}/download")
async def download_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download a document.
    Handles both UserDocument (positive IDs) and system files (negative IDs).
    """
    file_path = None
    filename = "document"

    if doc_id > 0:
        # UserDocument
        doc = db.query(UserDocument).filter(UserDocument.id == doc_id, UserDocument.user_id == current_user.id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        file_path = doc.file_path
        filename = doc.file_name
    else:
        # System references
        # Logic matches get_vault_documents aggregation
        profile = current_user.profile
        
        if doc_id == -1 and profile and profile.cv_path:
            file_path = profile.cv_path
            filename = "CV.pdf" # Best guess extension
        elif doc_id == -2 and profile and profile.transcript_path:
            file_path = profile.transcript_path
            filename = "Transcript.pdf"
        elif doc_id == -3 and profile and profile.degree_certificate_path:
            file_path = profile.degree_certificate_path
            filename = "Degree_Certificate.pdf"
        elif doc_id < -1000:
            # Application requirement
            req_id = abs(doc_id) - 1000
            # Verify ownership via relationship
            req = db.query(DocumentRequirement).join(DocumentRequirement.application).filter(
                DocumentRequirement.id == req_id,
                # Ensure application belongs to user
                # utilizing the relationship chain: DocumentRequirement -> UserApplication -> User
            ).first()
            
            # Since the query above is complex to construct purely with ORM joins without importing UserApplication,
            # let's fetch and verify.
            req = db.query(DocumentRequirement).get(req_id)
            if req and req.application.user_id == current_user.id and req.file_path:
                file_path = req.file_path
                filename = req.file_name or "Application_Document"

    import mimetypes

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    # Determine media type
    media_type, _ = mimetypes.guess_type(file_path)
    if not media_type:
        media_type = "application/octet-stream"

    return FileResponse(
        file_path, 
        filename=filename, 
        media_type=media_type,
        content_disposition_type="inline"
    )


# --- Credential Endpoints ---

@router.get("/credentials", response_model=List[CredentialResponse])
async def get_credentials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all stored credentials"""
    return db.query(UserCredential).filter(UserCredential.user_id == current_user.id).all()


@router.post("/credentials", response_model=CredentialResponse)
async def create_credential(
    credential: CredentialCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Store a new credential"""
    new_cred = UserCredential(
        user_id=current_user.id,
        **credential.dict()
    )
    db.add(new_cred)
    db.commit()
    db.refresh(new_cred)
    return new_cred


@router.put("/credentials/{cred_id}", response_model=CredentialResponse)
async def update_credential(
    cred_id: int,
    credential: CredentialUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing credential"""
    db_cred = db.query(UserCredential).filter(UserCredential.id == cred_id, UserCredential.user_id == current_user.id).first()
    if not db_cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    update_data = credential.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cred, key, value)
        
    db.commit()
    db.refresh(db_cred)
    return db_cred


@router.delete("/credentials/{cred_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credential(
    cred_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a credential"""
    db_cred = db.query(UserCredential).filter(UserCredential.id == cred_id, UserCredential.user_id == current_user.id).first()
    if not db_cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    db.delete(db_cred)
    db.commit()
    return None
