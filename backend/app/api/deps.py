from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import select
from app.db.session import get_db
from app.models.user import User
from app.core.config import settings
from app.constants.roles import ROLES
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.redis import get_redis  
from redis.asyncio import Redis
import json

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)  # NEW: Inject Redis
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Cache Key
    cache_key = f"user:{user_id}"

    # Try Redis first
    cached = await redis.get(cache_key)
    if cached:
        user_data = json.loads(cached)
        return User(**user_data)  # Convert dict to User model

    # Correct async query
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    
    # Cache user data for 30 minutes
    user_dict = user.dict()
    await redis.setex(cache_key, 1800, json.dumps(user_dict))
    return user

async def get_current_superadmin(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != ROLES.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required"
        )
    return current_user