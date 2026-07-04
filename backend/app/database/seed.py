import uuid
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.complaint_category import ComplaintCategory
from app.models.municipality import Municipality

CATEGORIES_SEED = [
    {
        "id": uuid.UUID("3c4d7e82-e304-4537-8853-2947a5be23c1"),
        "name": "Waste Management",
        "icon": "trash",
        "color": "#E53E3E",
        "display_order": 1,
    },
    {
        "id": uuid.UUID("8a73b2c1-d419-4822-a9b4-b570e309cc12"),
        "name": "Air Pollution",
        "icon": "wind",
        "color": "#DD6B20",
        "display_order": 2,
    },
    {
        "id": uuid.UUID("f9d0c8b2-30cf-46d2-a72c-886c5f7e1b9a"),
        "name": "Air Quality Control",
        "icon": "cloud",
        "color": "#D69E2E",
        "display_order": 3,
    },
    {
        "id": uuid.UUID("507e6b8c-2f9a-47c3-bb2b-10f7a63b92d0"),
        "name": "Wastewater / Sewerage",
        "icon": "droplet",
        "color": "#3182CE",
        "display_order": 4,
    },
    {
        "id": uuid.UUID("c53e8d2a-4b9b-449e-ba78-654e92fa1b0a"),
        "name": "Noise Pollution",
        "icon": "volume-2",
        "color": "#805AD5",
        "display_order": 5,
    },
    {
        "id": uuid.UUID("74b29c5a-d1e9-4e08-bc23-a1cbfde094ab"),
        "name": "Water Contamination",
        "icon": "alert-triangle",
        "color": "#E53E3E",
        "display_order": 6,
    },
    {
        "id": uuid.UUID("9d3b8c5f-3a2c-47ea-bc91-6240dbe9a35e"),
        "name": "Other",
        "icon": "help-circle",
        "color": "#718096",
        "display_order": 7,
    },
]

MUNICIPALITIES_SEED = [
    {
        "id": uuid.UUID("e3f01c89-21a4-44cf-b2f5-d91834cf872d"),
        "name": "Ahmedabad Municipal Corporation (AMC)",
        "district": "Ahmedabad",
        "state": "Gujarat",
        "contact_email": "support@ahmedabadcity.gov.in",
    },
    {
        "id": uuid.UUID("a7e1c8b9-50fc-4309-9dbb-827d04bc0d9a"),
        "name": "AMC West Zone",
        "district": "Ahmedabad",
        "state": "Gujarat",
        "contact_email": "westzone@ahmedabadcity.gov.in",
    },
    {
        "id": uuid.UUID("bf830a7d-e9c5-4ad9-be21-d00bf49ab28d"),
        "name": "GIDC Ward Office, Naroda",
        "district": "Ahmedabad",
        "state": "Gujarat",
        "contact_email": "narodagidc@ahmedabadcity.gov.in",
    },
    {
        "id": uuid.UUID("cd8e4c3a-dfb9-4a92-97b6-1c88d8bfa2e1"),
        "name": "AMC Sewerage Board",
        "district": "Ahmedabad",
        "state": "Gujarat",
        "contact_email": "sewerage@ahmedabadcity.gov.in",
    },
]

def seed_db(db: Session = None):
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True
    
    try:
        # Seed categories
        for cat in CATEGORIES_SEED:
            existing = db.query(ComplaintCategory).filter(ComplaintCategory.name == cat["name"]).first()
            if not existing:
                db.add(ComplaintCategory(**cat))
                print(f"Seeding category: {cat['name']}")
        
        # Seed municipalities
        for mun in MUNICIPALITIES_SEED:
            existing = db.query(Municipality).filter(Municipality.name == mun["name"]).first()
            if not existing:
                db.add(Municipality(**mun))
                print(f"Seeding municipality: {mun['name']}")
                
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Seeding error: {e}")
        raise e
    finally:
        if own_session:
            db.close()

if __name__ == "__main__":
    seed_db()
