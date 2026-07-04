export interface HotspotResponse {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: "high" | "medium" | "low" | string;
  is_active: boolean;
}
