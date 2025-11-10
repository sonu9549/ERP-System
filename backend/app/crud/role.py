# app/crud/role.py
from sqlalchemy.orm import Session
from app.models.role import Role
from app.schemas.role import RoleCreate

def create_role(db: Session, role_in: RoleCreate) -> Role:
    db_role = Role(name=role_in.name, description=role_in.description)
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def get_role(db: Session, role_id: int):
    return db.query(Role).filter(Role.id == role_id).first()

def list_roles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Role).offset(skip).limit(limit).all()
