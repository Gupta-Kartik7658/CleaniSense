import api from "../lib/api";
import { HotspotResponse } from "../types/hotspot";

export const hotspotService = {
  getHotspots(
    lat?: number,
    lng?: number,
    radius?: number,
    severity?: string,
    signal?: AbortSignal
  ): Promise<HotspotResponse[]> {
    return api.get("/hotspots", {
      params: {
        latitude: lat !== undefined ? lat : undefined,
        longitude: lng !== undefined ? lng : undefined,
        radius_km: radius || undefined,
        severity: severity || undefined
      },
      signal
    });
  },

  getHotspotDetail(id: string, signal?: AbortSignal): Promise<HotspotResponse> {
    return api.get(`/hotspots/${id}`, { signal });
  }
};
