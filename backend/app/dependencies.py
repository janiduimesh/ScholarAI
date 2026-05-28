from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.models.user_model import User

def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(AuthService.oauth2_scheme)
) -> User:
    """
    Dependency that returns the current authenticated user.
    """
    return AuthService.get_current_user(db, token)

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that verifies if the current user is active.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user
