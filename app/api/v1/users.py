from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.db.session import get_db
from app.models.user import User, Role
from app.schemas.auth import UserOut, UserCreate
from app.core.deps import require_role
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserOut])
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "fleet_manager"]))
):
    """Get all users. Fleet Managers can only see Drivers."""
    # We should load the roles.
    roles_result = await db.execute(select(Role))
    roles_map = {r.id: r.name for r in roles_result.scalars().all()}
    
    query = select(User).order_by(User.id)
    
    # If the user is a fleet manager, they can only view drivers
    current_role_name = roles_map.get(current_user.role_id, "")
    if current_role_name == "fleet_manager":
        driver_role_id = next((k for k, v in roles_map.items() if v == "driver"), None)
        if driver_role_id:
            query = query.where(User.role_id == driver_role_id)
            
    result = await db.execute(query)
    users = result.scalars().all()
    
    users_out = []
    for u in users:
        role_name = roles_map.get(u.role_id, "unknown")
        users_out.append(UserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            name=u.full_name,
            role=role_name
        ))
    return users_out

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "fleet_manager"]))
):
    """Create a new user account. Fleet Managers can only create Drivers."""
    
    # Pre-fetch roles
    roles_result = await db.execute(select(Role))
    roles_map = {r.id: r.name for r in roles_result.scalars().all()}
    current_role_name = roles_map.get(current_user.role_id, "")
    
    if current_role_name == "fleet_manager" and user_data.role_name != "driver":
        raise HTTPException(status_code=403, detail="Fleet Managers can only create Driver accounts")
        
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Get role
    role_id = next((k for k, v in roles_map.items() if v == user_data.role_name), None)
    if not role_id:
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password),
        role_id=role_id,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserOut(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        name=new_user.full_name,
        role=user_data.role_name
    )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Delete a user account. Restricted to admin only to prevent accidental lockouts."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    return None
