# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status,Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from typing import Annotated
from datetime import timedelta

from app.db.session import get_db          # <-- Use get_db (async generator)
from app.models.user import User
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.redis import get_redis
from redis.asyncio import Redis
from fastapi.responses import JSONResponse
router = APIRouter(prefix="/auth", tags=["auth"])

limiter = Limiter(key_func=get_remote_address, storage_uri="redis://localhost:6379/1")

# Override default handler
async def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    # 15 minutes = 900 seconds
    retry_after = 900

    # Custom response
    response = JSONResponse(
        status_code=429,
        content={
            "detail": "Too many login attempts. Please try again after 15 minutes.",
            "retry_after_minutes": 15
        },
        headers={"Retry-After": str(retry_after)}
    )
    return response

# Export for main.py
__all__ = ["router", "limiter", "custom_rate_limit_exceeded_handler"]


@router.post(
    "/login",
    summary="Obtain JWT access token",
    responses={
        200: {"description": "Token returned"},
        401: {"description": "Invalid credentials"},
    },
)
@limiter.limit("5/15minutes")
async def login(
    request: Request,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Redis = Depends(get_redis)   
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