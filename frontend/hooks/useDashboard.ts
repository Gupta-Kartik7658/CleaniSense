import { useState, useEffect, useCallback } from "react";
import { DashboardData, ReportItem, HotspotItem, BackendComplaintItem, BackendHotspotItem } from "../types/dashboard";
import { dashboardService } from "../services/dashboard";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const backendData = await dashboardService.getDashboard(signal);
      
      // Map backend status to UI-compatible statuses
      const mapStatus = (status: string): "Pending" | "Under Review" | "Resolved" | "Rejected" => {
        const lower = status.toLowerCase();
        if (lower === "submitted" || lower === "draft") return "Pending";
        if (lower === "resolved") return "Resolved";
        if (lower === "rejected") return "Rejected";
        return "Under Review";
      };

      // Map complaint item
      const mappedReports: ReportItem[] = backendData.recent_reports.map((r: BackendComplaintItem) => ({
        id: r.id,
        title: r.title,
        status: mapStatus(r.status),
        locationName: r.location_name,
        latitude: r.latitude,
        longitude: r.longitude,
        date: r.created_at ? r.created_at.split("T")[0] : "",
        category: r.category ? r.category.name : "Other"
      }));

      // Map hotspot item
      const mappedHotspots: HotspotItem[] = backendData.nearby_hotspots.map((h: BackendHotspotItem) => ({
        id: h.id,
        title: h.title,
        description: h.description,
        latitude: h.latitude,
        longitude: h.longitude,
        distance: "Local Area",
        priority: h.severity.charAt(0).toUpperCase() + h.severity.slice(1),
        reportsCount: 0
      }));

      // Build compatible DashboardData object
      const formattedData: DashboardData = {
        summary: [
          { label: "Total Reports", value: backendData.overview.total_reports, change: "All time logs", statusType: "neutral" },
          { label: "Active Reports", value: backendData.overview.active_reports, change: "Under review", statusType: "warning" },
          { label: "Resolved Reports", value: backendData.overview.resolved_reports, change: "Successfully resolved", statusType: "success" },
          { label: "Nearby Hotspots", value: backendData.overview.nearby_hotspots, change: "Action required", statusType: "danger" }
        ],
        reports: mappedReports,
        hotspots: mappedHotspots,
        complaintMap: backendData.complaint_map,
        unreadNotifications: backendData.unread_notifications
      };

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
    fetchDashboardData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchDashboardData]);

  const refreshDashboard = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { data, loading, error, lastUpdated, refreshDashboard };
}
