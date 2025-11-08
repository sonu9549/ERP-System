from fastapi import APIRouter, Depends
from sqlmodel import select
from app.models.user import User, UserCreate
from app.db.session import get_session
from app.services.rbac import enforce_access
from app.api.deps import get_current_user
from app.core.security import get_password_hash

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/users")
def list_users(db=Depends(get_session), user=Depends(get_current_user)):
    enforce_access(user.role, "/settings")
    return db.exec(select(User)).all()

@router.post("/users")
def create_user(user_in: UserCreate, db=Depends(get_session), user=Depends(get_current_user)):
    enforce_access(user.role, "/settings")
    existing = db.exec(select(User).where(User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed = get_password_hash(user_in.password)
    new_user = User(**user_in.dict(exclude={"password"}), hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user