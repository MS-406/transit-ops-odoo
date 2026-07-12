from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class VehicleBase(BaseModel):
    registration_number: str
    name_model: str = Field(alias="model")
    type: str
    max_load_capacity: float = Field(alias="capacity")
    odometer: float = 0.0
    acquisition_cost: float = 0.0
    status: str = "Available"
    region: str
    
    model_config = ConfigDict(populate_by_name=True)

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    name_model: Optional[str] = Field(None, alias="model")
    type: Optional[str] = None
    max_load_capacity: Optional[float] = Field(None, alias="capacity")
    odometer: Optional[float] = None
    acquisition_cost: Optional[float] = None
    status: Optional[str] = None
    region: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)

class VehicleOut(VehicleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
