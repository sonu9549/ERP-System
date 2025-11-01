# app/schemas/user_schema.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role_id: Optional[int] = None

class UserCreate(UserBase):
    password: str
    is_superadmin: Optional[bool] = False

class UserUpdate(BaseModel):
    username: Optional[str]
    email: Optional[EmailStr]
    role_id: Optional[int]
    is_active: Optional[bool]

class UserOut(UserBase):
    id: int
    is_active: bool
    is_superadmin: bool

    class Config:
        orm_mode = True
