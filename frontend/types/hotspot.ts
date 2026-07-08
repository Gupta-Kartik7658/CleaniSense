export interface HotspotResponse {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  severity: "high" | "medium" | "low" | string;
  severity_score?: number | null;
  radius_meters?: number | null;
  reports_count?: number;
  dominant_category?: string | null;
  trend?: string | null;
  is_active: boolean;
}
