from enum import Enum

class UserRole(str, Enum):
    CITIZEN = "citizen"
    MUNICIPALITY_OFFICER = "municipality_officer"
    MUNICIPALITY_ADMIN = "municipality_admin"
    SUPER_ADMIN = "super_admin"

class ComplaintStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    AI_VERIFICATION_IN_PROGRESS = "ai_verification_in_progress"
    AI_VALIDATION_COMPLETED = "ai_validation_completed"
    MUNICIPALITY_ACCEPTED = "municipality_accepted"
    OFFICER_ASSIGNED = "officer_assigned"
    IN_PROGRESS = "in_progress"
    INSPECTION_COMPLETED = "inspection_completed"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    ARCHIVED = "archived"
    NO_POLLUTION_DETECTED = "no_pollution_detected"

class ComplaintSeverity(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class NotificationType(str, Enum):
    SUBMITTED = "submitted"
    AI_VERIFIED = "ai_verified"
    ACCEPTED = "accepted"
    OFFICER_ASSIGNED = "officer_assigned"
    IN_PROGRESS = "in_progress"
    INSPECTION = "inspection"
    INFO_REQUESTED = "info_requested"
    RESOLVED = "resolved"
    REJECTED = "rejected"

class FileType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"

class UploadSource(str, Enum):
    CITIZEN = "citizen"
    MUNICIPALITY = "municipality"

class StorageProvider(str, Enum):
    SUPABASE = "supabase"
    FIREBASE = "firebase"
    LOCAL = "local"
    GCS = "gcs"

class HotspotSeverity(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class AuditAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    STATUS_CHANGE = "status_change"
    LOGIN = "login"
    LOGOUT = "logout"
