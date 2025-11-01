# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user_schema import UserCreate, UserOut, UserUpdate
from app.crud.user_crud import create_user, list_users, get_user, update_user, assign_role_to_user
from app.core.security import get_current_active_superadmin

router = APIRouter(prefix="/api/v1/users", tags=["users"])

@router.post("/", response_model=UserOut, dependencies=[Depends(get_current_active_superadmin)])
def api_create_user(payload: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, payload)

@router.get("/", response_model=list[UserOut], dependencies=[Depends(get_current_active_superadmin)])
def api_list_users(db: Session = Depends(get_db)):
    return list_users(db)

@router.patch("/{user_id}", response_model=UserOut, dependencies=[Depends(get_current_active_superadmin)])
def api_update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return update_user(db, u, payload)

@router.patch("/{user_id}/assign-role", response_model=UserOut, dependencies=[Depends(get_current_active_superadmin)])
def api_assign_role(user_id: int, payload: dict, db: Session = Depends(get_db)):
    role_id = payload.get("role_id")
    if role_id is None:
        raise HTTPException(status_code=400, detail="role_id required")
    u = assign_role_to_user(db, user_id, role_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u
