from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, computed_field

class DriverBase(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str
    safety_score: float = 5.0
    status: str = "Available"

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[float] = None
    status: Optional[str] = None

class DriverOut(DriverBase):
    id: int
    created_at: datetime
    updated_at: datetime

    @computed_field
    def is_expired(self) -> bool:
        return self.license_expiry_date < date.today()

    model_config = ConfigDict(from_attributes=True)
