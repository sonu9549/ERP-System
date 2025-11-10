# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from typing import Annotated
from datetime import timedelta

from app.db.session import get_db          # <-- Use get_db (async generator)
from app.models.user import User
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    summary="Obtain JWT access token",
    responses={
        200: {"description": "Token returned"},
        401: {"description": "Invalid credentials"},
    },
)
async def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],   # <-- AsyncSession from get_db
):
    """
    OAuth2 password flow – username = email.
    """
    # --- Correct async query ---
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalars().first()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # --- Create JWT ---
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }