// types/pollution.ts
export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city: string;
  district: string;
  state: string;
}

export interface IncidentReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title?: string;
  shortDescription?: string;
  assignedOfficer?: string;
  categoryName?: string;
  type: 'air' | 'land' | 'water' | 'noise';
  severity: 'normal' | 'low' | 'moderate' | 'medium' | 'high' | 'critical';
  severityScore?: number;
  severityPercentage?: number;
  imageSeverityScore?: number;
  surveyScore?: number;
  weatherScore?: number;
  densityScore?: number;
  severityBreakdown?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  description: string;
  location: GeoLocation;
  mediaUrls: string[];
  thumbnailUrl?: string;
  aqiReading?: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  reportedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  notes?: string;
  aiConfidence?: number;
  predictedEscalation?: 'stable' | 'increasing' | 'decreasing';
  clusterId?: string;
}

export interface AQIPrediction {
  id: string;
  location: GeoLocation;
  currentAQI: number;
  predictedAQI: number;
  predictionTime: string;
  confidence: number;
  factors: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    nearbyIncidents: number;
  };
  trend: 'improving' | 'stable' | 'worsening';
}

export interface HotspotCluster {
  id: string;
  center: GeoLocation;
  radius: number;
  incidentCount: number;
  averageSeverity: number;
  dominantType: 'air' | 'land' | 'water' | 'noise';
  trend: 'growing' | 'stable' | 'shrinking';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'municipality_officer' | 'municipality_admin' | 'super_admin' | 'admin' | 'moderator' | 'user';
  status: 'active' | 'suspended' | 'banned';
  reportsCount: number;
  joinedAt: string;
  lastActive: string;
  avatar?: string;
  phone?: string;
  city: string;
}

export interface DashboardStats {
  totalIncidents: number;
  pendingIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  totalUsers: number;
  activeUsers: number;
  averageAQI: number;
  hotspotCount: number;
  resolutionRate: number;
  averageResponseTime: number;
}

export interface AdminAction {
  id: string;
  adminId: string;
  actionType: 'resolve' | 'dismiss' | 'assign' | 'note' | 'escalate';
  incidentId: string;
  timestamp: string;
  details: string;
}
