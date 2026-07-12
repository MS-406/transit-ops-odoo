from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.user import User
from app.schemas.trip import TripCreate, TripUpdate, TripOut, TripCompleteRequest
from app.core.deps import get_current_user, require_role
from app.core.exceptions import APIException

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.get("", response_model=List[TripOut])
async def list_trips(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "driver", "safety_officer"]))
):
    """List trips. Restricted to fleet_manager, driver, safety_officer."""
    query = (
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver), selectinload(Trip.creator))
        .offset(skip).limit(limit)
    )
    if status_filter:
        query = query.where(Trip.status == status_filter)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "driver", "safety_officer"]))
):
    """Get a specific trip by ID."""
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver), selectinload(Trip.creator))
        .where(Trip.id == trip_id)
    )
    trip = result.scalars().first()
    if not trip:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found", code="NOT_FOUND")
    return trip

@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
async def create_trip(
    payload: TripCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager"]))
):
    """Create a new trip in Draft status. Restricted to fleet managers."""
    # Validate vehicle
    result_veh = await db.execute(select(Vehicle).where(Vehicle.id == payload.vehicle_id))
    vehicle = result_veh.scalars().first()
    if not vehicle:
        raise APIException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle not found", code="INVALID_VEHICLE")
        
    if payload.cargo_weight > vehicle.max_load_capacity:
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Cargo weight {payload.cargo_weight} exceeds vehicle capacity {vehicle.max_load_capacity}", 
            code="OVERWEIGHT"
        )
        
    # Validate driver
    result_drv = await db.execute(select(Driver).where(Driver.id == payload.driver_id))
    driver = result_drv.scalars().first()
    if not driver:
        raise APIException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver not found", code="INVALID_DRIVER")
        
    trip = Trip(
        **payload.model_dump(),
        status="Draft",
        created_by=current_user.id
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    
    # Reload with relationships
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver), selectinload(Trip.creator))
        .where(Trip.id == trip.id)
    )
    return result.scalars().first()

@router.put("/{trip_id}", response_model=TripOut)
async def update_trip(
    trip_id: int,
    payload: TripUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager"]))
):
    """Update trip metadata."""
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalars().first()
    if not trip:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found", code="NOT_FOUND")
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(trip, key, value)
        
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver), selectinload(Trip.creator))
        .where(Trip.id == trip_id)
    )
    return result.scalars().first()

@router.patch("/{trip_id}/dispatch", response_model=TripOut)
async def dispatch_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager"]))
):
    """Dispatch a trip. Transitions Draft -> Dispatched."""
    # Lock the trip
    result = await db.execute(select(Trip).where(Trip.id == trip_id).with_for_update())
    trip = result.scalars().first()
    if not trip:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found", code="NOT_FOUND")
        
    if trip.status != "Draft":
        raise APIException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Draft trips can be dispatched.", code="INVALID_STATE")
        
    # Lock the vehicle
    result_veh = await db.execute(select(Vehicle).where(Vehicle.id == trip.vehicle_id).with_for_update())
    vehicle = result_veh.scalars().first()
    
    # Lock the driver
    result_drv = await db.execute(select(Driver).where(Driver.id == trip.driver_id).with_for_update())
    driver = result_drv.scalars().first()
        
    if vehicle.status != "Available":
        raise APIException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle is not available.", code="VEHICLE_UNAVAILABLE")
        
    if driver.status != "Available":
        raise APIException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver is not available.", code="DRIVER_UNAVAILABLE")
        
    if driver.license_expiry_date < date.today():
         raise APIException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail="Driver's license is expired.",
             code="EXPIRED_LICENSE"
         )
         
    trip.status = "Dispatched"
    trip.dispatched_at = datetime.utcnow()
    vehicle.status = "On Trip"
    driver.status = "On Trip"
    
    db.add(trip)
    db.add(vehicle)
    db.add(driver)
    await db.commit()
    
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver), selectinload(Trip.creator))
        .where(Trip.id == trip_id)
    )
    return result.scalars().first()

@router.patch("/{trip_id}/complete", response_model=TripOut)
async def complete_trip(
    trip_id: int,
    payload: TripCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "driver"]))
):
    """Complete a trip. Transitions Dispatched -> Completed."""
    # Lock the trip
    result = await db.execute(select(Trip).where(Trip.id == trip_id).with_for_update())
    trip = result.scalars().first()
    if not trip:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found", code="NOT_FOUND")
        
    if trip.status != "Dispatched":
        raise APIException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Dispatched trips can be completed.", code="INVALID_STATE")
        
    # Lock the vehicle and driver
    result_veh = await db.execute(select(Vehicle).where(Vehicle.id == trip.vehicle_id).with_for_update())
    vehicle = result_veh.scalars().first()
    
    result_drv = await db.execute(select(Driver).where(Driver.id == trip.driver_id).with_for_update())
    driver = result_drv.scalars().first()
        
    trip.status = "Completed"
    trip.completed_at = datetime.utcnow()
    trip.actual_distance = payload.actual_distance
    trip.fuel_consumed = payload.fuel_consumed
    trip.final_odometer = payload.final_odometer
    
    vehicle.status = "Available"
    driver.status = "Available"
    
    if payload.final_odometer is not None:
        vehicle.odometer = payload.final_odometer
        
    db.add(trip)
    db.add(vehicle)
    db.add(driver)
    await db.commit()
    
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver), selectinload(Trip.creator))
        .where(Trip.id == trip_id)
    )
    return result.scalars().first()

@router.patch("/{trip_id}/cancel", response_model=TripOut)
async def cancel_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager"]))
):
    """Cancel a trip. Transitions Draft/Dispatched -> Cancelled."""
    # Lock the trip
    result = await db.execute(select(Trip).where(Trip.id == trip_id).with_for_update())
    trip = result.scalars().first()
    if not trip:
        raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found", code="NOT_FOUND")
        
    if trip.status in ["Completed", "Cancelled"]:
        raise APIException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel a {trip.status} trip.", code="INVALID_STATE")
        
    was_dispatched = trip.status == "Dispatched"
    trip.status = "Cancelled"
    trip.cancelled_at = datetime.utcnow()
    
    db.add(trip)
    
    if was_dispatched:
        # Lock vehicle and driver to revert status
        result_veh = await db.execute(select(Vehicle).where(Vehicle.id == trip.vehicle_id).with_for_update())
        vehicle = result_veh.scalars().first()
        
        result_drv = await db.execute(select(Driver).where(Driver.id == trip.driver_id).with_for_update())
        driver = result_drv.scalars().first()
        
        vehicle.status = "Available"
        driver.status = "Available"
        db.add(vehicle)
        db.add(driver)
        
    await db.commit()
    
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.vehicle), selectinload(Trip.driver), selectinload(Trip.creator))
        .where(Trip.id == trip_id)
    )
    return result.scalars().first()
