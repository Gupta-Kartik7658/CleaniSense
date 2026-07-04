import { CategoryResponse } from "./config";

export interface DashboardOverview {
  total_reports: number;
  active_reports: number;
  resolved_reports: number;
  nearby_hotspots: number;
}

export interface BackendComplaintItem {
  id: string;
  title: string;
  description: string;
  status: string;
  severity?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  created_at: string;
  category?: CategoryResponse;
}

export interface BackendHotspotItem {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: "high" | "medium" | "low";
  is_active: boolean;
}

export interface BackendUserPreference {
  language: string;
  theme: string;
  notifications_enabled: boolean;
}

export interface BackendDashboardResponse {
  overview: DashboardOverview;
  recent_reports: BackendComplaintItem[];
  nearby_hotspots: BackendHotspotItem[];
  unread_notifications: number;
  preferences: BackendUserPreference;
}

// UI Specific Interfaces (for existing UI compatibility)
export interface StatCardData {
  label: string;
  value: string | number;
  change?: string;
  statusType?: "success" | "warning" | "neutral" | "danger";
}

export interface ReportItem {
  id: string;
  title: string;
  status: "Pending" | "Under Review" | "Resolved" | "Rejected";
  locationName: string;
  latitude: number;
  longitude: number;
  date: string;
  category?: string;
}

export interface HotspotItem {
  id: string;
  title: string;
  distance: string;
  priority: "High" | "Medium" | "Low" | string;
  reportsCount: number;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface DashboardData {
  summary: StatCardData[];
  reports: ReportItem[];
  hotspots: HotspotItem[];
  unreadNotifications?: number;
}
