import sys
import os
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.base_class import Base
from app.repositories.notification import notification_repository
from app.models.notification import Notification
from app.models.user import User
from app.constants.enums import UserRole

SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class TestNotificationRepository(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()
        
        self.user = User(
            email="notif_repo@test.com",
            firebase_uid="uid_notif_123",
            name="Repo Notification Citizen",
            role=UserRole.CITIZEN.value,
            is_active=True
        )
        self.db.add(self.user)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    def test_notification_repository_crud(self):
        # 1. Create notification
        notif = Notification(
            user_id=self.user.id,
            title="Test notification title",
            message="This is a test notification body text",
            type="submitted",
            is_read=False
        )
        self.db.add(notif)
        self.db.commit()
        
        # 2. Get unread count
        unread_count = notification_repository.count_unread(self.db, self.user.id)
        self.assertEqual(unread_count, 1)

        # 3. List notifications
        items = notification_repository.list_for_user(self.db, self.user.id, is_read=False, page=1, limit=10)
        self.assertEqual(len(items["items"]), 1)
        self.assertEqual(items["items"][0].title, "Test notification title")

        # 4. Mark all as read
        count_marked = notification_repository.mark_all_as_read(self.db, self.user.id)
        self.assertEqual(count_marked, 1)

        # 5. Verify unread count is now 0
        unread_count_after = notification_repository.count_unread(self.db, self.user.id)
        self.assertEqual(unread_count_after, 0)
