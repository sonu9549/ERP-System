# app/schemas/permission_schema.py
from pydantic import BaseModel
from typing import Optional

class PermissionBase(BaseModel):
    module_id: int
    role_id: int
    can_view: bool = False
    can_edit: bool = False
    can_approve: bool = False
    can_delete: bool = False

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    can_view: Optional[bool]
    can_edit: Optional[bool]
    can_approve: Optional[bool]
    can_delete: Optional[bool]

class PermissionOut(PermissionBase):
    id: int

    class Config:
        orm_mode = True

class PermissionsBulk(BaseModel):
    role_id: int
    permissions: list[PermissionCreate]
