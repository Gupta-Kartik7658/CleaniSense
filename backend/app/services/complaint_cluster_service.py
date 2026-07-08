import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.utils.geo import haversine_m

HOTSPOT_RADIUS_METERS = 50.0


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
    return {
        "id": complaint.id,
        "title": complaint.title,
        "status": complaint.status,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "location_name": complaint.location_name,
        "category_name": category_name,
    }


def cluster_complaints(
    complaints: List[Complaint],
    radius_meters: float = HOTSPOT_RADIUS_METERS,
) -> Dict[str, Any]:
    """
    Group complaints whose coordinates fall within `radius_meters` of each other.
    Returns singles (isolated marks) and hotspots (2+ complaints in range).
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
            hotspots.append({
                "id": str(uuid.uuid5(uuid.NAMESPACE_OID, "-".join(sorted(str(p["id"]) for p in points)))),
                "latitude": avg_lat,
                "longitude": avg_lon,
                "count": len(member_complaints),
                "radius_meters": radius_meters,
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
        complaints = (
            db.query(Complaint)
            .filter(
                Complaint.user_id == user_id,
                Complaint.is_deleted == False,
                Complaint.latitude.isnot(None),
                Complaint.longitude.isnot(None),
            )
            .order_by(Complaint.created_at.desc())
            .all()
        )
        result = cluster_complaints(complaints, radius_meters=radius_meters)
        result["hotspot_radius_meters"] = radius_meters
        return result

    def get_municipality_complaint_map(
        self,
        db: Session,
        municipality_id: uuid.UUID,
        radius_meters: float = HOTSPOT_RADIUS_METERS,
    ) -> Dict[str, Any]:
        complaints = (
            db.query(Complaint)
            .filter(
                Complaint.municipality_id == municipality_id,
                Complaint.is_deleted == False,
                Complaint.latitude.isnot(None),
                Complaint.longitude.isnot(None),
            )
            .order_by(Complaint.created_at.desc())
            .all()
        )
        result = cluster_complaints(complaints, radius_meters=radius_meters)
        result["hotspot_radius_meters"] = radius_meters
        return result


complaint_cluster_service = ComplaintClusterService()
