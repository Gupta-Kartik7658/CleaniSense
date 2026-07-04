# Import all models here so that Alembic can detect them automatically
from app.database.base_class import Base # noqa
from app.models.user import User # noqa
from app.models.user_preference import UserPreference # noqa
from app.models.complaint_category import ComplaintCategory # noqa
from app.models.municipality import Municipality # noqa
from app.models.complaint import Complaint # noqa
from app.models.complaint_status_history import ComplaintStatusHistory # noqa
from app.models.complaint_attachment import ComplaintAttachment # noqa
from app.models.resolution_report import ResolutionReport # noqa
from app.models.notification import Notification # noqa
from app.models.hotspot import Hotspot # noqa
