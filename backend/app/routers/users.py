"""
Users Router - Admin user management
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.user_profile import UserProfile, UserApplication
from app.models.cached_recommendation import CachedRecommendation
from app.models.program import Program
from app.schemas.user import UserResponse, UserUpdate, UserListResponse, UserCreate
from app.schemas.profile import UserProfileResponse, UserApplicationResponse
from app.schemas.admin import UserDetailResponse, UserStatsResponse, CachedRecommendationResponse
from app.auth import get_current_admin_user, get_password_hash

router = APIRouter(prefix="/users", tags=["Users (Admin)"])


@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get user statistics for admin dashboard
    """
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    inactive_users = db.query(User).filter(User.is_active == False).count()
    admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
    user_count = db.query(User).filter(User.role == UserRole.USER).count()
    verified_users = db.query(User).filter(User.is_verified == True).count()
    unverified_users = db.query(User).filter(User.is_verified == False).count()
    users_with_profile = db.query(UserProfile).count()
    users_with_applications = db.query(func.distinct(UserApplication.user_id)).count()
    
    return UserStatsResponse(
        total_users=total_users,
        active_users=active_users,
        inactive_users=inactive_users,
        admin_count=admin_count,
        user_count=user_count,
        verified_users=verified_users,
        unverified_users=unverified_users,
        users_with_profile=users_with_profile,
        users_with_applications=users_with_applications
    )


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    List all users (Admin only)
    
    - **page**: Page number
    - **page_size**: Items per page
    - **role**: Filter by role (admin/user)
    - **is_active**: Filter by active status
    - **search**: Search in email, username, full_name
    """
    query = db.query(User)
    
    # Apply filters
    if role:
        query = query.filter(User.role == role)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) |
            (User.username.ilike(search_term)) |
            (User.full_name.ilike(search_term))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    skip = (page - 1) * page_size
    users = query.offset(skip).limit(page_size).all()
    
    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get a specific user by ID (Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/{user_id}/details", response_model=UserDetailResponse)
async def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get comprehensive user details including profile, applications, and recommendations (Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    profile_response = UserProfileResponse.model_validate(profile) if profile else None
    
    # Get all applications with program details
    applications = db.query(UserApplication).filter(
        UserApplication.user_id == user_id
    ).all()
    
    application_responses = []
    for app in applications:
        app_dict = {
            "id": app.id,
            "user_id": app.user_id,
            "program_id": app.program_id,
            "status": app.status,
            "match_score": app.match_score,
            "user_notes": app.user_notes,
            "admin_notes": app.admin_notes,
            "created_at": app.created_at,
            "updated_at": app.updated_at,
            "submitted_at": app.submitted_at,
            "program": app.program
        }
        application_responses.append(UserApplicationResponse.model_validate(app_dict))
    
    # Get all cached recommendations
    cached_recs = db.query(CachedRecommendation).filter(
        CachedRecommendation.user_id == user_id
    ).all()
    
    recommendation_responses = []
    for rec in cached_recs:
        # Get program details
        program = db.query(Program).filter(Program.id == rec.program_id).first()
        rec_response = CachedRecommendationResponse(
            id=rec.id,
            program_id=rec.program_id,
            match_score=rec.match_score,
            match_reasons=rec.match_reasons,
            highlights=rec.highlights,
            gaps=rec.gaps,
            created_at=rec.created_at,
            program_name=program.program_name if program else None,
            university_name=program.university_name if program else None,
            degree_type=program.degree_type if program else None,
            city=program.city if program else None
        )
        recommendation_responses.append(rec_response)
    
    return UserDetailResponse(
        user=UserResponse.model_validate(user),
        profile=profile_response,
        applications=application_responses,
        recommendations=recommendation_responses
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Create a new user (Admin only)
    
    Admins can create users with any role
    """
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role or UserRole.USER,
        is_active=True,
        is_verified=True  # Admin-created users are auto-verified
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Update a user (Admin only)
    
    Admins can update any user's information including role
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from removing their own admin status
    if user.id == current_admin.id and user_data.role == UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own admin privileges"
        )
    
    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    
    # Hash password if being updated
    if 'password' in update_data:
        update_data['hashed_password'] = get_password_hash(update_data.pop('password'))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    hard_delete: bool = False,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Delete a user (Admin only)
    
    - **hard_delete**: If True, permanently delete. Otherwise, soft delete (deactivate)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    if hard_delete:
        db.delete(user)
    else:
        user.is_active = False
    
    db.commit()


@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Activate a deactivated user (Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/{user_id}/make-admin", response_model=UserResponse)
async def make_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Promote a user to admin (Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = UserRole.ADMIN
    db.commit()
    db.refresh(user)
    
    return user

