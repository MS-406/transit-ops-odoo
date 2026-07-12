from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationOut(BaseModel):
    id: str
    type: str  # e.g., 'warning', 'critical'
    message: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
