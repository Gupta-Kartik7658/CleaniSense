import uuid
from typing import List, Dict, Any
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session, joinedload

from app.models.complaint import Complaint
from app.constants.enums import ComplaintStatus
from app.utils.geo import haversine_m
from app.core.config import settings

HOTSPOT_RADIUS_METERS = 1000.0


class _UnionFind:
    def __init__(self, size: int) -> None:
        self.parent = list(range(size))

    def find(self, node: int) -> int:
        while self.parent[node] != node:
            self.parent[node] = self.parent[self.parent[node]]
            node = self.parent[node]
        return node

    def union(self, a: int, b: int) -> None:
        root_a, root_b = self.find(a), self.find(b)
        if root_a != root_b:
            self.parent[root_a] = root_b


def _complaint_point(complaint: Complaint) -> Dict[str, Any]:
    category_name = complaint.category.name if complaint.category else None
    res = complaint.resolution
    return {
        "id": str(complaint.id),
        "title": complaint.title,
        "description": complaint.description or "",
        "status": complaint.status,
        "severity": complaint.severity or "medium",
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "location_name": complaint.location_name or "",
        "category_name": category_name or "General",
        "assigned_officer": complaint.assigned_officer or (res.officer_name if res else ""),
        "resolution_summary": res.summary if res else "",
        "work_details": res.actions if res else "",
    }


def cluster_complaints(
    complaints: List[Complaint],
    radius_meters: float = HOTSPOT_RADIUS_METERS,
) -> Dict[str, Any]:
    """
    Group complaints whose coordinates fall within `radius_meters` of each other (Union-Find / K-nearest chaining).
    Returns singles (isolated marks) and expanding hotspots (2+ complaints in range).
    """
    if not complaints:
        return {"singles": [], "hotspots": [], "total_complaints": 0}

    uf = _UnionFind(len(complaints))
    for i in range(len(complaints)):
        for j in range(i + 1, len(complaints)):
            a, b = complaints[i], complaints[j]
            if haversine_m(a.longitude, a.latitude, b.longitude, b.latitude) <= radius_meters:
                uf.union(i, j)

    groups: Dict[int, List[int]] = {}
    for idx in range(len(complaints)):
        root = uf.find(idx)
        groups.setdefault(root, []).append(idx)

    singles: List[Dict[str, Any]] = []
    hotspots: List[Dict[str, Any]] = []

    for members in groups.values():
        member_complaints = [complaints[i] for i in members]
        points = [_complaint_point(c) for c in member_complaints]

        avg_lat = sum(c.latitude for c in member_complaints) / len(member_complaints)
        avg_lon = sum(c.longitude for c in member_complaints) / len(member_complaints)

        if len(member_complaints) == 1:
            singles.append(points[0])
        else:
            # Dynamic expanding radius based on distance from centroid to farthest complaint + margin
            max_dist = max(
                haversine_m(avg_lon, avg_lat, c.longitude, c.latitude)
                for c in member_complaints
            )
            dynamic_radius = round(max(radius_meters, max_dist + 25.0), 1)

            # Extract all pollution categories present in the cluster & counts per category
            category_counts: Dict[str, int] = {}
            for p in points:
                cat = p.get("category_name") or "General"
                category_counts[cat] = category_counts.get(cat, 0) + 1

            categories_present = list(category_counts.keys())
            dominant_category = max(category_counts, key=category_counts.get) if category_counts else "General"

            hotspots.append({
                "id": str(uuid.uuid5(uuid.NAMESPACE_OID, "-".join(sorted(str(p["id"]) for p in points)))),
                "latitude": avg_lat,
                "longitude": avg_lon,
                "count": len(member_complaints),
                "radius_meters": dynamic_radius,
                "dominant_category": dominant_category,
                "categories_present": categories_present,
                "category_counts": category_counts,
                "complaint_ids": [p["id"] for p in points],
                "complaints": points,
            })

    hotspots.sort(key=lambda h: h["count"], reverse=True)

    return {
        "singles": singles,
        "hotspots": hotspots,
        "total_complaints": len(complaints),
    }


class ComplaintClusterService:
    def get_user_complaint_map(
        self,
        db: Session,
        user_id: uuid.UUID,
        radius_meters: float = HOTSPOT_RADIUS_METERS,
    ) -> Dict[str, Any]:
        all_user_complaints = (
            db.query(Complaint)
            .options(joinedload(Complaint.category), joinedload(Complaint.resolution))
            .filter(
                Complaint.user_id == user_id,
                Complaint.is_deleted == False,
                Complaint.latitude.isnot(None),
                Complaint.longitude.isnot(None),
                # Exclude reports with severity < 20% from map plotting
                (Complaint.severity_score >= 20.0) | (Complaint.severity_score == None),
                Complaint.status != ComplaintStatus.NO_POLLUTION_DETECTED.value,
            )
            .order_by(Complaint.created_at.desc())
            .all()
        )
        user_points = [_complaint_point(c) for c in all_user_complaints]

        active_complaints = [
            c for c in all_user_complaints
            if c.status not in [
                ComplaintStatus.RESOLVED.value,
                ComplaintStatus.REJECTED.value,
                ComplaintStatus.ARCHIVED.value,
                ComplaintStatus.NO_POLLUTION_DETECTED.value,
            ]
        ]
        result = cluster_complaints(active_complaints, radius_meters=radius_meters)
        result["user_complaints"] = user_points
        result["hotspot_radius_meters"] = radius_meters
        return result

    def get_municipality_complaint_map(
        self,
        db: Session,
        municipality_id: uuid.UUID,
        radius_meters: float = HOTSPOT_RADIUS_METERS,
    ) -> Dict[str, Any]:
        from sqlalchemy import or_
        complaints = (
            db.query(Complaint)
            .options(joinedload(Complaint.category), joinedload(Complaint.resolution))
            .filter(
                Complaint.municipality_id == municipality_id,
                Complaint.is_deleted == False,
                Complaint.latitude.isnot(None),
                Complaint.longitude.isnot(None),
                or_(Complaint.severity_score >= 20.0, Complaint.severity_score == None),
                Complaint.status.notin_([
                    ComplaintStatus.RESOLVED.value,
                    ComplaintStatus.REJECTED.value,
                    ComplaintStatus.ARCHIVED.value,
                    ComplaintStatus.NO_POLLUTION_DETECTED.value,
                ])
            )
            .order_by(Complaint.created_at.desc())
            .all()
        )
        result = cluster_complaints(complaints, radius_meters=radius_meters)
        result["hotspot_radius_meters"] = radius_meters
        return result

    def get_all_complaint_map(
        self,
        db: Session,
        radius_meters: float = HOTSPOT_RADIUS_METERS,
    ) -> Dict[str, Any]:
        from sqlalchemy import or_
        complaints = (
            db.query(Complaint)
            .options(joinedload(Complaint.category), joinedload(Complaint.resolution))
            .filter(
                Complaint.is_deleted == False,
                Complaint.latitude.isnot(None),
                Complaint.longitude.isnot(None),
                or_(Complaint.severity_score >= 20.0, Complaint.severity_score == None),
                Complaint.status.notin_([
                    ComplaintStatus.RESOLVED.value,
                    ComplaintStatus.REJECTED.value,
                    ComplaintStatus.ARCHIVED.value,
                    ComplaintStatus.NO_POLLUTION_DETECTED.value,
                ])
            )
            .order_by(Complaint.created_at.desc())
            .all()
        )
        result = cluster_complaints(complaints, radius_meters=radius_meters)
        result["hotspot_radius_meters"] = radius_meters
        return result


complaint_cluster_service = ComplaintClusterService()
