from pydantic import BaseModel, EmailStr, ConfigDict, Field

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    name: str
    role: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserOut

from typing import Optional

class TokenRefreshRequest(BaseModel):
    refresh_token: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role_name: str
