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

class MaintenanceOut(BaseModel):
    id: int
    description: str
    cost: float
    status: str
    date: datetime
    vehicle_id: int
    vehicle_reg: str
    vehicle_model: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
