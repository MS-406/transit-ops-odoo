from pydantic import BaseModel, EmailStr, ConfigDict, Field

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    name: str
    role: str = Field(alias="role_name")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserOut

class TokenRefreshRequest(BaseModel):
    refresh_token: str
