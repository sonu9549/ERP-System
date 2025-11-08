from app.db.session import get_db
from app.crud import user as user_crud, role as role_crud
from app.core.security import get_password_hash
from app.models.role import Role

def init_superadmin():
    db = next(get_db())
    if user_crud.get_by_username(db, "superadmin"):
        return

    # Create SuperAdmin Role
    super_role = role_crud.get_by_name(db, "superadmin")
    if not super_role:
        super_role = role_crud.create(db, RoleCreate(name="superadmin", description="Full Access"))

    # Create SuperAdmin User
    hashed = get_password_hash("admin123")
    user_crud.create(db, {
        "username": "superadmin",
        "email": "admin@erp.com",
        "hashed_password": hashed,
        "full_name": "Super Admin",
        "role_id": super_role.id,
        "is_superadmin": True
    })
    print("SuperAdmin created: superadmin / admin123")
