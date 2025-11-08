from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core import security
from app.crud import user as user_crud
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    try:
        payload = jwt.decode(token, security.settings.SECRET_KEY, algorithms=[security.settings.ALGORITHM])
        username: str = payload.get("sub")
        is_superadmin: bool = payload.get("is_superadmin", False)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = user_crud.get_by_username(db, username)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not active")
    user.is_superadmin = is_superadmin
    return user

async def get_current_superadmin(user = Depends(get_current_user)):
    if not user.is_superadmin:
        raise HTTPException(status_code=403, detail="SuperAdmin access required")
    return user