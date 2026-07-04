import { useState, useCallback, useEffect } from "react";
import { complaintService, ComplaintsQueryResponse } from "../services/complaint";
import { ComplaintDetailResponse, ComplaintCreatePayload, ResolutionResponse } from "../types/complaint";

export function useComplaints() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // History query states
  const [complaintsData, setComplaintsData] = useState<ComplaintsQueryResponse | null>(null);
  
  // Detail query states
  const [complaintDetail, setComplaintDetail] = useState<ComplaintDetailResponse | null>(null);
  const [resolutionDetail, setResolutionDetail] = useState<ResolutionResponse | null>(null);

  const fetchHistory = useCallback(async (
    params: {
      status?: string;
      category_id?: string;
      search?: string;
      page?: number;
      page_size?: number;
    },
    signal?: AbortSignal
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await complaintService.getComplaints(params, signal);
      setComplaintsData(data);
    } catch (err: any) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(err.message || "Failed to fetch complaints list.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (id: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await complaintService.getComplaintDetail(id, signal);
      setComplaintDetail(detail);
      
      // If status is resolved, also load resolution report
      if (detail.status.toLowerCase() === "resolved") {
        try {
          const resReport = await complaintService.getComplaintResolution(id, signal);
          setResolutionDetail(resReport);
        } catch (resErr) {
          console.error("Error loading resolution report detail:", resErr);
        }
      } else {
        setResolutionDetail(null);
      }
    } catch (err: any) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(err.message || "Failed to load complaint detail.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createComplaint = useCallback(async (
    payload: ComplaintCreatePayload,
    attachments: File[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const complaint = await complaintService.createComplaint(payload);
      
      // Upload all attachments concurrently using Promise.all
      if (attachments && attachments.length > 0) {
        await Promise.all(
          attachments.map((file) => complaintService.uploadAttachment(complaint.id, file))
        );
      }
      
      return complaint;
    } catch (err: any) {
      setError(err.message || "Failed to submit complaint.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelComplaint = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await complaintService.deleteComplaint(id);
    } catch (err: any) {
      setError(err.message || "Failed to delete complaint.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    complaintsData,
    complaintDetail,
    resolutionDetail,
    fetchHistory,
    fetchDetail,
    createComplaint,
    cancelComplaint
  };
}
