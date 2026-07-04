import { useState, useCallback } from "react";
import { hotspotService } from "../services/hotspot";
import { HotspotResponse } from "../types/hotspot";

export function useHotspots() {
  const [hotspots, setHotspots] = useState<HotspotResponse[]>([]);
  const [activeHotspot, setActiveHotspot] = useState<HotspotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHotspots = useCallback(async (
    lat?: number,
    lng?: number,
    radius?: number,
    severity?: string,
    signal?: AbortSignal
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await hotspotService.getHotspots(lat, lng, radius, severity, signal);
      setHotspots(data);
    } catch (err: any) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(err.message || "Failed to load hotspots.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHotspotDetail = useCallback(async (id: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await hotspotService.getHotspotDetail(id, signal);
      setActiveHotspot(detail);
      return detail;
    } catch (err: any) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(err.message || "Failed to load hotspot details.");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    hotspots,
    activeHotspot,
    loading,
    error,
    fetchHotspots,
    fetchHotspotDetail
  };
}
