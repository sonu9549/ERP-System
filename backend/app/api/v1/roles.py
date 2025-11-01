# app/api/v1/roles.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.crud.role_crud import create_role, list_roles, get_role
from app.schemas.role_schema import RoleCreate, RoleOut
from app.core.security import get_current_active_superadmin

router = APIRouter(prefix="/api/v1/roles", tags=["roles"], dependencies=[Depends(get_current_active_superadmin)])

@router.post("/", response_model=RoleOut)
def api_create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    return create_role(db, payload)

@router.get("/", response_model=list[RoleOut])
def api_list_roles(db: Session = Depends(get_db)):
    return list_roles(db)
