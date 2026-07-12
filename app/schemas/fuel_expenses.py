from typing import Optional
from datetime import date
from pydantic import BaseModel, ConfigDict, Field, field_validator

class FuelLogBase(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float = Field(..., gt=0, description="Liters must be greater than zero")
    cost: float = Field(..., ge=0, description="Cost cannot be negative")
    log_date: date

    @field_validator("log_date")
    def validate_date(cls, v):
        if v > date.today():
            raise ValueError("Log date cannot be in the future")
        return v

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogOut(FuelLogBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class ExpenseBase(BaseModel):
    vehicle_id: Optional[int] = None
    type: str = Field(..., description="Type of expense (e.g. toll, maintenance, other)")
    amount: float = Field(..., ge=0, description="Amount cannot be negative")
    description: str
    log_date: date

    @field_validator("log_date")
    def validate_date(cls, v):
        if v > date.today():
            raise ValueError("Log date cannot be in the future")
        return v

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseOut(ExpenseBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)
