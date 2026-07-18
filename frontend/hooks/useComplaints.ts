import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { complaintService, ComplaintsQueryResponse } from "../services/complaint";
import { ComplaintDetailResponse, ComplaintCreatePayload, ResolutionResponse } from "../types/complaint";
import { invalidateDashboardCache } from "./useDashboard";

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
      setError(null);
      setComplaintsData(data);
    } catch (err: any) {
      // On abort, silently stop loading but keep existing data in place
      if (axios.isCancel(err) || err?.name === 'CanceledError' || err?.name === 'AbortError') {
        setLoading(false);
        return;
      }
      setError(err.message || "Failed to fetch complaints list.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (id: string, signal?: AbortSignal, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const detail = await complaintService.getComplaintDetail(id, signal);
      setError(null);
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
      if (axios.isCancel(err)) return;
      setError(err.message || "Failed to load complaint detail.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  const createComplaint = useCallback(async (
    payload: ComplaintCreatePayload,
    attachments: File[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const complaint = await complaintService.createComplaint(payload, attachments);
      invalidateDashboardCache();
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
      invalidateDashboardCache();
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
