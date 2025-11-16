from sqlmodel import SQLModel, Field,Column
from typing import Optional
import sqlalchemy as sa
from app.constants.roles import ROLES

role_enum = sa.Enum(ROLES, name="roles")

class UserBase(SQLModel):
    name: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    role: int = Field(default=99)  # ROLES.USER

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: Optional[str] = None
    hashed_password: str
    role: ROLES = Field(sa_column=Column(role_enum, nullable=False))
    is_active: bool = Field(default=True, nullable=False)
    is_superadmin: bool = Field(default=False, nullable=False)

class UserCreate(UserBase):
    password: str

class UserUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[int] = None
    password: Optional[str] = None