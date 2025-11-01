# app/main.py
from fastapi import FastAPI
from app.db.session import Base, engine
from app.api.v1 import auth, users, roles, modules, permissions

# create tables (for dev; prefer alembic in prod)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NexGen ERP")

# include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(modules.router)
app.include_router(permissions.router)

@app.get("/")
def root():
    return {"message": "NexGen ERP Backend"}

