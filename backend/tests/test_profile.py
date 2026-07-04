import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.base_class import Base
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.complaint_category import ComplaintCategory
from app.models.municipality import Municipality
from app.models.complaint import Complaint
from app.models.notification import Notification
from app.constants.enums import UserRole
from app.database.seed import seed_db
import uuid
from fastapi import HTTPException

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate all tables
Base.metadata.create_all(bind=engine)

# Seed database with master data
db_seed = TestingSessionLocal()
seed_db(db_seed)
db_seed.close()

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Seed a test user
db = TestingSessionLocal()
test_user = User(
    email="test@cleanisense.com",
    firebase_uid="test_uid",
    name="Test Citizen",
    profile_picture="http://example.com/profile.jpg",
    role=UserRole.CITIZEN.value,
    is_active=True
)
db.add(test_user)
db.commit()
db.refresh(test_user)
db.close()

def override_get_current_user(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == "test@cleanisense.com").first()
    return user

def setup_overrides():
    app.dependency_overrides.clear()
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

class TestProfile(unittest.TestCase):
    def setUp(self):
        setup_overrides()

    def test_get_profile(self):
        response = client.get("/api/v1/profile")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["email"], "test@cleanisense.com")
        self.assertEqual(data["data"]["preferences"]["language"], "en")
        self.assertEqual(data["data"]["preferences"]["theme"], "system")

    def test_update_profile(self):
        response = client.put("/api/v1/profile", json={"name": "New Name", "profile_picture": "http://newpic.com"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["data"]["name"], "New Name")
        self.assertEqual(data["data"]["profile_picture"], "http://newpic.com")

    def test_get_preferences(self):
        response = client.get("/api/v1/profile/preferences")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["data"]["language"], "en")

    def test_update_preferences(self):
        response = client.put("/api/v1/profile/preferences", json={"language": "hi", "theme": "dark", "notifications_enabled": False})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["data"]["language"], "hi")
        self.assertEqual(data["data"]["theme"], "dark")
        self.assertFalse(data["data"]["notifications_enabled"])

        # Invalid language validation test
        response = client.put("/api/v1/profile/preferences", json={"language": "invalid"})
        self.assertEqual(response.status_code, 422)

    def test_dashboard_config(self):
        response = client.get("/api/v1/config")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["app_version"], "1.0.0")
        
        # Verify categories are returned and display order is respected
        categories = data["data"]["categories"]
        self.assertTrue(len(categories) > 0)
        self.assertEqual(categories[0]["name"], "Waste Management")
        self.assertEqual(categories[-1]["name"], "Other")

class TestComplaints(unittest.TestCase):
    def setUp(self):
        setup_overrides()
        self.db = TestingSessionLocal()
        self.category = self.db.query(ComplaintCategory).first()
        self.municipality = self.db.query(Municipality).first()
        self.db.close()

    def test_create_complaint(self):
        # Successful complaint creation
        response = client.post("/api/v1/complaints", json={
            "title": "Illegal Waste Dump",
            "description": "Large heap of construction debris dumped on the sidewalk near Satellite Road.",
            "category_id": str(self.category.id),
            "location_name": "Satellite Road, Ahmedabad",
            "latitude": 23.0305,
            "longitude": 72.5074,
            "municipality_id": str(self.municipality.id)
        })
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["title"], "Illegal Waste Dump")
        self.assertEqual(data["data"]["status"], "submitted")

        # Validation failure: description too short
        response = client.post("/api/v1/complaints", json={
            "title": "Illegal Dump",
            "description": "Short desc",
            "category_id": str(self.category.id),
            "location_name": "Location",
            "latitude": 23.0305,
            "longitude": 72.5074
        })
        self.assertEqual(response.status_code, 422)

    def test_complaints_crud_flow(self):
        # 1. Create a complaint
        res_create = client.post("/api/v1/complaints", json={
            "title": "Sewerage Water Leakage",
            "description": "Wastewater flowing onto the main road for the last 2 days, causing foul smell.",
            "category_id": str(self.category.id),
            "location_name": "Vastrapur, Ahmedabad",
            "latitude": 23.035,
            "longitude": 72.520
        })
        complaint_id = res_create.json()["data"]["id"]

        # 2. Get details
        res_get = client.get(f"/api/v1/complaints/{complaint_id}")
        self.assertEqual(res_get.status_code, 200)
        data = res_get.json()
        self.assertEqual(data["data"]["title"], "Sewerage Water Leakage")
        self.assertEqual(data["data"]["category"]["name"], self.category.name)
        self.assertEqual(len(data["data"]["timeline"]), 1)
        self.assertEqual(data["data"]["timeline"][0]["status"], "submitted")

        # 3. List active complaints
        res_list = client.get("/api/v1/complaints")
        self.assertEqual(res_list.status_code, 200)
        list_data = res_list.json()
        self.assertTrue(any(c["id"] == complaint_id for c in list_data["data"]["items"]))
        self.assertEqual(list_data["data"]["page"], 1)
        self.assertEqual(list_data["data"]["has_next"], False)

        # 4. History filter search
        res_hist = client.get(f"/api/v1/complaints?search=Sewerage")
        self.assertEqual(res_hist.status_code, 200)
        hist_data = res_hist.json()
        self.assertTrue(len(hist_data["data"]["items"]) > 0)
        self.assertEqual(hist_data["data"]["items"][0]["id"], complaint_id)

        # 5. Update complaint details
        res_update = client.put(f"/api/v1/complaints/{complaint_id}", json={
            "title": "Updated Sewerage Water Leakage Title"
        })
        self.assertEqual(res_update.status_code, 200)
        self.assertEqual(res_update.json()["data"]["title"], "Updated Sewerage Water Leakage Title")

        # 6. Soft delete
        res_del = client.delete(f"/api/v1/complaints/{complaint_id}")
        self.assertEqual(res_del.status_code, 200)
        self.assertTrue(res_del.json()["success"])

        # 7. Assert it is no longer retrievable by GET
        res_get_deleted = client.get(f"/api/v1/complaints/{complaint_id}")
        self.assertEqual(res_get_deleted.status_code, 404)

    def test_state_machine_validation(self):
        # Create a complaint
        res_create = client.post("/api/v1/complaints", json={
            "title": "Air Quality Concern",
            "description": "Thick black smoke emitting from the factory chimney nearby.",
            "category_id": str(self.category.id),
            "location_name": "Naroda GIDC",
            "latitude": 23.07,
            "longitude": 72.65
        })
        complaint_id = res_create.json()["data"]["id"]

        # Try invalid transition: submitted -> Resolved directly
        from app.services.complaint_service import complaint_service
        
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@cleanisense.com").first()
        
        with self.assertRaises(HTTPException) as context:
            complaint_service.transition_status(db, uuid.UUID(complaint_id), "resolved", "direct resolve", user.id)
        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("Invalid status transition", context.exception.detail)

        # Valid transition: submitted -> ai_validation_completed
        complaint_service.transition_status(db, uuid.UUID(complaint_id), "ai_validation_completed", "AI check pass", user.id)
        c_obj = db.query(Complaint).filter(Complaint.id == uuid.UUID(complaint_id)).first()
        self.assertEqual(c_obj.status, "ai_validation_completed")
        self.assertEqual(len(c_obj.timeline), 2)
        self.assertEqual(c_obj.timeline[1].status, "ai_validation_completed")
        self.assertEqual(c_obj.timeline[1].remarks, "AI check pass")
        
        db.close()

    def test_attachment_upload(self):
        # 1. Create a complaint
        res_create = client.post("/api/v1/complaints", json={
            "title": "Noise Complaint",
            "description": "Loud music playing from the neighbor's property after midnight.",
            "category_id": str(self.category.id),
            "location_name": "Drive In Road, Ahmedabad",
            "latitude": 23.045,
            "longitude": 72.530
        })
        complaint_id = res_create.json()["data"]["id"]

        # 2. Upload valid image attachment
        import io
        file_data = b"fake image bytes content"
        file_obj = io.BytesIO(file_data)
        response = client.post(
            f"/api/v1/complaints/{complaint_id}/attachments",
            files={"file": ("test_pic.jpg", file_obj, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["file_name"], "test_pic.jpg")
        self.assertEqual(data["data"]["file_type"], "image")
        self.assertEqual(data["data"]["storage_provider"], "local")

        # 3. Get complaint details to assert attachments list includes this item
        res_detail = client.get(f"/api/v1/complaints/{complaint_id}")
        self.assertEqual(len(res_detail.json()["data"]["attachments"]), 1)
        self.assertEqual(res_detail.json()["data"]["attachments"][0]["file_name"], "test_pic.jpg")

        # 4. Try uploading invalid file type (e.g. text/html)
        file_obj_invalid = io.BytesIO(b"<html>some HTML</html>")
        response_invalid = client.post(
            f"/api/v1/complaints/{complaint_id}/attachments",
            files={"file": ("page.html", file_obj_invalid, "text/html")}
        )
        self.assertEqual(response_invalid.status_code, 400)
        self.assertIn("not supported", response_invalid.json()["message"])

        # 5. Try uploading file exceeding 10MB limit
        large_content = b"x" * (10 * 1024 * 1024 + 1)
        file_obj_large = io.BytesIO(large_content)
        response_large = client.post(
            f"/api/v1/complaints/{complaint_id}/attachments",
            files={"file": ("large.jpg", file_obj_large, "image/jpeg")}
        )
        self.assertEqual(response_large.status_code, 400)
        self.assertIn("exceeds maximum allowed limit", response_large.json()["message"])

        # 6. Upload 4 more attachments to hit the max limit of 5
        for i in range(4):
            file_loop = io.BytesIO(b"fake loop image")
            client.post(
                f"/api/v1/complaints/{complaint_id}/attachments",
                files={"file": (f"pic_{i}.png", file_loop, "image/png")}
            )

        # Confirm there are 5 attachments
        res_detail_full = client.get(f"/api/v1/complaints/{complaint_id}")
        self.assertEqual(len(res_detail_full.json()["data"]["attachments"]), 5)

        # Try to upload 6th attachment (should fail with 400)
        file_six = io.BytesIO(b"sixth image bytes")
        response_six = client.post(
            f"/api/v1/complaints/{complaint_id}/attachments",
            files={"file": ("six.png", file_six, "image/png")}
        )
        self.assertEqual(response_six.status_code, 400)
        self.assertIn("cannot have more than 5 attachments", response_six.json()["message"])

    def test_complaint_resolution(self):
        # 1. Create a complaint
        res_create = client.post("/api/v1/complaints", json={
            "title": "Water Leakage resolution test",
            "description": "Foul smell due to a massive puddle of standing water outside the shop.",
            "category_id": str(self.category.id),
            "location_name": "Maninagar, Ahmedabad",
            "latitude": 23.00,
            "longitude": 72.60
        })
        complaint_id = res_create.json()["data"]["id"]

        # 2. Assert getting resolution report returns 404 since it's not resolved yet
        res_res_404 = client.get(f"/api/v1/complaints/{complaint_id}/resolution")
        self.assertEqual(res_res_404.status_code, 404)

        # 3. Transition to resolved step-by-step
        from app.services.complaint_service import complaint_service
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@cleanisense.com").first()
        
        c_id = uuid.UUID(complaint_id)
        complaint_service.transition_status(db, c_id, "ai_validation_completed", "AI checked", user.id)
        complaint_service.transition_status(db, c_id, "municipality_accepted", "Accepted", user.id)
        complaint_service.transition_status(db, c_id, "officer_assigned", "Officer assigned", user.id)
        complaint_service.transition_status(db, c_id, "in_progress", "Started resolving", user.id)
        complaint_service.transition_status(db, c_id, "inspection_completed", "Inspection completed", user.id)
        
        # Transition to resolved without resolution details (should fail)
        with self.assertRaises(HTTPException) as context:
            complaint_service.transition_status(db, c_id, "resolved", "Resolved it", user.id, resolution_data=None)
        self.assertEqual(context.exception.status_code, 400)

        # Transition to resolved with resolution details
        res_details = {
            "summary": "Repaired water pipe leak",
            "department": "AMC Water Board",
            "officer_name": "Rakesh Patel",
            "actions": "Replaced the cracked joint on the water main line.",
            "before_image_url": "http://example.com/before.jpg",
            "after_image_url": "http://example.com/after.jpg"
        }
        complaint_service.transition_status(db, c_id, "resolved", "Resolved with pipe repair", user.id, resolution_data=res_details)
        db.close()

        # 4. Assert GET /resolution returns the resolution report details correctly
        res_res_success = client.get(f"/api/v1/complaints/{complaint_id}/resolution")
        self.assertEqual(res_res_success.status_code, 200)
        data = res_res_success.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["summary"], "Repaired water pipe leak")
        self.assertEqual(data["data"]["officer_name"], "Rakesh Patel")
        self.assertEqual(data["data"]["actions"], "Replaced the cracked joint on the water main line.")
        self.assertEqual(data["data"]["before_image_url"], "http://example.com/before.jpg")
        self.assertEqual(data["data"]["after_image_url"], "http://example.com/after.jpg")

        # 5. Verify the detail endpoint now eager-loads resolution report
        res_detail = client.get(f"/api/v1/complaints/{complaint_id}")
        self.assertEqual(res_detail.json()["data"]["resolution"]["summary"], "Repaired water pipe leak")

class TestNotifications(unittest.TestCase):
    def setUp(self):
        setup_overrides()
        self.db = TestingSessionLocal()
        self.category = self.db.query(ComplaintCategory).first()
        self.db.close()

    def test_notification_flow(self):
        # 1. Initially, notification count should be retrieved successfully
        res_count = client.get("/api/v1/notifications/unread-count")
        self.assertEqual(res_count.status_code, 200)
        initial_count = res_count.json()["data"]["count"]

        # 2. Create a complaint to trigger a notification
        res_create = client.post("/api/v1/complaints", json={
            "title": "Notification test complaint",
            "description": "This is a test complaint to verify that notifications are correctly dispatched on creation.",
            "category_id": str(self.category.id),
            "location_name": "Testing area",
            "latitude": 23.0,
            "longitude": 72.0
        })
        self.assertEqual(res_create.status_code, 201)
        complaint_id = res_create.json()["data"]["id"]

        # 3. Verify unread count has incremented by 1
        res_count_new = client.get("/api/v1/notifications/unread-count")
        self.assertEqual(res_count_new.json()["data"]["count"], initial_count + 1)

        # 4. List notifications
        res_list = client.get("/api/v1/notifications?is_read=false")
        self.assertEqual(res_list.status_code, 200)
        notifications = res_list.json()["data"]["items"]
        self.assertTrue(len(notifications) > 0)
        
        # Verify fields
        latest_notification = notifications[0]
        self.assertEqual(latest_notification["complaint_id"], complaint_id)
        self.assertIn("submitted successfully", latest_notification["title"])
        self.assertFalse(latest_notification["is_read"])

        # 5. Mark single notification as read
        notif_id = latest_notification["id"]
        res_read = client.put(f"/api/v1/notifications/{notif_id}/read")
        self.assertEqual(res_read.status_code, 200)
        self.assertTrue(res_read.json()["data"]["is_read"])

        # Verify count decreased
        res_count_after = client.get("/api/v1/notifications/unread-count")
        self.assertEqual(res_count_after.json()["data"]["count"], initial_count)

        # 6. Test mark all as read
        # Trigger another notification first
        client.post("/api/v1/complaints", json={
            "title": "Another notification test",
            "description": "This is another test complaint to verify bulk marking as read.",
            "category_id": str(self.category.id),
            "location_name": "Testing area",
            "latitude": 23.0,
            "longitude": 72.0
        })
        
        res_count_bulk = client.get("/api/v1/notifications/unread-count")
        self.assertEqual(res_count_bulk.json()["data"]["count"], initial_count + 1)

        # Mark all as read
        res_bulk_read = client.put("/api/v1/notifications/read-all")
        self.assertEqual(res_bulk_read.status_code, 200)
        self.assertGreaterEqual(res_bulk_read.json()["data"]["count_marked"], 1)

        # Verify unread count is back to 0
        res_count_final = client.get("/api/v1/notifications/unread-count")
        self.assertEqual(res_count_final.json()["data"]["count"], 0)

class TestHotspots(unittest.TestCase):
    def setUp(self):
        setup_overrides()
        self.db = TestingSessionLocal()
        from app.models.hotspot import Hotspot
        
        # Clear existing hotspots to ensure isolation
        self.db.query(Hotspot).delete()
        
        self.db.add(Hotspot(
            id=uuid.UUID("11111111-2222-3333-4444-555555555555"),
            title="Industrial Smoke Emissions Area (Naroda GIDC)",
            latitude=23.075,
            longitude=72.645,
            geo_point="POINT(72.645 23.075)",
            severity="high",
            reports_count=28,
            is_active=True
        ))
        self.db.add(Hotspot(
            id=uuid.UUID("22222222-3333-4444-5555-666666666666"),
            title="Frequent Wastewater Discharge Spot (Satellite Road)",
            latitude=23.028,
            longitude=72.505,
            geo_point="POINT(72.505 23.028)",
            severity="medium",
            reports_count=14,
            is_active=True
        ))
        self.db.add(Hotspot(
            id=uuid.UUID("33333333-4444-5555-6666-777777777777"),
            title="Illegal Dumping Zone (Vastrapur Lake Outer Circle)",
            latitude=23.038,
            longitude=72.528,
            geo_point="POINT(72.528 23.038)",
            severity="high",
            reports_count=42,
            is_active=True
        ))
        self.db.commit()
        self.db.close()

    def test_list_hotspots(self):
        # 1. Get all active hotspots
        response = client.get("/api/v1/hotspots")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]), 3)

        # 2. Filter by proximity: Center around Satellite Road (23.028, 72.505) with 1km radius
        response_prox = client.get("/api/v1/hotspots?latitude=23.028&longitude=72.505&radius_km=1.0")
        self.assertEqual(response_prox.status_code, 200)
        data_prox = response_prox.json()
        self.assertEqual(len(data_prox["data"]), 1)
        self.assertEqual(data_prox["data"][0]["title"], "Frequent Wastewater Discharge Spot (Satellite Road)")

        # 3. Filter by severity: high
        response_sev = client.get("/api/v1/hotspots?severity=high")
        self.assertEqual(response_sev.status_code, 200)
        data_sev = response_sev.json()
        self.assertEqual(len(data_sev["data"]), 2)

    def test_get_hotspot_detail(self):
        # Get list first to get an ID
        res_list = client.get("/api/v1/hotspots")
        hotspot_id = res_list.json()["data"][0]["id"]

        # Fetch detail
        response = client.get(f"/api/v1/hotspots/{hotspot_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["id"], hotspot_id)

        # Non-existent ID returns 404
        bad_id = uuid.uuid4()
        response_404 = client.get(f"/api/v1/hotspots/{bad_id}")
        self.assertEqual(response_404.status_code, 404)

class TestDashboard(unittest.TestCase):
    def setUp(self):
        setup_overrides()
        self.db = TestingSessionLocal()
        self.category = self.db.query(ComplaintCategory).first()
        self.db.close()

    def test_dashboard_aggregation(self):
        # 0. Clean database to verify empty/fresh database state
        from app.models.complaint import Complaint
        from app.models.hotspot import Hotspot
        from app.models.notification import Notification
        self.db = TestingSessionLocal()
        self.db.query(Complaint).delete()
        self.db.query(Hotspot).delete()
        self.db.query(Notification).delete()
        self.db.commit()

        # Verify empty dashboard state first
        res_empty = client.get("/api/v1/dashboard")
        self.assertEqual(res_empty.status_code, 200)
        empty_data = res_empty.json()
        self.assertTrue(empty_data["success"])
        
        overview_empty = empty_data["data"]["overview"]
        self.assertEqual(overview_empty["total_reports"], 0)
        self.assertEqual(overview_empty["active_reports"], 0)
        self.assertEqual(overview_empty["resolved_reports"], 0)
        self.assertEqual(overview_empty["nearby_hotspots"], 0)
        self.assertEqual(len(empty_data["data"]["nearby_hotspots"]), 0)
        self.assertEqual(empty_data["data"]["unread_notifications"], 0)
        self.db.close()

        # 1. Create a complaint
        res_create = client.post("/api/v1/complaints", json={
            "title": "Dashboard test complaint",
            "description": "This is a test complaint to verify dashboard stats are aggregated.",
            "category_id": str(self.category.id),
            "location_name": "Dashboard area",
            "latitude": 23.0,
            "longitude": 72.0
        })
        self.assertEqual(res_create.status_code, 201)

        # 2. Get dashboard overview (now aggregates 1 complaint)
        response = client.get("/api/v1/dashboard")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        
        overview = data["data"]["overview"]
        self.assertEqual(overview["total_reports"], 1)
        self.assertEqual(overview["active_reports"], 1)
        self.assertEqual(overview["resolved_reports"], 0)
        self.assertEqual(overview["nearby_hotspots"], 0)
        
        # Verify preferences and notifications
        self.assertEqual(data["data"]["preferences"]["language"], "en")
        self.assertTrue("unread_notifications" in data["data"])

class TestMiddleware(unittest.TestCase):
    def setUp(self):
        setup_overrides()

    def test_request_id_in_response_headers(self):
        # Every request should have X-Request-ID in response header
        response = client.get("/api/v1/config")
        self.assertEqual(response.status_code, 200)
        self.assertTrue("X-Request-ID" in response.headers)

    def test_validation_error_envelope(self):
        # Sending invalid payload should trigger custom exception handler formatting
        response = client.post("/api/v1/complaints", json={
            "title": "Shrt" # description missing, title too short, coordinates missing
        })
        self.assertEqual(response.status_code, 422)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")
        self.assertTrue(len(data["error"]["details"]) > 0)
        
        # Verify fields mapped
        fields = [err["field"] for err in data["error"]["details"]]
        self.assertIn("description", fields)
        self.assertIn("title", fields)

if __name__ == "__main__":
    unittest.main()
