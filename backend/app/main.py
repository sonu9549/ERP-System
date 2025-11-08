# app/main.py
from fastapi import FastAPI, Depends, Security
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select

from app.core.config import settings
from app.api.v1 import auth, users
from app.db.session import create_db_and_tables, get_session
from app.models.user import User
from app.core.security import get_password_hash
from app.constants.roles import ROLES

# ----------------------------------------------------------------------
# 1. OAuth2 scheme – **declare it at module level** (used by routers)
# ----------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

# ----------------------------------------------------------------------
# 2. FastAPI instance – docs URLs are exactly what you wanted
# ----------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ----------------------------------------------------------------------
# 4. Startup event – create tables + seed default users
# ----------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

    with next(get_session()) as db:
        defaults = [
            {"name": "Super Admin",   "email": "admin@nextgen.com", "password": "admin123", "role": ROLES.SUPER_ADMIN},
            {"name": "Sales Manager", "email": "sales@nextgen.com", "password": "sales123", "role": ROLES.SALES_MANAGER},
            {"name": "Regular User",  "email": "user@nextgen.com",   "password": "user123",   "role": ROLES.USER},
        ]

        for d in defaults:
            if not db.exec(select(User).where(User.email == d["email"])).first():
                user = User(
                    name=d["name"],
                    email=d["email"],
                    hashed_password=get_password_hash(d["password"]),
                    role=d["role"],
                )
                db.add(user)
        db.commit()


# ----------------------------------------------------------------------
# 5. Include routers (prefix already contains /api/v1)
# ----------------------------------------------------------------------
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["users"])

# Root endpoint

@app.get("/", tags=["root"])
def root():
    return {"message": "NextGen LEDGER API – Running!"}