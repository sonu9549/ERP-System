# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db  # <-- Use get_db, NOT get_session
from app.api.deps import get_current_user ,get_current_superadmin # <-- Must be async
from app.models.user import User
from app.schemas.user import UserOut, UserCreate, UserUpdate
from typing import List
from sqlalchemy import select
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me",response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
        
@router.get("/", response_model=List[UserOut])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    result = await db.execute(select(User))
    return result.scalars().all()

@router.post("/", response_model=UserOut)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    hashed_password = pwd_context.hash(user_in.password)
    new_user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_password,
        role=user_in.role,
        is_superadmin=user_in.is_superadmin
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    # Update fields
    if user_in.name is not None:
        user.name = user_in.name
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.is_superadmin is not None:
        user.is_superadmin = user_in.is_superadmin

    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself!")

    await db.delete(user)
    await db.commit()
    return {"detail": "User deleted successfully"}    