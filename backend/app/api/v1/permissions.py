# app/api/v1/permissions.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.permission_schema import PermissionCreate, PermissionsBulk, PermissionOut
from app.crud.permission_crud import upsert_permissions_for_role, get_permissions_for_role
from app.crud.role_crud import get_role
from app.core.security import get_current_active_superadmin

router = APIRouter(prefix="/api/v1/permissions", tags=["permissions"], dependencies=[Depends(get_current_active_superadmin)])

@router.get("/role/{role_id}", response_model=list[PermissionOut])
def api_get_permissions_for_role(role_id: int, db: Session = Depends(get_db)):
    role = get_role(db, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return get_permissions_for_role(db, role_id)

@router.put("/role/{role_id}", response_model=list[PermissionOut])
def api_upsert_permissions(role_id: int, payload: PermissionsBulk, db: Session = Depends(get_db)):
    if payload.role_id != role_id:
        raise HTTPException(status_code=400, detail="role_id mismatch")
    role = get_role(db, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return upsert_permissions_for_role(db, role_id, payload.permissions)
