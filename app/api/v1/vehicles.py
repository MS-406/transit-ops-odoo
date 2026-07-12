from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, exc, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.vehicle import Vehicle
from app.models.user import User
from app.models.fuel import FuelLog
from app.models.maintenance import MaintenanceLog
from app.models.expense import Expense
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
    current_user: User = Depends(require_role(["fleet_manager", "dispatcher", "financial_analyst"]))
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
    current_user: User = Depends(require_role(["fleet_manager", "dispatcher", "financial_analyst"]))
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

@router.patch("/{vehicle_id}", response_model=VehicleOut)
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

@router.get("/{vehicle_id}/cost-rollup")
async def get_vehicle_cost_rollup(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst"]))
):
    """Get total cost rollup (Fuel + Maintenance + Expenses) for a vehicle."""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    if not result.scalars().first():
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found", code="NOT_FOUND")
        
    fuel_res = await db.execute(select(func.sum(FuelLog.cost)).where(FuelLog.vehicle_id == vehicle_id))
    total_fuel_cost = fuel_res.scalar() or 0.0
    
    maint_res = await db.execute(select(func.sum(MaintenanceLog.cost)).where(MaintenanceLog.vehicle_id == vehicle_id))
    total_maintenance_cost = maint_res.scalar() or 0.0
    
    exp_res = await db.execute(select(func.sum(Expense.amount)).where(Expense.vehicle_id == vehicle_id))
    total_other_expenses = exp_res.scalar() or 0.0
    
    total_cost = total_fuel_cost + total_maintenance_cost + total_other_expenses
    
    return {
        "vehicle_id": vehicle_id,
        "total_fuel_cost": total_fuel_cost,
        "total_maintenance_cost": total_maintenance_cost,
        "total_other_expenses": total_other_expenses,
        "total_cost": total_cost
    }
