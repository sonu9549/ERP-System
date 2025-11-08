from fastapi import APIRouter, Depends
from sqlmodel import select
from app.db.session import get_db
from app.models.user import User, UserCreate, UserUpdate
from app.core.security import get_current_active_superadmin, get_password_hash
from app.api.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
def list_users(db=Depends(get_db), user=Depends(get_current_active_superadmin)):
    return db.exec(select(User)).all()

@router.post("/")
def create_user(user_in: UserCreate, db=Depends(get_db), user=Depends(get_current_active_superadmin)):
    existing = db.exec(select(User).where(User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed = get_password_hash(user_in.password)
    new_user = User(**user_in.dict(exclude={"password"}), hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}")
def update_user(user_id: int, user_in: UserUpdate, db=Depends(get_db), user=Depends(get_current_active_superadmin)):
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = user_in.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db=Depends(get_db), user=Depends(get_current_active_superadmin)):
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(db_user)
    db.commit()
    return {"detail": "User deleted"}