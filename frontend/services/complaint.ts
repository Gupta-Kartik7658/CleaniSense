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

  createComplaint(payload: ComplaintCreatePayload, signal?: AbortSignal): Promise<BackendComplaintItem> {
    return api.post("/complaints", payload, { signal });
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
  }
};
