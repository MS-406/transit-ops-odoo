from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.vehicle import VehicleOut

class MaintenanceBase(BaseModel):
    vehicle_id: int
    description: str
    cost: float

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceUpdate(BaseModel):
    description: Optional[str] = None
    cost: Optional[float] = None

class MaintenanceOut(MaintenanceBase):
    id: int
    is_active: bool
    opened_at: datetime
    closed_at: Optional[datetime] = None
    
    vehicle: Optional[VehicleOut] = None

    model_config = ConfigDict(from_attributes=True)
