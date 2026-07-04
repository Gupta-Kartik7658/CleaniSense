import sys
import os
import unittest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.base_class import Base
from app.repositories.complaint import complaint_repository
from app.models.complaint import Complaint
from app.models.complaint_category import ComplaintCategory
from app.models.municipality import Municipality
from app.models.user import User
from app.constants.enums import ComplaintStatus, UserRole

SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class TestComplaintRepository(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()
        
        # Seed test user, category, and municipality
        self.user = User(
            email="citizen_repo@test.com",
            firebase_uid="uid12345",
            name="Repo Citizen",
            role=UserRole.CITIZEN.value,
            is_active=True
        )
        self.category = ComplaintCategory(name="Waste Management", display_order=1)
        self.municipality = Municipality(name="AMC West Zone")
        self.db.add_all([self.user, self.category, self.municipality])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    def test_complaint_repository_crud(self):
        # 1. Create complaint
        complaint = Complaint(
            user_id=self.user.id,
            category_id=self.category.id,
            municipality_id=self.municipality.id,
            title="Sewer leakage",
            description="Massive sewerage overflowing on the road",
            location_name="Vastrapur main road",
            latitude=23.03,
            longitude=72.52,
            status=ComplaintStatus.SUBMITTED.value
        )
        self.db.add(complaint)
        self.db.commit()
        
        # 2. Get complaint by ID
        fetched = complaint_repository.get(self.db, complaint.id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.title, "Sewer leakage")
        self.assertEqual(fetched.status, ComplaintStatus.SUBMITTED.value)

        # 3. List active complaints for the user
        active_list = complaint_repository.list_by_user(self.db, self.user.id, page=1, page_size=10)
        self.assertEqual(len(active_list["items"]), 1)

        # 4. Status counts grouping
        counts = complaint_repository.count_by_status(self.db, self.user.id)
        self.assertEqual(counts[ComplaintStatus.SUBMITTED.value], 1)

        # 5. History lookup filtering and searching
        history_res = complaint_repository.list_history(
            db=self.db,
            user_id=self.user.id,
            status=ComplaintStatus.SUBMITTED.value,
            category_id=self.category.id,
            search="leakage",
            sort_by="created_at",
            sort_order="desc",
            page=1,
            page_size=10
        )
        self.assertEqual(len(history_res["items"]), 1)
        self.assertEqual(history_res["items"][0].id, complaint.id)
