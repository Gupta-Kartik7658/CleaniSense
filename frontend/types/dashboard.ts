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
}

export interface HotspotItem {
  id: string;
  title: string;
  distance: string;
  priority: "High" | "Medium" | "Low";
  reportsCount: number;
}

export interface DashboardData {
  summary: StatCardData[];
  reports: ReportItem[];
  hotspots: HotspotItem[];
}
