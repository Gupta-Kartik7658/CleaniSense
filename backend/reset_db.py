from app.database.session import engine
from app.database.base import Base
from sqlalchemy import text

def reset_database():
    print("Dropping all tables known to SQLAlchemy...")
    Base.metadata.drop_all(bind=engine)
    


    print("Re-creating all tables using Base.metadata.create_all...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")

if __name__ == "__main__":
    reset_database()
