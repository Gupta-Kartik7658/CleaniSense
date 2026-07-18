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
  severity_score?: number;
  image_severity_score?: number;
  ai_confidence_score?: number;
  survey_score?: number;
  weather_score?: number;
  density_score?: number;
  severity_breakdown?: string;
  image_analysis_summary?: string;
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

export interface ComplaintMapPoint {
  id: string;
  title: string;
  status: string;
  latitude: number;
  longitude: number;
  location_name: string;
  category_name?: string | null;
}

export interface ComplaintHotspotCluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  radius_meters: number;
  complaint_ids: string[];
  complaints: ComplaintMapPoint[];
  dominant_category?: string | null;
}

export interface ComplaintMapData {
  singles: ComplaintMapPoint[];
  hotspots: ComplaintHotspotCluster[];
  total_complaints: number;
  hotspot_radius_meters: number;
  user_complaints?: ComplaintMapPoint[];
}

export interface BackendDashboardResponse {
  overview: DashboardOverview;
  recent_reports: BackendComplaintItem[];
  nearby_hotspots: BackendHotspotItem[];
  complaint_map: ComplaintMapData;
  hotspot_map?: ComplaintMapData;
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
  status: "Under Review" | "Resolved" | "Rejected" | "Approved";
  locationName: string;
  latitude: number;
  longitude: number;
  date: string;
  category?: string;
  severity?: string;
  severityScore?: number;
  aiConfidenceScore?: number;
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
  complaintMap: ComplaintMapData;
  hotspotMap?: ComplaintMapData;
  unreadNotifications?: number;
}
