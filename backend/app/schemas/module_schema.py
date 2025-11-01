# app/schemas/module_schema.py
from pydantic import BaseModel
from typing import Optional

class ModuleBase(BaseModel):
    name: str
    description: Optional[str] = None

class ModuleCreate(ModuleBase):
    pass

class ModuleOut(ModuleBase):
    id: int

    class Config:
        orm_mode = True
