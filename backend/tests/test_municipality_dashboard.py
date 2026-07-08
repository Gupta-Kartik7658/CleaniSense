import sys
import os
import unittest
import uuid
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database.base_class import Base
from app.api.deps import get_db
from app.models.user import User
from app.models.municipality import Municipality
from app.models.complaint_category import ComplaintCategory
from app.models.complaint import Complaint
from app.models.resolution_report import ResolutionReport
from app.constants.enums import UserRole, ComplaintStatus

# Configure test database
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

class TestMunicipalityDashboard(unittest.TestCase):
    def setUp(self):
        # Reset overrides and configure DB
        app.dependency_overrides.clear()
        app.dependency_overrides[get_db] = override_get_db
        
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()
        
        # 1. Seed Municipalities
        self.mun_a = Municipality(
            id=uuid.uuid4(),
            name="AMC West Zone",
            district="Ahmedabad",
            state="Gujarat",
            is_active=True
        )
        self.mun_b = Municipality(
            id=uuid.uuid4(),
            name="AMC East Zone",
            district="Ahmedabad",
            state="Gujarat",
            is_active=True
        )
        self.db.add_all([self.mun_a, self.mun_b])
        self.db.commit()
        
        # 2. Seed Category
        self.cat = ComplaintCategory(
            id=uuid.uuid4(),
            name="Waste Management",
            display_order=1,
            is_active=True
        )
        self.db.add(self.cat)
        self.db.commit()
        
        # 3. Seed Users
        self.citizen = User(
            id=uuid.uuid4(),
            email="citizen@test.com",
            firebase_uid="uid_citizen",
            name="Citizen User",
            role=UserRole.CITIZEN.value,
            is_active=True
        )
        self.officer_a = User(
            id=uuid.uuid4(),
            email="officer_a@test.com",
            firebase_uid="uid_officer_a",
            name="Officer A",
            role=UserRole.MUNICIPALITY_OFFICER.value,
            municipality_id=self.mun_a.id,
            is_active=True
        )
        self.officer_b = User(
            id=uuid.uuid4(),
            email="officer_b@test.com",
            firebase_uid="uid_officer_b",
            name="Officer B",
            role=UserRole.MUNICIPALITY_OFFICER.value,
            municipality_id=self.mun_b.id,
            is_active=True
        )
        self.db.add_all([self.citizen, self.officer_a, self.officer_b])
        self.db.commit()
        
        # 4. Seed Complaints
        self.comp_a = Complaint(
            id=uuid.uuid4(),
            user_id=self.citizen.id,
            category_id=self.cat.id,
            municipality_id=self.mun_a.id,
            title="Garbage pile in Zone A",
            description="Large garbage pile accumulated since three days near gate.",
            status=ComplaintStatus.AI_VALIDATION_COMPLETED.value,
            location_name="Zone A Street",
            latitude=23.028,
            longitude=72.505,
            is_deleted=False
        )
        self.comp_b = Complaint(
            id=uuid.uuid4(),
            user_id=self.citizen.id,
            category_id=self.cat.id,
            municipality_id=self.mun_b.id,
            title="Sewer overflow in Zone B",
            description="Dirty wastewater spilling into surrounding walkway.",
            status=ComplaintStatus.AI_VALIDATION_COMPLETED.value,
            location_name="Zone B Lane",
            latitude=23.038,
            longitude=72.528,
            is_deleted=False
        )
        self.db.add_all([self.comp_a, self.comp_b])
        self.db.commit()

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    @patch("app.api.deps.auth_service.verify_firebase_token")
    def test_lightweight_municipal_dashboard(self, mock_verify):
        # Mock login as Officer A
        mock_verify.return_value = {"uid": "uid_officer_a", "email": "officer_a@test.com"}
        
        response = client.get(
            "/api/v1/dashboard",
            headers={"Authorization": "Bearer token"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        
        # Assert lightweight schema returned (no map clustering or distributions nested here)
        self.assertEqual(data["overview"]["total_reports"], 1)
        self.assertEqual(data["overview"]["pending_reports"], 1)
        self.assertEqual(data["overview"]["active_reports"], 0)
        self.assertEqual(len(data["recent_complaints"]), 1)
        self.assertNotIn("complaint_map", data)
        self.assertNotIn("status_distribution", data)

    @patch("app.api.deps.auth_service.verify_firebase_token")
    def test_municipal_analytics_chart_ready_arrays(self, mock_verify):
        # Mock login as Officer A
        mock_verify.return_value = {"uid": "uid_officer_a", "email": "officer_a@test.com"}
        
        response = client.get(
            "/api/v1/analytics",
            headers={"Authorization": "Bearer token"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        
        # Verify status distribution returned as a list of dictionaries with label/count keys
        self.assertIn("status_distribution", data)
        self.assertIsInstance(data["status_distribution"], list)
        self.assertEqual(data["status_distribution"][0]["label"], ComplaintStatus.AI_VALIDATION_COMPLETED.value)
        self.assertEqual(data["status_distribution"][0]["count"], 1)

    @patch("app.api.deps.auth_service.verify_firebase_token")
    def test_cross_municipality_access_denied(self, mock_verify):
        # Mock login as Officer A
        mock_verify.return_value = {"uid": "uid_officer_a", "email": "officer_a@test.com"}
        
        # Accessing detail of external municipality complaint must block
        response = client.get(
            f"/api/v1/complaints/{self.comp_b.id}",
            headers={"Authorization": "Bearer token"}
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("other municipalities", response.json()["message"])

    @patch("app.api.deps.auth_service.verify_firebase_token")
    def test_municipal_officer_lifecycle_put_workflow(self, mock_verify):
        # Mock login as Officer A
        mock_verify.return_value = {"uid": "uid_officer_a", "email": "officer_a@test.com"}
        headers = {"Authorization": "Bearer token"}
        
        # 1. Accept complaint via PUT
        res_accept = client.put(
            f"/api/v1/complaints/{self.comp_a.id}",
            json={"status": ComplaintStatus.MUNICIPALITY_ACCEPTED.value, "remarks": "Accepted"},
            headers=headers
        )
        self.assertEqual(res_accept.status_code, 200)
        self.assertEqual(res_accept.json()["data"]["status"], ComplaintStatus.MUNICIPALITY_ACCEPTED.value)
        
        # 2. Assign complaint via PUT
        res_assign = client.put(
            f"/api/v1/complaints/{self.comp_a.id}",
            json={
                "status": ComplaintStatus.OFFICER_ASSIGNED.value,
                "assigned_department": "Sanitation Dept",
                "assigned_officer": "Ramesh Lal",
                "remarks": "Assigned Ramesh"
            },
            headers=headers
        )
        self.assertEqual(res_assign.status_code, 200)
        self.assertEqual(res_assign.json()["data"]["status"], ComplaintStatus.OFFICER_ASSIGNED.value)
        self.assertEqual(res_assign.json()["data"]["assigned_officer"], "Ramesh Lal")
        
        # 3. Try to update citizen fields as municipal staff -> should be blocked!
        res_blocked = client.put(
            f"/api/v1/complaints/{self.comp_a.id}",
            json={"title": "Malicious Title Edit"},
            headers=headers
        )
        self.assertEqual(res_blocked.status_code, 403)
        self.assertIn("not permitted to modify citizen", res_blocked.json()["message"])

        # 4. Start work via PUT
        res_start = client.put(
            f"/api/v1/complaints/{self.comp_a.id}",
            json={"status": ComplaintStatus.IN_PROGRESS.value, "remarks": "Started"},
            headers=headers
        )
        self.assertEqual(res_start.status_code, 200)
        self.assertEqual(res_start.json()["data"]["status"], ComplaintStatus.IN_PROGRESS.value)

        # 5. Complete inspection via PUT
        res_complete = client.put(
            f"/api/v1/complaints/{self.comp_a.id}",
            json={"status": ComplaintStatus.INSPECTION_COMPLETED.value, "remarks": "Completed"},
            headers=headers
        )
        self.assertEqual(res_complete.status_code, 200)

        # 6. Resolve complaint via PUT
        res_resolve = client.put(
            f"/api/v1/complaints/{self.comp_a.id}",
            json={
                "status": ComplaintStatus.RESOLVED.value,
                "resolution": {
                    "summary": "Garbage pile cleared.",
                    "department": "Sanitation Dept",
                    "officer_name": "Ramesh Lal",
                    "actions": "Cleaned area",
                    "before_image_url": "http://before.jpg",
                    "after_image_url": "http://after.jpg"
                },
                "remarks": "Resolved"
            },
            headers=headers
        )
        self.assertEqual(res_resolve.status_code, 200)
        self.assertEqual(res_resolve.json()["data"]["status"], ComplaintStatus.RESOLVED.value)

if __name__ == "__main__":
    unittest.main()
