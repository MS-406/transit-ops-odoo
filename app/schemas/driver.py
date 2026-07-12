from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field

class DriverTripOut(BaseModel):
    id: int
    source: str
    destination: str
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DriverBase(BaseModel):
    name: str
    license_number: str = "N/A"
    license_category: str = Field(alias="license_class")
    license_expiry_date: date = Field(alias="license_expiry")
    contact_number: str = "N/A"
    safety_score: float = 90.0
    status: str = "Available"
    
    model_config = ConfigDict(populate_by_name=True)

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = Field(None, alias="license_class")
    license_expiry_date: Optional[date] = Field(None, alias="license_expiry")
    contact_number: Optional[str] = None
    safety_score: Optional[float] = None
    status: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)

class DriverOut(DriverBase):
    id: int
    created_at: datetime
    updated_at: datetime
    trip_history: Optional[list[DriverTripOut]] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
