import api from "../lib/api";
import { HotspotResponse } from "../types/hotspot";

function normalizeHotspots(payload: unknown): HotspotResponse[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item: any, index) => {
    const title =
      typeof item?.title === "string" && item.title.trim()
        ? item.title
        : `Environmental Hotspot #${index + 1}`;

    const reportsCount = Number(item?.reports_count ?? 0);
    const dominantCategory = item?.dominant_category || "Environmental";
    const radiusMeters = Number(item?.radius_meters ?? 0);

    return {
      ...item,
      id: String(item?.id ?? `hotspot-${index}`),
      title,
      description:
        item?.description ||
        `${reportsCount} unresolved report${reportsCount === 1 ? "" : "s"} clustered near this ${dominantCategory.toLowerCase()} zone${radiusMeters ? ` within ${Math.round(radiusMeters)}m` : ""}.`,
      latitude: Number(item?.latitude ?? 0),
      longitude: Number(item?.longitude ?? 0),
      severity: String(item?.severity || "medium"),
      reports_count: reportsCount,
      radius_meters: Number.isFinite(radiusMeters) ? radiusMeters : null,
      is_active: Boolean(item?.is_active ?? true),
    };
  });
}

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
    }).then(normalizeHotspots);
  },

  getHotspotDetail(id: string, signal?: AbortSignal): Promise<HotspotResponse> {
    return api.get(`/hotspots/${id}`, { signal });
  }
};
