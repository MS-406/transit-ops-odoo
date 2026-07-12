from typing import Optional
import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

class FuelLogBase(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float = Field(..., gt=0, description="Liters must be greater than zero")
    cost: float = Field(..., ge=0, description="Cost cannot be negative")
    log_date: datetime.date

    @field_validator("log_date")
    def validate_date(cls, v):
        if v > datetime.date.today():
            raise ValueError("Log date cannot be in the future")
        return v

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogOut(BaseModel):
    id: int
    vehicle_id: int
    vehicle_reg: str
    vehicle_model: str
    liters: float
    cost: float
    date: datetime.date
    
    model_config = ConfigDict(from_attributes=True)

class ExpenseBase(BaseModel):
    vehicle_id: Optional[int] = None
    category: str = Field(alias="type", description="Type of expense (e.g. toll, maintenance, other)")
    cost: float = Field(alias="amount", ge=0, description="Amount cannot be negative")
    description: str
    date: datetime.date = Field(alias="log_date")

    @field_validator("date", mode="before")
    def validate_date(cls, v):
        if isinstance(v, datetime.date) and v > datetime.date.today():
            raise ValueError("Log date cannot be in the future")
        return v

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseOut(BaseModel):
    id: int
    date: datetime.date
    category: str
    cost: float
    vehicle_id: Optional[int]
    vehicle_reg: str
    description: str
    
    model_config = ConfigDict(from_attributes=True)
