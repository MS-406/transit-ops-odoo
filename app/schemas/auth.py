from pydantic import BaseModel, EmailStr, ConfigDict

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserOut

class TokenRefreshRequest(BaseModel):
    refresh_token: str
