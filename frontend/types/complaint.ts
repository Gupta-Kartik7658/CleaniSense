import { CategoryResponse } from "./config";

export interface MunicipalityResponse {
  id: string;
  name: string;
  district: string;
  state: string;
  contact_email?: string;
}

export interface TimelineEventResponse {
  id: string;
  status: string;
  remarks: string;
  created_at: string;
}

export interface AttachmentResponse {
  id: string;
  public_url: string;
  file_type: string;
  file_name: string;
  file_size_bytes: number;
}

export interface ResolutionResponse {
  id: string;
  summary: string;
  department: string;
  officer_name: string;
  actions: string;
  before_image_url?: string;
  after_image_url?: string;
  date_resolved: string;
}

export interface ComplaintDetailResponse {
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
  area_affected_sqm?: number;
  population_affected?: number;
  duration_hours?: number;
  survey_data?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  created_at: string;
  category?: CategoryResponse;
  municipality?: MunicipalityResponse;
  timeline: TimelineEventResponse[];
  attachments: AttachmentResponse[];
  assigned_officer?: string;
  assignedOfficer?: string;
  resolution?: ResolutionResponse;
}

export interface ComplaintCreatePayload {
  title: string;
  description: string;
  category_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  municipality_id?: string;
  area_affected_sqm?: number;
  population_affected?: number;
  duration_hours?: number;
  survey_data?: Record<string, unknown>;
}
