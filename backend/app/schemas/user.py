# app/schemas/user.py
from pydantic import BaseModel,EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role_id: int
    is_superadmin: bool = False

class UserOut(UserBase):
    id: int
    is_active: bool
    is_superadmin: bool
    role_id: int

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_superadmin: Optional[bool] = None

    class Config:
        from_attributes = True