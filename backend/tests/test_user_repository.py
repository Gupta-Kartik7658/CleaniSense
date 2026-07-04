import sys
import os
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.base_class import Base
from app.repositories.user import user_repository
from app.repositories.preference import preference_repository
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.profile import UserPreferenceUpdate
from app.constants.enums import UserRole

SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class TestUserRepository(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    def test_user_repository_crud(self):
        # 1. Create User
        user_in = UserCreate(
            email="repo_user@cleanisense.com",
            firebase_uid="repo_uid",
            name="Repo User",
            profile_picture="http://example.com/pic.jpg",
            role=UserRole.CITIZEN
        )
        user = user_repository.create(self.db, user_in)
        self.assertEqual(user.email, "repo_user@cleanisense.com")
        self.assertEqual(user.firebase_uid, "repo_uid")

        # 2. Get User
        fetched = user_repository.get_by_id(self.db, user.id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.id, user.id)

        fetched_uid = user_repository.get_by_firebase_uid(self.db, "repo_uid")
        self.assertIsNotNone(fetched_uid)
        self.assertEqual(fetched_uid.id, user.id)

        # 3. Update User
        update_in = UserUpdate(name="Updated Repo User")
        updated = user_repository.update(self.db, user, update_in)
        self.assertEqual(updated.name, "Updated Repo User")

        # 4. User Preference CRUD at repo layer
        prefs = preference_repository.get_by_user_id(self.db, user.id)
        self.assertIsNone(prefs)
        
        # Test creation of preference
        prefs = preference_repository.create_default(self.db, user.id)
        self.assertEqual(prefs.language, "en")
        
        # Test update preference
        pref_update = UserPreferenceUpdate(language="ta", theme="dark", notifications_enabled=False)
        updated_prefs = preference_repository.update(self.db, prefs, pref_update)
        self.assertEqual(updated_prefs.language, "ta")
        self.assertEqual(updated_prefs.theme, "dark")
        self.assertFalse(updated_prefs.notifications_enabled)
