# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.constants.roles import ROLES  # If using Enum


# ------------------------------------------------------------------
# 1. Base schema (shared fields)
# ------------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None  # matches User.name
    # username removed – usually email is used as identifier


# ------------------------------------------------------------------
# 2. Create user (incoming data)
# ------------------------------------------------------------------
class UserCreate(UserBase):
    password: str
    role: ROLES  # Use your enum
    is_superadmin: bool = False

    class Config:
        from_attributes = True  # Pydantic v2


# ------------------------------------------------------------------
# 3. User response (outgoing data)
# ------------------------------------------------------------------
class UserOut(UserBase):
    id: int
    email: str
    name: Optional[str] = None
    role: ROLES          # <-- ADD THIS
    is_active: bool
    is_superadmin: bool

    class Config:
        from_attributes = True  # Required for SQLModel → Pydantic


# ------------------------------------------------------------------
# 4. Update user (partial PATCH)
# ------------------------------------------------------------------
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[ROLES] = None
    is_active: Optional[bool] = None
    is_superadmin: Optional[bool] = None
    password: Optional[str] = None  # For password change

    class Config:
        from_attributes = True