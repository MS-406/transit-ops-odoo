from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, exc
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from app.core.deps import get_current_user, require_role
from app.core.exceptions import APIException

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[VehicleOut])
async def list_vehicles(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List vehicles. Accessible to all authenticated users."""
    query = select(Vehicle).offset(skip).limit(limit)
    if status_filter:
        query = query.where(Vehicle.status == status_filter)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{vehicle_id}", response_model=VehicleOut)
async def get_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific vehicle by ID."""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found", code="NOT_FOUND")
    return vehicle

@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    payload: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager"]))
):
    """Create a new vehicle. Restricted to fleet managers."""
    # Ensure status is valid
    valid_statuses = ["Available", "On Trip", "In Shop", "Retired"]
    if payload.status not in valid_statuses:
         raise APIException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail=f"Invalid status. Must be one of {valid_statuses}",
             code="INVALID_STATUS"
         )
         
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    try:
        await db.commit()
        await db.refresh(vehicle)
        return vehicle
    except exc.IntegrityError:
        await db.rollback()
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Vehicle with this registration number already exists.", 
            code="DUPLICATE_REGISTRATION"
        )

@router.put("/{vehicle_id}", response_model=VehicleOut)
async def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager"]))
):
    """Update a vehicle. Restricted to fleet managers."""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found", code="NOT_FOUND")
    
    if payload.status:
        valid_statuses = ["Available", "On Trip", "In Shop", "Retired"]
        if payload.status not in valid_statuses:
             raise APIException(
                 status_code=status.HTTP_400_BAD_REQUEST,
                 detail=f"Invalid status. Must be one of {valid_statuses}",
                 code="INVALID_STATUS"
             )
             
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vehicle, key, value)
        
    try:
        db.add(vehicle)
        await db.commit()
        await db.refresh(vehicle)
        return vehicle
    except exc.IntegrityError:
        await db.rollback()
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Vehicle with this registration number already exists.", 
            code="DUPLICATE_REGISTRATION"
        )

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager"]))
):
    """Delete a vehicle. Restricted to fleet managers."""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found", code="NOT_FOUND")
        
    try:
        await db.delete(vehicle)
        await db.commit()
    except exc.IntegrityError:
        await db.rollback()
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete vehicle because it is referenced in trips or logs.",
            code="FOREIGN_KEY_VIOLATION"
        )
