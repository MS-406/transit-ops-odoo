from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AuditLogCreate(BaseModel):
    action: str
    details: str

class AuditLogOut(BaseModel):
    id: int
    action: str
    details: str
    user: str
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)
