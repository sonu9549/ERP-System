# app/schemas/role_schema.py
from pydantic import BaseModel
from typing import Optional, List
from app.schemas.permission import PermissionOut

class RoleCreate(BaseModel):
    pass

class ModuleOut(BaseModel):
    id: int
    name: str
    path: str
    icon: str | None = None

    class Config:
        from_attributes = True

class RoleOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    modules: list[ModuleOut] = []

    class Config:
        from_attributes = True
