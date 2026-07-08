import sys
import os
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database.base_class import Base
from app.api.deps import get_db, RoleChecker
from app.models.user import User
from app.constants.enums import UserRole
from fastapi import HTTPException

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

class TestAuthentication(unittest.TestCase):
    def setUp(self):
        # Reset dependency overrides to prevent test isolation leaks
        app.dependency_overrides.clear()
        app.dependency_overrides[get_db] = override_get_db
        
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()
        
        # Seed test users
        self.active_user = User(
            email="active@test.com",
            firebase_uid="uid_active",
            name="Active User",
            role=UserRole.CITIZEN.value,
            is_active=True,
            is_deleted=False
        )
        self.inactive_user = User(
            email="inactive@test.com",
            firebase_uid="uid_inactive",
            name="Inactive User",
            role=UserRole.CITIZEN.value,
            is_active=False,
            is_deleted=False
        )
        self.deleted_user = User(
            email="deleted@test.com",
            firebase_uid="uid_deleted",
            name="Deleted User",
            role=UserRole.CITIZEN.value,
            is_active=True,
            is_deleted=True
        )
        self.db.add_all([self.active_user, self.inactive_user, self.deleted_user])
        self.db.commit()

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    def test_missing_authorization_header(self):
        # Request without header
        response = client.get("/api/v1/profile")
        self.assertEqual(response.status_code, 401)

    @patch("app.api.deps.auth_service.verify_firebase_token")
    def test_invalid_firebase_token(self, mock_verify):
        mock_verify.side_effect = ValueError("Invalid signature or format")
        response = client.get("/api/v1/profile", headers={"Authorization": "Bearer badtoken"})
        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid signature", response.json()["message"])

    @patch("app.api.deps.auth_service.verify_firebase_token")
    def test_expired_firebase_token(self, mock_verify):
        mock_verify.side_effect = ValueError("Firebase ID token has expired")
        response = client.get("/api/v1/profile", headers={"Authorization": "Bearer expiredtoken"})
        self.assertEqual(response.status_code, 401)
        self.assertIn("expired", response.json()["message"])

    @patch("app.api.deps.auth_service.verify_firebase_token")
    def test_inactive_user(self, mock_verify):
        mock_verify.return_value = {"uid": "uid_inactive"}
        response = client.get("/api/v1/profile", headers={"Authorization": "Bearer token"})
        self.assertEqual(response.status_code, 403)
        self.assertIn("deactivated", response.json()["message"])

    @patch("app.api.deps.auth_service.verify_firebase_token")
    def test_deleted_user(self, mock_verify):
        mock_verify.return_value = {"uid": "uid_deleted"}
        response = client.get("/api/v1/profile", headers={"Authorization": "Bearer token"})
        self.assertEqual(response.status_code, 401)
        self.assertIn("not registered", response.json()["message"])

    def test_wrong_role(self):
        checker = RoleChecker(allowed_role=UserRole.MUNICIPALITY_OFFICER.value)
        user = User(role=UserRole.CITIZEN.value)
        with self.assertRaises(HTTPException) as context:
            checker(current_user=user)
        self.assertEqual(context.exception.status_code, 403)
        self.assertIn("Operation restricted", context.exception.detail)

    @patch("app.api.deps.auth_service.verify_firebase_token")
    def test_idempotent_login(self, mock_verify):
        mock_verify.return_value = {
            "uid": "new_google_user_uid",
            "email": "new_google_user@test.com",
            "name": "Google User Original",
            "picture": "http://original.jpg"
        }
        
        # 1. First login (should create new user)
        response1 = client.post("/api/v1/auth/login", json={"idToken": "token_val"})
        self.assertEqual(response1.status_code, 200)
        self.assertTrue(response1.json()["success"])
        
        # Query count
        count1 = self.db.query(User).filter(User.email == "new_google_user@test.com").count()
        self.assertEqual(count1, 1)
        
        # 2. Second login with same account but updated name/picture (should update)
        mock_verify.return_value = {
            "uid": "new_google_user_uid",
            "email": "new_google_user@test.com",
            "name": "Google User Updated",
            "picture": "http://updated.jpg"
        }
        response2 = client.post("/api/v1/auth/login", json={"idToken": "token_val"})
        self.assertEqual(response2.status_code, 200)
        self.assertTrue(response2.json()["success"])
        
        # Assert count is still exactly 1
        count2 = self.db.query(User).filter(User.email == "new_google_user@test.com").count()
        self.assertEqual(count2, 1)
        
        # Fetch user and assert details updated
        updated_user = self.db.query(User).filter(User.email == "new_google_user@test.com").first()
        self.assertEqual(updated_user.name, "Google User Updated")
        self.assertEqual(updated_user.profile_picture, "http://updated.jpg")
