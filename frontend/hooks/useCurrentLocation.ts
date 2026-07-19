import { useState, useEffect } from "react";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function useCurrentLocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);

    const tryGetPosition = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLoading(false);
          setError(null);
        },
        (err) => {
          if (highAccuracy) {
            // Fallback to low accuracy mode for desktop browsers or slow GPS
            tryGetPosition(false);
          } else {
            setError(err.message || "Failed to retrieve location.");
            setLoading(false);
          }
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 5000 : 7000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    };

    tryGetPosition(true);
  }, []);

  return { coords, loading, error };
}
