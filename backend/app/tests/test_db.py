from app.db.base import engine
with engine.connect() as conn:
    result = conn.execute("SELECT 1")
    print("Connected!", result.fetchone())