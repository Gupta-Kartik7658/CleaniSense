import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardData, ReportItem, HotspotItem } from "../types/dashboard";
import { dashboardService } from "../services/dashboard";

// ---------------------------------------------------------------------------
// Module-level cache: persists across component unmount/remount (navigation).
// Cleared automatically after CACHE_TTL_MS milliseconds.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cachedData: DashboardData | null = null;
let _cacheTimestamp: number | null = null;

function isCacheValid(): boolean {
  return (
    _cachedData !== null &&
    _cacheTimestamp !== null &&
    Date.now() - _cacheTimestamp < CACHE_TTL_MS
  );
}

function readCache(): DashboardData | null {
  return isCacheValid() ? _cachedData : null;
}

function writeCache(data: DashboardData) {
  _cachedData = data;
  _cacheTimestamp = Date.now();
}

function invalidateCache() {
  _cachedData = null;
  _cacheTimestamp = null;
}

// ---------------------------------------------------------------------------
// Status mapper (shared)
// ---------------------------------------------------------------------------
function mapStatus(status: string): "Under Review" | "Resolved" | "Rejected" | "Approved" {
  const lower = status.toLowerCase();
  if (lower === "resolved") return "Resolved";
  if (lower === "rejected") return "Rejected";
  if (
    lower === "municipality_accepted" ||
    lower === "officer_assigned" ||
    lower === "in_progress" ||
    lower === "inspection_completed"
  )
    return "Approved";
  // submitted, draft, ai_verification_in_progress, ai_validation_completed
  return "Under Review";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useDashboard() {
  // Initialise with cached data if available — no flash/skeleton on navigation back
  const [data, setData] = useState<DashboardData | null>(() => readCache());
  const [loading, setLoading] = useState(!isCacheValid());
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    _cacheTimestamp ? new Date(_cacheTimestamp) : null
  );

  const fetchDashboardData = useCallback(async (signal?: AbortSignal, force = false) => {
    // Return immediately if cache is still fresh and not a forced refresh
    if (!force && isCacheValid()) {
      setData(_cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const backendData = await dashboardService.getDashboard(signal);

      // Map complaint item
      const reportsList =
        backendData.recent_reports || (backendData as any).recent_complaints || [];
      const mappedReports: ReportItem[] = reportsList.map((r: any) => ({
        id: r.id,
        title: r.title,
        status: mapStatus(r.status),
        locationName: r.location_name,
        latitude: r.latitude,
        longitude: r.longitude,
        date: r.created_at ? String(r.created_at).split("T")[0] : "",
        category: r.category ? r.category.name : "Other",
        severity: r.severity,
        severityScore: r.severity_score,
        aiConfidenceScore: r.ai_confidence_score,
      }));

      // Map hotspot item
      const hotspotsList = backendData.nearby_hotspots || [];
      const mappedHotspots: HotspotItem[] = hotspotsList.map((h: any) => ({
        id: h.id,
        title: h.title,
        description:
          h.description ||
          `${h.reports_count || 2} reports clustered in this zone. Dominant category: ${
            h.dominant_category || "General"
          }.`,
        latitude: h.latitude,
        longitude: h.longitude,
        distance: "Local Area",
        priority: h.severity
          ? h.severity.charAt(0).toUpperCase() + h.severity.slice(1)
          : "Medium",
        reportsCount: h.reports_count || 0,
      }));

      // Hotspot map dataset (only hotspots near user reports)
      const hotspotMapData = {
        singles: [],
        hotspots: hotspotsList.map((h: any) => ({
          id: h.id,
          latitude: h.latitude,
          longitude: h.longitude,
          count: h.reports_count || 2,
          radius_meters: 50.0,
          complaint_ids: [],
          complaints: [],
          dominant_category: h.dominant_category,
        })),
        total_complaints: hotspotsList.reduce(
          (acc: number, curr: any) => acc + (curr.reports_count || 1),
          0
        ),
        hotspot_radius_meters: 50.0,
      };

      const formattedData: DashboardData = {
        summary: [
          {
            label: "Total Reports",
            value: backendData.overview?.total_reports || 0,
            change: "All time logs",
            statusType: "neutral",
          },
          {
            label: "Active Reports",
            value: backendData.overview?.active_reports || 0,
            change: "Under review",
            statusType: "warning",
          },
          {
            label: "Resolved Reports",
            value: backendData.overview?.resolved_reports || 0,
            change: "Successfully resolved",
            statusType: "success",
          },
          {
            label: "Nearby Hotspots",
            value: backendData.overview?.nearby_hotspots || 0,
            change: "Action required",
            statusType: "danger",
          },
        ],
        reports: mappedReports,
        hotspots: mappedHotspots,
        complaintMap: backendData.complaint_map || {
          singles: [],
          hotspots: [],
          total_complaints: 0,
          hotspot_radius_meters: 50.0,
        },
        hotspotMap: backendData.complaint_map || hotspotMapData,
        unreadNotifications: backendData.unread_notifications || 0,
      };

      // Write to module-level cache
      writeCache(formattedData);

      setData(formattedData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(err.message || "Failed to load dashboard data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Only fetch if cache is stale — if cache is valid, show cached instantly
    fetchDashboardData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchDashboardData]);

  /** Force a full refresh ignoring the cache (e.g. after submitting a new report) */
  const refreshDashboard = useCallback(() => {
    invalidateCache();
    fetchDashboardData(undefined, true);
  }, [fetchDashboardData]);

  return { data, loading, error, lastUpdated, refreshDashboard };
}