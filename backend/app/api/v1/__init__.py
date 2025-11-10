# app/api/v1/__init__.py
from fastapi import APIRouter
from .users import router as users_router

router = APIRouter()
router.include_router(users_router)