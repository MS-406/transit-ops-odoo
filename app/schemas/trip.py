from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.vehicle import VehicleOut
from app.schemas.driver import DriverOut
from app.schemas.auth import UserOut

class TripBase(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    actual_distance: Optional[float] = None
    final_odometer: Optional[float] = None
    fuel_consumed: Optional[float] = None

class CreatorOut(BaseModel):
    id: int
    full_name: str
    
    model_config = ConfigDict(from_attributes=True)

class TripCompleteRequest(BaseModel):
    actual_distance: float
    fuel_consumed: float
    final_odometer: Optional[float] = None

class TripOut(TripBase):
    id: int
    actual_distance: Optional[float]
    final_odometer: Optional[float]
    fuel_consumed: Optional[float]
    status: str
    created_by: int
    dispatched_at: Optional[datetime]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    created_at: datetime
    
    vehicle: Optional[VehicleOut] = None
    driver: Optional[DriverOut] = None
    
    # Return basic user dict instead of full UserOut to avoid serialization issues
    creator: Optional[CreatorOut] = None

    model_config = ConfigDict(from_attributes=True)
