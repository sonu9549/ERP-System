from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from pydantic import BaseModel
from typing import Optional,List


role_modules = Table('role_modules', Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('module_id', Integer, ForeignKey('modules.id'), primary_key=True)
)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)

    modules = relationship("Module", secondary=role_modules, back_populates="roles")
    users = relationship("User", back_populates="role")

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass  # Only name and description

class RoleUpdate(RoleBase):
    name: Optional[str] = None
    description: Optional[str] = None

class RoleOut(RoleBase):
    id: int
    modules: List["ModuleOut"] = []  # Will be filled from relationship

    class Config:
        from_attributes = True
