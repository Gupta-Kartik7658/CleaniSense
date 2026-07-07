import uuid
from unittest.mock import MagicMock

from app.services.complaint_cluster_service import cluster_complaints, HOTSPOT_RADIUS_METERS


def _make_complaint(cid, lat, lon, title="Test"):
    c = MagicMock()
    c.id = cid
    c.title = title
    c.status = "submitted"
    c.latitude = lat
    c.longitude = lon
    c.location_name = "Test Location"
    c.category = None
    return c


def test_cluster_complaints_isolated_singles():
    complaints = [
        _make_complaint(uuid.uuid4(), 23.0225, 72.5714, "A"),
        _make_complaint(uuid.uuid4(), 23.0300, 72.5800, "B"),
    ]
    result = cluster_complaints(complaints, radius_meters=50)
    assert result["total_complaints"] == 2
    assert len(result["singles"]) == 2
    assert len(result["hotspots"]) == 0


def test_cluster_complaints_groups_within_50m():
    # ~30m apart at Ahmedabad latitude
    base_lat, base_lon = 23.0225, 72.5714
    offset = 0.00025  # ~28m north
    complaints = [
        _make_complaint(uuid.uuid4(), base_lat, base_lon, "Near A"),
        _make_complaint(uuid.uuid4(), base_lat + offset, base_lon, "Near B"),
        _make_complaint(uuid.uuid4(), 23.0300, 72.5800, "Far C"),
    ]
    result = cluster_complaints(complaints, radius_meters=HOTSPOT_RADIUS_METERS)
    assert result["total_complaints"] == 3
    assert len(result["hotspots"]) == 1
    assert result["hotspots"][0]["count"] == 2
    assert len(result["singles"]) == 1
