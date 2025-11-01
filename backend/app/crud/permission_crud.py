# app/crud/permission_crud.py
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
import app.models.permission_model as perm_mod
import app.schemas.permission_schema as perm_schema
from app.crud.module_crud import get_module

def get_permissions_for_role(db: Session, role_id: int) -> List[perm_mod.Permission]:
    return db.query(perm_mod.Permission).filter(perm_mod.Permission.role_id == role_id).all()

def get_permission_by_role_module(db: Session, role_id: int, module_id: int):
    return db.query(perm_mod.Permission).filter(
        and_(perm_mod.Permission.role_id == role_id, perm_mod.Permission.module_id == module_id)
    ).first()

def upsert_permissions_for_role(db: Session, role_id: int, perms: List[perm_schema.PermissionCreate]):
    upserted = []
    for p in perms:
        module = get_module(db, p.module_id)
        if not module:
            # skip modules that do not exist
            continue

        existing = get_permission_by_role_module(db, role_id, p.module_id)
        if existing:
            existing.can_view = p.can_view
            existing.can_edit = p.can_edit
            existing.can_approve = p.can_approve
            existing.can_delete = p.can_delete
            db.add(existing)
            db.commit()
            db.refresh(existing)
            upserted.append(existing)
        else:
            new_perm = perm_mod.Permission(
                role_id=role_id,
                module_id=p.module_id,
                can_view=p.can_view,
                can_edit=p.can_edit,
                can_approve=p.can_approve,
                can_delete=p.can_delete
            )
            db.add(new_perm)
            db.commit()
            db.refresh(new_perm)
            upserted.append(new_perm)
    return upserted
