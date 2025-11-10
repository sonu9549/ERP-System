# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select  # <-- Add this
from app.db.session import get_db
from app.models.user import User
from app.core.config import settings

# ------------------------------------------------------------------
# OAuth2 scheme (with full path)
# ------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"  # <-- Use settings
)

# ------------------------------------------------------------------
# Password context
# ------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto",bcrypt__rounds=12,)

# JWT settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# ------------------------------------------------------------------
# === PASSWORD FUNCTIONS ===
# ------------------------------------------------------------------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# ------------------------------------------------------------------
# === JWT FUNCTIONS ===
# ------------------------------------------------------------------
def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ------------------------------------------------------------------
# === DEPENDENCY: Get current user from token ===
# ------------------------------------------------------------------
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_id_int = int(user_id)  # Safe conversion
    except (JWTError, ValueError):
        raise credentials_exception

    # --- Use SQLModel-compatible async query ---
    result = await db.execute(select(User).where(User.id == user_id_int))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

# ------------------------------------------------------------------
# === DEPENDENCY: Active user ===
# ------------------------------------------------------------------
async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# ------------------------------------------------------------------
# === DEPENDENCY: Superadmin only ===
# ------------------------------------------------------------------
async def get_current_active_superadmin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )
    return current_user