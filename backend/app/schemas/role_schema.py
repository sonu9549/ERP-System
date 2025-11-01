# app/schemas/role_schema.py
from pydantic import BaseModel
from typing import Optional, List
from app.schemas.permission_schema import PermissionOut

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleOut(RoleBase):
    id: int
    permissions: List[PermissionOut] = []

    class Config:
        orm_mode = True
