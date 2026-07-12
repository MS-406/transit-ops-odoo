from typing import Optional
import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field, field_validator

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
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class SimpleFuelLog(BaseModel):
    liters: float
    cost: float
    date: datetime.date
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @field_validator("date", mode="before")
    @classmethod
    def parse_date(cls, v):
        if hasattr(v, 'date'):
            return v.date()
        return v

class SimpleMaintenanceLog(BaseModel):
    description: str
    cost: float
    date: datetime.date
    status: str
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @field_validator("date", mode="before")
    @classmethod
    def parse_date(cls, v):
        if hasattr(v, 'date'):
            return v.date()
        return v

class VehicleDetailOut(VehicleOut):
    fuel_efficiency: float
    fuel_logs: List[SimpleFuelLog] = []
    maintenance_records: List[SimpleMaintenanceLog] = []
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

