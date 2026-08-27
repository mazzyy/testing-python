"""
Authentication utilities - JWT token handling and password hashing
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import TokenData

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using SHA-256 with salt"""
    # Extract salt from stored hash (first 32 chars)
    if len(hashed_password) < 96:  # 32 (salt) + 64 (hash)
        return False
    salt = hashed_password[:32]
    stored_hash = hashed_password[32:]
    # Hash the provided password with the same salt
    password_hash = hashlib.sha256((salt + plain_password).encode()).hexdigest()
    print(f"Verifying: plain={plain_password}, hash_len={len(hashed_password)}")
    return secrets.compare_digest(password_hash, stored_hash)


def get_password_hash(password: str) -> str:
    """Hash a password using SHA-256 with random salt"""
    salt = secrets.token_hex(16)  # 32 char hex string
    password_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return salt + password_hash  # Total 96 chars


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def create_password_reset_token(email: str) -> str:
    """
    Create a password reset token (valid for 15 minutes)
    """
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"sub": email, "purpose": "reset_password", "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """
    Decode and validate a JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        TokenData if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        print(f"DEBUG decode_token: payload={payload}, user_id_str={user_id_str}")
        
        if user_id_str is None:
            return None
        
        # Convert string user_id back to integer
        user_id = int(user_id_str)
        
        return TokenData(user_id=user_id, email=email, role=role)
    except JWTError as e:
        print(f"DEBUG decode_token ERROR: {type(e).__name__}: {e}")
        return None
    except ValueError as e:
        print(f"DEBUG decode_token ValueError: {e}")
        return None


def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verify a password reset token and return the email
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        purpose = payload.get("purpose")
        
        if email is None or purpose != "reset_password":
            return None
            
        return email
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user
    
    Args:
        token: JWT token from request
        db: Database session
    
    Returns:
        Current user object
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    print(f"DEBUG get_current_user: token received = {token[:50] if token else 'None'}...")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_token(token)
    print(f"DEBUG get_current_user: token_data = {token_data}")
    if token_data is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user


async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to get the current user if authenticated, else None.
    Does not raise 401 if token is missing.
    """
    if not token:
        return None
    
    try:
        token_data = decode_token(token)
        if token_data is None:
            return None
            
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if user is None or not user.is_active:
            return None
            
        return user
    except Exception:
        return None


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get current active user
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure current user is an admin
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        Admin user object
    
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user by email and password
    
    Args:
        db: Database session
        email: User's email
        password: User's password
    
    Returns:
        User object if authentication successful, None otherwise
    """
    user = db.query(User).filter(User.email == email).first()
    print(f"User found: {user}, hash: {user.hashed_password if user else 'N/A'}")
    print(f"Searching for email: {email}")
    all_users = db.query(User).all()
    print(f"All users: {[(u.id, u.email) for u in all_users]}")
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    return user
