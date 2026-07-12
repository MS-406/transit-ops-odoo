from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class VehicleBase(BaseModel):
    registration_number: str
    name_model: str
    type: str
    max_load_capacity: float
    odometer: float = 0.0
    acquisition_cost: float
    status: str = "Available"
    region: str

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    name_model: Optional[str] = None
    type: Optional[str] = None
    max_load_capacity: Optional[float] = None
    odometer: Optional[float] = None
    acquisition_cost: Optional[float] = None
    status: Optional[str] = None
    region: Optional[str] = None

class VehicleOut(VehicleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
