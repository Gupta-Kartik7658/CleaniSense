import uuid
import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict
from math import radians, cos, sin, asin, sqrt
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from app.core.config import settings
from app.constants.enums import ComplaintStatus, UserRole
from app.models.complaint import Complaint
from app.models.hotspot import Hotspot
from app.models.notification import Notification
from app.models.user import User

def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees).
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371.0 # Earth radius in kilometers
    return c * r

class HotspotService:
    def list_hotspots(
        self,
        db: Session,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: float = 5.0,
        severity: Optional[str] = None
    ) -> List[Hotspot]:
        """
        List active hotspots, optionally filtered by proximity radius (km) and severity.
        """
        query = db.query(Hotspot).filter(Hotspot.is_active == True)
        if severity:
            query = query.filter(Hotspot.severity == severity)
            
        hotspots = query.all()
        
        if latitude is not None and longitude is not None:
            filtered = []
            for h in hotspots:
                dist = haversine(longitude, latitude, h.longitude, h.latitude)
                if dist <= radius_km:
                    filtered.append(h)
            return filtered
            
        return hotspots

    def get_hotspot(self, db: Session, id: uuid.UUID) -> Optional[Hotspot]:
        """
        Retrieve a single active hotspot.
        """
        return db.query(Hotspot).filter(Hotspot.id == id, Hotspot.is_active == True).first()

    def refresh_hotspots(
        self,
        db: Session,
        municipality_id: Optional[uuid.UUID] = None,
        radius_meters: Optional[float] = None,
        min_complaints: Optional[int] = None,
    ) -> List[Hotspot]:
        radius_meters = float(radius_meters or settings.HOTSPOT_RADIUS_METERS)
        min_complaints = int(min_complaints or settings.HOTSPOT_MIN_COMPLAINTS)

        complaints = self._eligible_complaints(db, municipality_id)
        clusters = self._cluster_complaints(
            complaints=complaints,
            radius_meters=radius_meters,
            min_complaints=min_complaints,
        )
        active_ids = set()
        hotspots: List[Hotspot] = []

        for cluster in clusters:
            hotspot_id = self._stable_hotspot_id(cluster["complaint_ids"])
            active_ids.add(hotspot_id)
            hotspot = db.query(Hotspot).filter(Hotspot.id == hotspot_id).first()
            if not hotspot:
                hotspot = Hotspot(id=hotspot_id, title="")

            hotspot.title = self._title(cluster)
            hotspot.latitude = cluster["latitude"]
            hotspot.longitude = cluster["longitude"]
            hotspot.geo_point = f"POINT({cluster['longitude']} {cluster['latitude']})"
            hotspot.severity = self._severity_label(cluster["severity_score"])
            hotspot.severity_score = cluster["severity_score"]
            hotspot.radius_meters = radius_meters
            hotspot.reports_count = cluster["reports_count"]
            hotspot.complaint_ids = json.dumps([str(item) for item in cluster["complaint_ids"]])
            hotspot.dominant_category = cluster["dominant_category"]
            hotspot.trend = cluster["trend"]
            hotspot.is_active = True
            db.add(hotspot)
            hotspots.append(hotspot)

        stale_query = db.query(Hotspot).filter(Hotspot.is_active == True)
        if active_ids:
            stale_query = stale_query.filter(~Hotspot.id.in_(active_ids))
        if municipality_id:
            municipality_complaint_ids = {complaint.id for complaint in complaints}
            stale_hotspots = stale_query.all()
            for hotspot in stale_hotspots:
                try:
                    linked_ids = {uuid.UUID(value) for value in json.loads(hotspot.complaint_ids or "[]")}
                except (ValueError, TypeError, json.JSONDecodeError):
                    linked_ids = set()
                if linked_ids and not linked_ids.intersection(municipality_complaint_ids):
                    continue
                hotspot.is_active = False
                db.add(hotspot)
        else:
            for hotspot in stale_query.all():
                hotspot.is_active = False
                db.add(hotspot)

        db.commit()
        for hotspot in hotspots:
            db.refresh(hotspot)
        self._notify_critical_hotspots(db, hotspots)
        return hotspots

    def refresh_for_complaint(self, db: Session, complaint: Complaint) -> List[Hotspot]:
        return self.refresh_hotspots(db, municipality_id=complaint.municipality_id)

    def _eligible_complaints(
        self,
        db: Session,
        municipality_id: Optional[uuid.UUID],
    ) -> List[Complaint]:
        query = db.query(Complaint).filter(
            Complaint.is_deleted == False,
            Complaint.latitude.isnot(None),
            Complaint.longitude.isnot(None),
            or_(Complaint.severity_score >= 20.0, Complaint.severity_score == None),
            Complaint.status.notin_([
                ComplaintStatus.REJECTED.value,
                ComplaintStatus.ARCHIVED.value,
                ComplaintStatus.RESOLVED.value,
                ComplaintStatus.NO_POLLUTION_DETECTED.value,
            ]),
        )
        if municipality_id:
            query = query.filter(Complaint.municipality_id == municipality_id)
        return query.all()

    def _cluster_complaints(
        self,
        complaints: List[Complaint],
        radius_meters: float,
        min_complaints: int,
    ) -> List[Dict]:
        clusters: List[List[Complaint]] = []
        visited: set[uuid.UUID] = set()
        assigned: set[uuid.UUID] = set()

        for complaint in complaints:
            if complaint.id in visited:
                continue
            visited.add(complaint.id)
            neighbors = self._neighbors(complaint, complaints, radius_meters)
            if len(neighbors) < min_complaints:
                continue

            cluster: List[Complaint] = []
            queue = list(neighbors)
            while queue:
                current = queue.pop(0)
                if current.id not in visited:
                    visited.add(current.id)
                    current_neighbors = self._neighbors(current, complaints, radius_meters)
                    if len(current_neighbors) >= min_complaints:
                        for neighbor in current_neighbors:
                            if neighbor.id not in {item.id for item in queue}:
                                queue.append(neighbor)
                if current.id not in assigned:
                    assigned.add(current.id)
                    cluster.append(current)

            if len(cluster) >= min_complaints:
                clusters.append(cluster)

        return [self._cluster_summary(cluster) for cluster in clusters]

    def _neighbors(
        self,
        complaint: Complaint,
        complaints: List[Complaint],
        radius_meters: float,
    ) -> List[Complaint]:
        radius_km = radius_meters / 1000.0
        return [
            candidate
            for candidate in complaints
            if haversine(
                complaint.longitude,
                complaint.latitude,
                candidate.longitude,
                candidate.latitude,
            ) <= radius_km
        ]

    def _cluster_summary(self, complaints: List[Complaint]) -> Dict:
        avg_lat = sum(complaint.latitude for complaint in complaints) / len(complaints)
        avg_lon = sum(complaint.longitude for complaint in complaints) / len(complaints)
        severity_values = [
            float(complaint.severity_score)
            for complaint in complaints
            if complaint.severity_score is not None
        ]
        severity_score = round(
            sum(severity_values) / len(severity_values)
            if severity_values
            else min(100.0, len(complaints) * 25.0),
            2,
        )
        categories = [
            complaint.category.name
            for complaint in complaints
            if complaint.category and complaint.category.name
        ]
        dominant_category = Counter(categories).most_common(1)[0][0] if categories else "Environmental"
        recent_cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        recent_count = sum(
            1
            for complaint in complaints
            if self._as_aware(complaint.created_at) >= recent_cutoff
        )
        older_count = len(complaints) - recent_count
        trend = "increasing" if recent_count > older_count else "stable"

        return {
            "latitude": avg_lat,
            "longitude": avg_lon,
            "severity_score": severity_score,
            "reports_count": len(complaints),
            "complaint_ids": [complaint.id for complaint in complaints],
            "dominant_category": dominant_category,
            "trend": trend,
        }

    def _stable_hotspot_id(self, complaint_ids: List[uuid.UUID]) -> uuid.UUID:
        stable_key = "-".join(sorted(str(item) for item in complaint_ids))
        return uuid.uuid5(uuid.NAMESPACE_OID, stable_key)

    def _title(self, cluster: Dict) -> str:
        return f"{cluster['dominant_category']} hotspot ({cluster['reports_count']} reports)"

    def _severity_label(self, score: float) -> str:
        if score < 25.0:
            return "normal"
        if score < 50.0:
            return "moderate"
        if score < 75.0:
            return "high"
        return "critical"

    def _as_aware(self, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    def _notify_critical_hotspots(self, db: Session, hotspots: List[Hotspot]) -> None:
        critical_hotspots = [
            hotspot
            for hotspot in hotspots
            if (hotspot.severity == "critical" or float(hotspot.severity_score or 0) >= 75.0)
        ]
        if not critical_hotspots:
            return

        dedupe_after = datetime.now(timezone.utc) - timedelta(hours=24)
        for hotspot in critical_hotspots:
            try:
                linked_ids = [uuid.UUID(value) for value in json.loads(hotspot.complaint_ids or "[]")]
            except (ValueError, TypeError, json.JSONDecodeError):
                linked_ids = []
            if not linked_ids:
                continue

            anchor_complaint = (
                db.query(Complaint)
                .filter(Complaint.id.in_(linked_ids), Complaint.is_deleted == False)
                .first()
            )
            if not anchor_complaint:
                continue

            recipients = self._critical_hotspot_recipients(db, anchor_complaint.municipality_id)
            for recipient in recipients:
                existing = (
                    db.query(Notification)
                    .filter(
                        Notification.user_id == recipient.id,
                        Notification.complaint_id == anchor_complaint.id,
                        Notification.type == "CRITICAL_HOTSPOT",
                        Notification.created_at >= dedupe_after,
                    )
                    .first()
                )
                if existing:
                    continue

                db.add(Notification(
                    user_id=recipient.id,
                    complaint_id=anchor_complaint.id,
                    title=f"Critical hotspot detected: {hotspot.title}",
                    message=(
                        f"{hotspot.reports_count} nearby complaints formed a critical hotspot "
                        f"with severity {round(float(hotspot.severity_score or 0), 1)}%."
                    ),
                    type="CRITICAL_HOTSPOT",
                ))
        db.commit()

    def _critical_hotspot_recipients(
        self,
        db: Session,
        municipality_id: Optional[uuid.UUID],
    ) -> List[User]:
        query = db.query(User).filter(User.is_active == True, User.is_deleted == False)
        if municipality_id:
            return query.filter(
                or_(
                    and_(
                        User.role.in_([
                        UserRole.MUNICIPALITY_ADMIN.value,
                        UserRole.MUNICIPALITY_OFFICER.value,
                        ]),
                        User.municipality_id == municipality_id,
                    ),
                    User.role == UserRole.SUPER_ADMIN.value,
                )
            ).all()
        return query.filter(User.role == UserRole.SUPER_ADMIN.value).all()

hotspot_service = HotspotService()
