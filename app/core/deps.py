from typing import List
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.core.security import decode_token
from app.core.exceptions import APIException
from app.models.user import User

# oauth2_scheme parses Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency to validate the JWT access token and return the current active user."""
    if not token:
        raise APIException(
            status_code=401,
            detail="Authentication token is missing.",
            code="NOT_AUTHENTICATED"
        )
    
    payload = decode_token(token)
    if not payload:
        raise APIException(
            status_code=401,
            detail="Invalid or expired authentication token.",
            code="INVALID_TOKEN"
        )
    
    if payload.get("type") != "access":
        raise APIException(
            status_code=401,
            detail="Invalid token type. Expected access token.",
            code="INVALID_TOKEN"
        )
        
    email = payload.get("sub")
    if not email:
        raise APIException(
            status_code=401,
            detail="Invalid token payload: missing subject.",
            code="INVALID_TOKEN"
        )
        
    # Eager load the role to resolve user permissions
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.email == email)
    )
    user = result.scalars().first()
    
    if not user:
        raise APIException(
            status_code=401,
            detail="User not found.",
            code="USER_NOT_FOUND"
        )
        
    if not user.is_active:
        raise APIException(
            status_code=401,
            detail="User account is inactive.",
            code="INACTIVE_USER"
        )
        
    return user

def require_role(allowed_roles: List[str]):
    """Dependency factory to enforce Role-Based Access Control (RBAC)."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.role or current_user.role.name not in allowed_roles:
            raise APIException(
                status_code=403,
                detail="You do not have the required permissions to perform this action.",
                code="INSUFFICIENT_PERMISSIONS"
            )
        return current_user
    return role_checker
