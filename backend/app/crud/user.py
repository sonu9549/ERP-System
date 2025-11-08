# app/crud/user.py
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

# GET USER BY USERNAME
def get_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

# CREATE USER
def create(db: Session, obj_in: UserCreate):
    hashed_password = get_password_hash(obj_in.password)
    db_user = User(
        username=obj_in.username,
        email=obj_in.email,
        hashed_password=hashed_password,
        full_name=obj_in.full_name,
        role_id=obj_in.role_id,
        is_superadmin=obj_in.is_superadmin or False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# GET ALL USERS
def get_all(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def list_users(db:Session, skip: int = 0):
    pass
def update_user(db:Session, skip: int = 0):
    pass
def assign_role_to_user():
    pass