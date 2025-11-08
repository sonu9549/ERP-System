from fastapi import HTTPException, status
from app.config.module_access import MODULE_ACCESS
from app.constants.roles import ROLES

def enforce_access(user_role: int, path: str):
    if user_role == ROLES.SUPER_ADMIN:
        return
    allowed = MODULE_ACCESS.get(path, [])
    if user_role not in allowed:
        raise HTTPException(status_code=403, detail="Access denied")