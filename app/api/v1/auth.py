from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, TokenRefreshRequest, UserOut
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import APIException
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def _user_to_dict(user: User) -> dict:
    """Convert a SQLAlchemy User (with eager-loaded role) to a serializable dict."""
    role_name = user.role.name if user.role else "unknown"
    # Frontend expects display names like "Fleet Manager"
    display_role = role_name.replace("_", " ").title() if role_name != "unknown" else role_name

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "name": user.full_name,  # Frontend uses user?.name
        "role": display_role,
    }

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Find user by email, eager load role
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.email == payload.email)
    )
    user = result.scalars().first()
    
    if not user or not verify_password(payload.password, user.password_hash):
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            code="INVALID_CREDENTIALS"
        )
        
    if not user.is_active:
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
            code="INACTIVE_USER"
        )
        
    # Generate tokens
    access_token = create_access_token(subject=user.email)
    refresh_token = create_refresh_token(subject=user.email)
    
    # Store active refresh token in database for rotation/replay detection
    user.refresh_token = refresh_token
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": _user_to_dict(user)
    }

@router.post("/refresh")
async def refresh_token(payload: TokenRefreshRequest, db: AsyncSession = Depends(get_db)):
    # Decode and validate refresh token
    token_data = decode_token(payload.refresh_token)
    if not token_data or token_data.get("type") != "refresh":
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
            code="INVALID_REFRESH_TOKEN"
        )
        
    email = token_data.get("sub")
    if not email:
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            code="INVALID_REFRESH_TOKEN"
        )
        
    # Fetch user, eager load role
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.email == email)
    )
    user = result.scalars().first()
    
    if not user or not user.is_active:
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
            code="USER_NOT_FOUND"
        )
        
    # Replay attack check: compare against stored refresh token
    if user.refresh_token != payload.refresh_token:
        # Replay attack! Someone is trying to reuse an old or hijacked refresh token.
        # Immediately invalidate the current session by clearing the database stored token.
        user.refresh_token = None
        db.add(user)
        await db.commit()
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Replay attack detected: refresh token has already been used or invalidated.",
            code="REPLAY_ATTACK_DETECTED"
        )
        
    # Token is valid and matches DB, perform rotation
    new_access_token = create_access_token(subject=user.email)
    new_refresh_token = create_refresh_token(subject=user.email)
    
    # Save the rotated refresh token in the DB
    user.refresh_token = new_refresh_token
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token
    }

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return _user_to_dict(current_user)
