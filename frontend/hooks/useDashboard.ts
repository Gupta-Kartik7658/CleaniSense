import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardData, ReportItem, HotspotItem } from "../types/dashboard";
import { dashboardService } from "../services/dashboard";

// ---------------------------------------------------------------------------
// Module-level cache: persists across component unmount/remount (navigation).
// Cleared automatically after CACHE_TTL_MS milliseconds.
// Only stores SUCCESSFULLY fetched data — never caches empty/failed responses.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cachedData: DashboardData | null = null;
let _cacheTimestamp: number | null = null;
let _cachedUserId: string | null = null;

function isCacheValid(userId?: string | null): boolean {
  return (
    _cachedData !== null &&
    _cacheTimestamp !== null &&
    Date.now() - _cacheTimestamp < CACHE_TTL_MS &&
    // Invalidate cache if user changed
    (_cachedUserId === null || _cachedUserId === userId)
  );
}

function readCache(userId?: string | null): DashboardData | null {
  return isCacheValid(userId) ? _cachedData : null;
}

function writeCache(data: DashboardData, userId?: string | null) {
  // Only cache if summary labels exist — never cache empty/failed state
  const hasContent = data.summary && data.summary.length > 0 && data.summary.some(s => s.label);
  if (hasContent) {
    _cachedData = data;
    _cacheTimestamp = Date.now();
    _cachedUserId = userId ?? null;
  }
}

export function invalidateDashboardCache() {
  _cachedData = null;
  _cacheTimestamp = null;
  _cachedUserId = null;
}

// ---------------------------------------------------------------------------
// Status mapper (shared)
// ---------------------------------------------------------------------------
function mapStatus(status: string, severityScore?: number): "Under Review" | "Resolved" | "Rejected" | "Approved" | "No Pollution Detected" {
  const lower = (status || "").toLowerCase();
  if (lower === "no_pollution_detected" || (severityScore !== undefined && severityScore !== null && severityScore < 20)) {
    return "No Pollution Detected";
  }
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
// IMPORTANT: `userId` must be passed from the page component (from useAuth).
// The hook will NOT fetch until userId is a non-null string.
// This prevents the Vercel production race condition where Firebase Auth
// takes longer to initialize than the component mount, causing an unauthenticated
// request that returns empty data which then gets cached as the "real" state.
// ---------------------------------------------------------------------------
export function useDashboard(userId?: string | null) {
  // Initialise with cached data if available and valid for this user
  const [data, setData] = useState<DashboardData | null>(() => readCache(userId));
  const [loading, setLoading] = useState<boolean>(() => !isCacheValid(userId));
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    _cacheTimestamp ? new Date(_cacheTimestamp) : null
  );

  // Track previous userId to detect user account switches
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  const fetchDashboardData = useCallback(async (signal?: AbortSignal, force = false, forUserId?: string | null) => {
    // CRITICAL: Never fetch without a confirmed authenticated userId.
    // This is the primary fix for the production race condition.
    if (!forUserId) {
      setLoading(false);
      return;
    }

    // Return immediately if cache is still fresh and not a forced refresh
    if (!force && isCacheValid(forUserId)) {
      const cached = readCache(forUserId);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const backendData = await dashboardService.getDashboard(signal);

      // Detect silent auth failure: api.ts resolves 401/403 as { error: true, authError: true }.
      // If this happens, silently fail — the effect will re-run once userId is confirmed.
      if ((backendData as any)?.error === true && (backendData as any)?.authError === true) {
        setLoading(false);
        return;
      }

      // Map complaint items
      const reportsList =
        backendData.recent_reports || (backendData as any).recent_complaints || [];
      const mappedReports: ReportItem[] = reportsList.map((r: any) => ({
        id: r.id,
        title: r.title,
        status: mapStatus(r.status, r.severity_score),
        locationName: r.location_name,
        latitude: r.latitude,
        longitude: r.longitude,
        date: r.created_at ? String(r.created_at).split("T")[0] : "",
        category: r.category ? r.category.name : "Other",
        severity: r.severity,
        severityScore: r.severity_score,
        aiConfidenceScore: r.ai_confidence_score,
      }));

      // Map hotspot items
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

      // Hotspot map dataset — system-wide clusters for the HotspotSection mini-map
      const hotspotMapRaw = backendData.hotspot_map || backendData.complaint_map || null;
      const hotspotMapData = hotspotMapRaw
        ? {
            singles: (hotspotMapRaw.singles || []).map((s: any) => ({
              id: String(s.id),
              latitude: Number(s.latitude),
              longitude: Number(s.longitude),
              title: s.title || "Report",
              status: s.status || "submitted",
              location_name: s.location_name || "",
              category_name: s.category_name || null,
            })),
            hotspots: (hotspotMapRaw.hotspots || []).map((h: any) => ({
              id: String(h.id),
              latitude: Number(h.latitude),
              longitude: Number(h.longitude),
              count: Number(h.count || 2),
              radius_meters: Number(h.radius_meters || 1000),
              complaint_ids: (h.complaint_ids || []).map(String),
              complaints: (h.complaints || []).map((c: any) => ({
                id: String(c.id),
                latitude: Number(c.latitude),
                longitude: Number(c.longitude),
                title: c.title || "Report",
                status: c.status || "submitted",
                location_name: c.location_name || "",
                category_name: c.category_name || null,
              })),
              dominant_category: h.dominant_category || null,
            })),
            total_complaints: Number(hotspotMapRaw.total_complaints || 0),
            hotspot_radius_meters: Number(hotspotMapRaw.hotspot_radius_meters || 1000),
          }
        : { singles: [], hotspots: [], total_complaints: 0, hotspot_radius_meters: 1000 };

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
        // complaintMap = user's own complaints (for ComplaintMapSection - personal pins)
        complaintMap: backendData.complaint_map || {
          singles: [],
          hotspots: [],
          total_complaints: 0,
          hotspot_radius_meters: 1000.0,
        },
        // hotspotMap = system-wide cluster data (for HotspotSection mini-map)
        hotspotMap: hotspotMapData,
        unreadNotifications: backendData.unread_notifications || 0,
      };

      // Write to module-level cache ONLY on confirmed successful responses
      writeCache(formattedData, forUserId);

      setData(formattedData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      // On abort (navigation away), don't clear data or show an error — just stop loading
      if (err.name === "CanceledError" || err.name === "AbortError") {
        setLoading(false);
        return;
      }
      setError(err.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (!userId) {
      // Auth not resolved yet — keep loading state, wait for userId to become available
      setLoading(true);
      return () => controller.abort();
    }

    // If user switched accounts, clear the old user's cached data
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
      invalidateDashboardCache();
    }
    prevUserIdRef.current = userId;

    fetchDashboardData(controller.signal, false, userId);

    return () => {
      controller.abort();
    };
  }, [fetchDashboardData, userId]);

  /** Force a full refresh ignoring the cache (e.g. after submitting a new report) */
  const refreshDashboard = useCallback(() => {
    invalidateDashboardCache();
    fetchDashboardData(undefined, true, userId ?? null);
  }, [fetchDashboardData, userId]);

  return { data, loading, error, lastUpdated, refreshDashboard };
}