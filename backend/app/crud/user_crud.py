# app/crud/user_crud.py
from sqlalchemy.orm import Session
from typing import Optional
from app.models.user_model import User
from app.schemas.user_schema import UserCreate, UserUpdate
from app.utils.hashing import hash_password

def create_user(db: Session, user_in: UserCreate) -> User:
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role_id=user_in.role_id,
        is_superadmin=user_in.is_superadmin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def list_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def update_user(db: Session, user: User, user_in: UserUpdate):
    if user_in.username is not None:
        user.username = user_in.username
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.role_id is not None:
        user.role_id = user_in.role_id
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def assign_role_to_user(db: Session, user_id: int, role_id: int):
    u = get_user(db, user_id)
    if not u:
        return None
    u.role_id = role_id
    db.add(u)
    db.commit()
    db.refresh(u)
    return u
