# app/models/permission_model.py
from sqlalchemy import Column, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)

    can_view = Column(Boolean, default=False)
    can_edit = Column(Boolean, default=False)
    can_approve = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)

    role = relationship("Role", back_populates="permissions")
    module = relationship("Module", back_populates="permissions")
