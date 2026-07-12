from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.driver import Driver
from app.models.user import User
from app.schemas.reports import DashboardKPIsOut
from app.core.deps import require_role

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/kpis", response_model=DashboardKPIsOut)
async def get_kpis(
    vehicle_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst", "admin"]))
):
    """Get fleet KPIs with optional filtering."""
    
    # Vehicle queries
    veh_query = select(Vehicle)
    if vehicle_type:
        veh_query = veh_query.where(Vehicle.type == vehicle_type)
    if region:
        veh_query = veh_query.where(Vehicle.region == region)
        
    v_res = await db.execute(veh_query)
    vehicles = v_res.scalars().all()
    
    # Active vehicles (not retired)
    if status:
        active_vehicles = [v for v in vehicles if v.status != "Retired" and v.status == status]
    else:
        active_vehicles = [v for v in vehicles if v.status != "Retired"]
        
    num_active = len(active_vehicles)
    num_available = len([v for v in active_vehicles if v.status == "Available"])
    num_in_maintenance = len([v for v in active_vehicles if v.status == "In Shop"])
    num_on_trip = len([v for v in active_vehicles if v.status == "On Trip"])
    
    # Trip queries
    trip_query = select(Trip)
    # Could join to vehicles to filter by region/type if strictly necessary, but simple for now
    t_res = await db.execute(trip_query)
    trips = t_res.scalars().all()
    
    num_active_trips = len([t for t in trips if t.status == "Dispatched"])
    num_pending_trips = len([t for t in trips if t.status == "Draft"])
    
    # Driver queries
    drv_query = select(Driver)
    d_res = await db.execute(drv_query)
    drivers = d_res.scalars().all()
    
    num_drivers_on_duty = len([d for d in drivers if d.status == "On Trip"])
    
    utilization_pct = (num_on_trip / num_active * 100) if num_active > 0 else 0.0
    
    return DashboardKPIsOut(
        totalVehicles=len(vehicles),
        activeVehicles=num_active,
        availableVehicles=num_available,
        inMaintenance=num_in_maintenance,
        retiredVehicles=len([v for v in vehicles if v.status == "Retired"]),
        activeTrips=num_active_trips,
        pendingTrips=num_pending_trips,
        driversOnDuty=num_drivers_on_duty,
        utilizationRate=utilization_pct
    )
