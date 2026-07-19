// services/pollutionService.ts
import api from '../lib/api';
import { IncidentReport, AQIPrediction, HotspotCluster, User, DashboardStats } from '@/types/pollution';

export class PollutionService {
  // Dashboard Statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/admin/stats');
      return response as any;
    } catch (error) {
      console.error('Error fetching dashboard stats from API, using fallback data:', error);
      // Fallback data if backend is in setup
      return {
        totalIncidents: 0,
        pendingIncidents: 0,
        resolvedIncidents: 0,
        criticalIncidents: 0,
        totalUsers: 0,
        activeUsers: 0,
        averageAQI: 0,
        hotspotCount: 0,
        resolutionRate: 0,
        averageResponseTime: 0
      };
    }
  }

  // Incidents Management
  static async getIncidents(params?: {
    status?: string;
    severity?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ incidents: IncidentReport[]; total: number }> {
    try {
      const response = await api.get('/admin/incidents', { params });
      return response as any;
    } catch (error) {
      console.error('Error fetching incidents, returning empty list:', error);
      return { incidents: [], total: 0 };
    }
  }

  static async getIncidentById(id: string): Promise<IncidentReport> {
    const response = await api.get(`/admin/incidents/${id}`);
    return response as any;
  }

  static async updateIncidentStatus(
    incidentId: string, 
    status: string, 
    notes?: string
  ): Promise<IncidentReport> {
    const response = await api.patch(`/admin/incidents/${incidentId}/status`, { status, notes });
    return response as any;
  }

  static async assignIncident(incidentId: string, adminId: string): Promise<void> {
    await api.post(`/admin/incidents/${incidentId}/assign`, { adminId });
  }

  static async getOfficers(): Promise<string[]> {
    try {
      const response: any = await api.get('/admin/officers');
      return response.data?.officers || response.officers || [
        "Officer Rajesh Sharma (Sanitation Dept)",
        "Officer Priya Verma (Environmental Protection)",
        "Officer Amit Patel (Waste Management)",
        "Officer Sunita Rao (Water Quality)",
        "Officer Vikram Singh (Air Safety)"
      ];
    } catch (error) {
      console.error('Error fetching officers list, returning default list:', error);
      return [
        "Officer Rajesh Sharma (Sanitation Dept)",
        "Officer Priya Verma (Environmental Protection)",
        "Officer Amit Patel (Waste Management)",
        "Officer Sunita Rao (Water Quality)",
        "Officer Vikram Singh (Air Safety)"
      ];
    }
  }

  static async assignOfficer(incidentId: string, officerName: string): Promise<any> {
    const response = await api.patch(`/admin/incidents/${incidentId}/assign-officer`, {
      officer_name: officerName
    });
    return response as any;
  }

  // AQI Predictions
  static async getAQIPredictions(): Promise<AQIPrediction[]> {
    try {
      const response = await api.get('/admin/predictions/aqi');
      return response as any;
    } catch (error) {
      console.error('Error fetching AQI predictions, returning empty list:', error);
      return [];
    }
  }

  static async getAQIHeatmap(): Promise<any> {
    try {
      const response = await api.get('/admin/predictions/heatmap');
      return response as any;
    } catch (error) {
      console.error('Error fetching AQI heatmap, returning empty:', error);
      return {};
    }
  }

  // Hotspot Clusters
  static async getHotspotClusters(): Promise<HotspotCluster[]> {
    try {
      const response = await api.get('/admin/hotspots');
      return response as any;
    } catch (error) {
      console.error('Error fetching hotspots, returning empty list:', error);
      return [];
    }
  }

  static async getUsers(params?: {
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    try {
      const response = await api.get('/admin/users', { params });
      return response as any;
    } catch (error) {
      console.error('Error fetching users, returning empty list:', error);
      return { users: [], total: 0 };
    }
  }

  static async updateUserStatus(userId: string, status: string): Promise<void> {
    await api.patch(`/admin/users/${userId}/status`, { status });
  }

  static async updateUserRoleByEmail(email: string, role: string): Promise<User> {
    const response = await api.patch('/admin/users/role', { email, role });
    return response as any;
  }

  // Media Management
  static async getMediaByIncident(incidentId: string): Promise<string[]> {
    try {
      const response = await api.get(`/admin/incidents/${incidentId}/media`);
      return response as any;
    } catch (error) {
      console.error('Error fetching media, returning empty list:', error);
      return [];
    }
  }

  // Analytics
  static async getAnalytics(timeframe: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    try {
      const response = await api.get('/admin/analytics', { params: { timeframe } });
      return response as any;
    } catch (error) {
      console.error('Error fetching analytics, returning empty:', error);
      return {};
    }
  }

  // System Settings Actions
  static async getSettings(): Promise<any> {
    const response = await api.get('/admin/settings');
    return response as any;
  }

  static async saveSettings(settings: any): Promise<any> {
    const response = await api.post('/admin/settings', settings);
    return response as any;
  }

  static async clearCache(): Promise<void> {
    await api.post('/admin/settings/clear-cache');
  }

  static async triggerDatabaseBackup(): Promise<Blob> {
    const response = await api.get('/admin/settings/backup', { responseType: 'blob' });
    return response as any;
  }

  static async deleteIncident(incidentId: string): Promise<void> {
    await api.delete(`/admin/incidents/${incidentId}`);
  }

  static async resolveIncident(
    incidentId: string,
    summary: string,
    actions: string,
    photo: File
  ): Promise<any> {
    const formData = new FormData();
    formData.append("summary", summary);
    formData.append("actions", actions);
    formData.append("photo", photo);
    const response = await api.post(`/admin/incidents/${incidentId}/resolve`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response as any;
  }
}
