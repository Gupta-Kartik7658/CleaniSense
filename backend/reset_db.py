from app.database.session import engine, SessionLocal
from app.database.base import Base
from app.database.seed import seed_db

def reset_database():
    print("Dropping all tables known to SQLAlchemy...")
    Base.metadata.drop_all(bind=engine)
    
    print("Re-creating all tables using Base.metadata.create_all...")
    Base.metadata.create_all(bind=engine)
    
    print("Seeding database with default categories and municipalities...")
    db = SessionLocal()
    try:
        seed_db(db)
        print("Database seed complete.")
    except Exception as e:
        print(f"Failed to seed: {e}")
    finally:
        db.close()
        
    print("Database reset complete.")

if __name__ == "__main__":
    reset_database()
