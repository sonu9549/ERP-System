# app/db/init_db.py
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, Base, engine
from app.models.user_model import User
from app.models.role_model import Role
from app.utils.hashing import hash_password

def create_initial_superadmin():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # create a default role and superadmin if none exist
        r = db.query(Role).filter(Role.name == "SuperAdmin").first()
        if not r:
            r = Role(name="SuperAdmin", description="System Super Admin")
            db.add(r)
            db.commit()
            db.refresh(r)

        su = db.query(User).filter(User.username == "superadmin").first()
        if not su:
            su = User(
                username="superadmin",
                email="superadmin@example.com",
                password_hash=hash_password("ChangeMe123!"),
                is_superadmin=True,
                role_id=r.id
            )
            db.add(su)
            db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_superadmin()
