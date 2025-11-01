# app/api/v1/modules.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.crud.module_crud import create_module, list_modules, get_module
from app.schemas.module_schema import ModuleCreate, ModuleOut
from app.core.security import get_current_active_superadmin

router = APIRouter(prefix="/api/v1/modules", tags=["modules"], dependencies=[Depends(get_current_active_superadmin)])

@router.post("/", response_model=ModuleOut)
def api_create_module(payload: ModuleCreate, db: Session = Depends(get_db)):
    return create_module(db, payload)

@router.get("/", response_model=list[ModuleOut])
def api_list_modules(db: Session = Depends(get_db)):
    return list_modules(db)
