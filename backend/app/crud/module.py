# app/crud/module_crud.py
from sqlalchemy.orm import Session
from app.models.module import Module
from app.schemas.module import ModuleCreate

def create_module(db: Session, module_in: ModuleCreate) -> Module:
    db_mod = Module(name=module_in.name, description=module_in.description)
    db.add(db_mod)
    db.commit()
    db.refresh(db_mod)
    return db_mod

def get_module(db: Session, module_id: int):
    return db.query(Module).filter(Module.id == module_id).first()

def list_modules(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Module).offset(skip).limit(limit).all()
