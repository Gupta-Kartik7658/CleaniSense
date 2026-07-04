import uuid
from typing import Optional, List
from math import radians, cos, sin, asin, sqrt
from sqlalchemy.orm import Session
from app.models.hotspot import Hotspot

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

hotspot_service = HotspotService()
