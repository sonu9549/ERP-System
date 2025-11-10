# app/main.py
from fastapi import FastAPI
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import auth, users, router as api_router
from app.db.session import create_db_and_tables, get_db, engine, drop_db_and_tables  
from app.models.user import User
from app.core.security import get_password_hash
from app.constants.roles import ROLES


# ----------------------------------------------------------------------
# 1. OAuth2 scheme
# ----------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

# ----------------------------------------------------------------------
# 2. FastAPI app
# ----------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")


# ----------------------------------------------------------------------
# 3. Startup: create tables + seed users
# ----------------------------------------------------------------------
@app.on_event("startup")
async def on_startup() -> None:
    await drop_db_and_tables()
    await create_db_and_tables()

    async for db in get_db():  # Fixed: get_db() with parentheses
        defaults = [
            {
                "name": "Super Admin",
                "email": "admin@nextgen.com",
                "password": "admin123",
                "role": ROLES.SUPER_ADMIN,
            },
            {
                "name": "Sales Manager",
                "email": "sales@nextgen.com",
                "password": "sales123",
                "role": ROLES.SALES_MANAGER,
            },
            {
                "name": "Regular User",
                "email": "user@nextgen.com",
                "password": "user123",
                "role": ROLES.USER,
            },
        ]

        for d in defaults:
            # Check if user already exists
            result = await db.execute(select(User).where(User.email == d["email"]))
            if result.scalars().first():
                continue  # Skip if exists

            # Create new user
            user = User(
                name=d["name"],
                email=d["email"],
                hashed_password=get_password_hash(d["password"]),
                role = d["role"],
                is_active=True,
                is_superadmin=(d["role"] == ROLES.SUPER_ADMIN),
            )
            db.add(user)

        await db.commit()
        break  # Only run once


# ----------------------------------------------------------------------
# 4. Shutdown: close connection pool
# ----------------------------------------------------------------------
@app.on_event("shutdown")
async def on_shutdown() -> None:
    await engine.dispose()  # Properly close all connections


# ----------------------------------------------------------------------
# 5. Include routers
# ----------------------------------------------------------------------
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])
app.include_router(api_router, prefix=settings.API_V1_STR, tags=["users"])


# ----------------------------------------------------------------------
# 6. Root endpoint
# ----------------------------------------------------------------------
@app.get("/", tags=["root"])
def root() -> dict:
    return {"message": "NextGen LEDGER API – Running!"}