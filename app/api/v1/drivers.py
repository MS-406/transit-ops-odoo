from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, exc

from app.db.session import get_db
from app.models.driver import Driver
from app.models.user import User
from app.schemas.driver import DriverCreate, DriverUpdate, DriverOut
from app.core.deps import get_current_user, require_role
from app.core.exceptions import APIException

router = APIRouter(prefix="/drivers", tags=["Drivers"])

@router.get("", response_model=List[DriverOut])
async def list_drivers(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List drivers. Accessible to all authenticated users."""
    query = select(Driver).offset(skip).limit(limit)
    if status_filter:
        query = query.where(Driver.status == status_filter)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{driver_id}", response_model=DriverOut)
async def get_driver(
    driver_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific driver by ID."""
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalars().first()
    if not driver:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found", code="NOT_FOUND")
    return driver

@router.post("", response_model=DriverOut, status_code=status.HTTP_201_CREATED)
async def create_driver(
    payload: DriverCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager"]))
):
    """Create a new driver. Restricted to fleet managers."""
    valid_statuses = ["Available", "On Trip", "Suspended"]
    if payload.status not in valid_statuses:
         raise APIException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail=f"Invalid status. Must be one of {valid_statuses}",
             code="INVALID_STATUS"
         )
         
    if payload.license_expiry_date < date.today():
         raise APIException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail="License is expired.",
             code="EXPIRED_LICENSE"
         )

    driver = Driver(**payload.model_dump())
    db.add(driver)
    try:
        await db.commit()
        await db.refresh(driver)
        return driver
    except exc.IntegrityError:
        await db.rollback()
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Driver with this license number already exists.", 
            code="DUPLICATE_LICENSE"
        )

@router.put("/{driver_id}", response_model=DriverOut)
async def update_driver(
    driver_id: int,
    payload: DriverUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager"]))
):
    """Update a driver. Restricted to fleet managers."""
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalars().first()
    if not driver:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found", code="NOT_FOUND")
    
    if payload.status:
        valid_statuses = ["Available", "On Trip", "Suspended"]
        if payload.status not in valid_statuses:
             raise APIException(
                 status_code=status.HTTP_400_BAD_REQUEST,
                 detail=f"Invalid status. Must be one of {valid_statuses}",
                 code="INVALID_STATUS"
             )
             
    if payload.license_expiry_date and payload.license_expiry_date < date.today():
         raise APIException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail="License is expired.",
             code="EXPIRED_LICENSE"
         )
             
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(driver, key, value)
        
    try:
        db.add(driver)
        await db.commit()
        await db.refresh(driver)
        return driver
    except exc.IntegrityError:
        await db.rollback()
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Driver with this license number already exists.", 
            code="DUPLICATE_LICENSE"
        )

@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager"]))
):
    """Delete a driver. Restricted to fleet managers."""
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalars().first()
    if not driver:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found", code="NOT_FOUND")
        
    try:
        await db.delete(driver)
        await db.commit()
    except exc.IntegrityError:
        await db.rollback()
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete driver because they are referenced in trips.",
            code="FOREIGN_KEY_VIOLATION"
        )
