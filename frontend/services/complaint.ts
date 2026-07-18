import api from "../lib/api";
import { 
  ComplaintDetailResponse, 
  ComplaintCreatePayload, 
  AttachmentResponse, 
  ResolutionResponse 
} from "../types/complaint";
import { BackendComplaintItem } from "../types/dashboard";

export interface ComplaintsQueryResponse {
  items: BackendComplaintItem[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export const complaintService = {
  getComplaints(
    params: {
      status?: string;
      category_id?: string;
      search?: string;
      page?: number;
      page_size?: number;
    },
    signal?: AbortSignal
  ): Promise<ComplaintsQueryResponse> {
    return api.get("/complaints", { 
      params: {
        status: params.status || undefined,
        category_id: params.category_id || undefined,
        search: params.search || undefined,
        page: params.page || 1,
        page_size: params.page_size || 20
      },
      signal 
    });
  },

  getComplaintDetail(id: string, signal?: AbortSignal): Promise<ComplaintDetailResponse> {
    return api.get(`/complaints/${id}`, { signal });
  },

  getComplaintResolution(id: string, signal?: AbortSignal): Promise<ResolutionResponse> {
    return api.get(`/complaints/${id}/resolution`, { signal });
  },

  createComplaint(payload: ComplaintCreatePayload, attachments: File[], signal?: AbortSignal): Promise<BackendComplaintItem> {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("category_id", payload.category_id);
    formData.append("location_name", payload.location_name);
    formData.append("latitude", String(payload.latitude));
    formData.append("longitude", String(payload.longitude));
    if (payload.municipality_id) {
      formData.append("municipality_id", payload.municipality_id);
    }
    if (payload.area_affected_sqm !== undefined && payload.area_affected_sqm !== null) {
      formData.append("area_affected_sqm", String(payload.area_affected_sqm));
    }
    if (payload.population_affected !== undefined && payload.population_affected !== null) {
      formData.append("population_affected", String(payload.population_affected));
    }
    if (payload.duration_hours !== undefined && payload.duration_hours !== null) {
      formData.append("duration_hours", String(payload.duration_hours));
    }
    if (payload.survey_data) {
      formData.append("survey_data", JSON.stringify(payload.survey_data));
    }
    attachments.forEach((file) => {
      formData.append("files", file);
    });

    return api.post("/complaints", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      signal
    });
  },

  uploadAttachment(complaintId: string, file: File, signal?: AbortSignal): Promise<AttachmentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/complaints/${complaintId}/attachments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      signal
    });
  },

  updateComplaint(id: string, payload: Partial<ComplaintCreatePayload>, signal?: AbortSignal): Promise<BackendComplaintItem> {
    return api.put(`/complaints/${id}`, payload, { signal });
  },

  deleteComplaint(id: string, signal?: AbortSignal): Promise<{ id: string }> {
    return api.delete(`/complaints/${id}`, { signal });
  },

  getAnalytics(params?: { timeframe?: string }, signal?: AbortSignal): Promise<any> {
    return api.get("/analytics", { params, signal });
  },

  getMapData(signal?: AbortSignal): Promise<any> {
    return api.get("/map", { signal });
  }
};
