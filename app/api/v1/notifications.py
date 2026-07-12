from typing import List
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.core.deps import require_role

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/alerts", response_model=List[NotificationOut])
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "safety_officer"]))
):
    """Dynamically poll for system alerts (expiring drivers, delayed trips)."""
    
    alerts = []
    now = datetime.utcnow()
    today = date.today()
    thirty_days_from_now = today + timedelta(days=30)
    twenty_four_hours_ago = now - timedelta(hours=24)
    
    # 1. Check expiring drivers
    drv_query = select(Driver).where(Driver.license_expiry_date <= thirty_days_from_now)
    d_res = await db.execute(drv_query)
    expiring_drivers = d_res.scalars().all()
    
    for driver in expiring_drivers:
        days_left = (driver.license_expiry_date - today).days
        status_type = "critical" if days_left <= 7 else "warning"
        msg = f"Driver '{driver.name}' ({driver.license_number}) license expires in {days_left} days."
        
        alerts.append(NotificationOut(
            id=f"driver-exp-{driver.id}",
            type=status_type,
            message=msg,
            created_at=now
        ))
        
    # 2. Check delayed trips
    trip_query = select(Trip).where(Trip.status == "Dispatched").where(Trip.dispatched_at <= twenty_four_hours_ago)
    t_res = await db.execute(trip_query)
    delayed_trips = t_res.scalars().all()
    
    for trip in delayed_trips:
        hours_delayed = int((now - trip.dispatched_at).total_seconds() / 3600)
        alerts.append(NotificationOut(
            id=f"trip-delay-{trip.id}",
            type="critical",
            message=f"Trip #{trip.id} from {trip.source} to {trip.destination} has been dispatched for {hours_delayed} hours.",
            created_at=now
        ))
        
    return alerts
