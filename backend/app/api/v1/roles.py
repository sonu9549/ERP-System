from fastapi import APIRouter, Depends
from app.schemas.role import RoleCreate, RoleOut
from app.crud import role as role_crud
from app.db.session import get_db
from app.dependencies.auth import get_current_superadmin

router = APIRouter(prefix="/roles", tags=["roles"])

@router.post("/", response_model=RoleOut)
def create_role(
    role_in: RoleCreate,
    db = Depends(get_db),
    _: dict = Depends(get_current_superadmin)
):
    return role_crud.create(db, obj_in=role_in)
