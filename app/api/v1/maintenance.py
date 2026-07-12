from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.maintenance import MaintenanceLog
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.maintenance import MaintenanceCreate, MaintenanceOut
from app.core.deps import get_current_user, require_role
from app.core.exceptions import APIException

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

@router.get("", response_model=List[MaintenanceOut])
async def list_maintenance(
    vehicle_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "safety_officer", "financial_analyst", "admin"]))
):
    """List maintenance logs. Can filter by vehicle_id."""
    query = select(MaintenanceLog).options(selectinload(MaintenanceLog.vehicle))
    if vehicle_id:
        query = query.where(MaintenanceLog.vehicle_id == vehicle_id)
        
    result = await db.execute(query)
    logs = result.scalars().all()
    
    out = []
    for log in logs:
        out.append(MaintenanceOut(
            id=log.id,
            description=log.description,
            cost=log.cost,
            status="Open" if log.is_active else "Closed",
            date=log.opened_at,
            vehicle_id=log.vehicle_id,
            vehicle_reg=log.vehicle.registration_number if log.vehicle else "N/A",
            vehicle_model=log.vehicle.name_model if log.vehicle else "Unknown"
        ))
    return out

@router.post("", response_model=MaintenanceOut, status_code=status.HTTP_201_CREATED)
async def create_maintenance(
    payload: MaintenanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "admin"]))
):
    """Open a new maintenance log. Flips vehicle to In Shop."""
    # Lock the vehicle
    result = await db.execute(select(Vehicle).where(Vehicle.id == payload.vehicle_id).with_for_update())
    vehicle = result.scalars().first()
    
    if not vehicle:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found", code="NOT_FOUND")
        
    if vehicle.status == "On Trip":
        raise APIException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot open maintenance on a vehicle that is currently On Trip.",
            code="VEHICLE_ON_TRIP"
        )
        
    log = MaintenanceLog(
        **payload.model_dump(),
        is_active=True,
        opened_at=datetime.utcnow()
    )
    
    if vehicle.status != "Retired":
        vehicle.status = "In Shop"
    
    db.add(log)
    db.add(vehicle)
    await db.commit()
    await db.refresh(log)
    
    # Reload with relations
    result = await db.execute(
        select(MaintenanceLog)
        .options(selectinload(MaintenanceLog.vehicle))
        .where(MaintenanceLog.id == log.id)
    )
    saved_log = result.scalars().first()
    
    return MaintenanceOut(
        id=saved_log.id,
        description=saved_log.description,
        cost=saved_log.cost,
        status="Open" if saved_log.is_active else "Closed",
        date=saved_log.opened_at,
        vehicle_id=saved_log.vehicle_id,
        vehicle_reg=saved_log.vehicle.registration_number if saved_log.vehicle else "N/A",
        vehicle_model=saved_log.vehicle.name_model if saved_log.vehicle else "Unknown"
    )

@router.patch("/{log_id}/close", response_model=MaintenanceOut)
async def close_maintenance(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "admin"]))
):
    """Close an active maintenance log. Flips vehicle to Available unless Retired."""
    result = await db.execute(select(MaintenanceLog).where(MaintenanceLog.id == log_id).with_for_update())
    log = result.scalars().first()
    
    if not log:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance log not found", code="NOT_FOUND")
        
    if not log.is_active:
        raise APIException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maintenance log is already closed.", code="ALREADY_CLOSED")
        
    # Lock the vehicle
    result_veh = await db.execute(select(Vehicle).where(Vehicle.id == log.vehicle_id).with_for_update())
    vehicle = result_veh.scalars().first()
    
    log.is_active = False
    log.closed_at = datetime.utcnow()
    
    if vehicle.status != "Retired":
        vehicle.status = "Available"
        
    db.add(log)
    db.add(vehicle)
    await db.commit()
    
    result = await db.execute(
        select(MaintenanceLog)
        .options(selectinload(MaintenanceLog.vehicle))
        .where(MaintenanceLog.id == log.id)
    )
    saved_log = result.scalars().first()
    
    return MaintenanceOut(
        id=saved_log.id,
        description=saved_log.description,
        cost=saved_log.cost,
        status="Open" if saved_log.is_active else "Closed",
        date=saved_log.opened_at,
        vehicle_id=saved_log.vehicle_id,
        vehicle_reg=saved_log.vehicle.registration_number if saved_log.vehicle else "N/A",
        vehicle_model=saved_log.vehicle.name_model if saved_log.vehicle else "Unknown"
    )
