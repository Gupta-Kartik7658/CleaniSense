"use client";

import React, { use, useEffect } from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import Link from "next/link";
import { useComplaints } from "@/hooks/useComplaints";
import { useAuth } from "@/providers/AuthProvider";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ComplaintDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const { complaintDetail, resolutionDetail, fetchDetail, loading, error } = useComplaints();

  useEffect(() => {
    const controller = new AbortController();
    if (id && user && !authLoading) {
      fetchDetail(id, controller.signal);
    }
    return () => {
      controller.abort();
    };
  }, [id, user, authLoading, fetchDetail]);

  // Real-time status updates polling from backend
  useEffect(() => {
    if (!id || !complaintDetail) return;

    const lowerStatus = complaintDetail.status.toLowerCase();
    // Stop polling if status is terminal
    if (lowerStatus === "resolved" || lowerStatus === "rejected" || lowerStatus === "dismissed") {
      return;
    }

    const interval = setInterval(() => {
      fetchDetail(id, undefined, true);
    }, 5000); // Silent fetch details every 5 seconds

    return () => clearInterval(interval);
  }, [id, complaintDetail, fetchDetail]);

  const mapStatus = (status: string): "Submitted" | "Under Review" | "AI Verification Complete" | "Approved" | "Resolved" | "Rejected" => {
    const lower = status.toLowerCase();
    if (lower === "resolved") return "Resolved";
    if (lower === "rejected" || lower === "dismissed") return "Rejected";
    if (lower === "ai_validation_completed") return "AI Verification Complete";
    if (lower === "submitted" || lower === "draft") return "Submitted";
    if (lower === "ai_verification_in_progress") return "Under Review";
    if (
      lower === "municipality_accepted" ||
      lower === "officer_assigned" ||
      lower === "in_progress" ||
      lower === "inspection_completed"
    )
      return "Approved";
    return "Under Review";
  };

  const getStepStatus = (stepId: string, currentStatus: string) => {
    const status = currentStatus.toLowerCase();
    
    if (status === "rejected" || status === "dismissed") {
      return stepId === "resolved" ? "pending" : "rejected";
    }

    const stepMapping: Record<string, string[]> = {
      submitted: ["submitted", "ai_verification_in_progress", "ai_validation_completed", "municipality_accepted", "officer_assigned", "in_progress", "inspection_completed", "resolved"],
      under_review: ["ai_verification_in_progress", "ai_validation_completed", "municipality_accepted", "officer_assigned", "in_progress", "inspection_completed", "resolved"],
      ai_verified: ["ai_validation_completed", "municipality_accepted", "officer_assigned", "in_progress", "inspection_completed", "resolved"],
      approved: ["municipality_accepted", "officer_assigned", "in_progress", "inspection_completed", "resolved"],
      resolved: ["resolved"]
    };

    if (
      status === stepId ||
      (stepId === "under_review" && status === "ai_verification_in_progress") ||
      (stepId === "ai_verified" && status === "ai_validation_completed") ||
      (stepId === "approved" && ["municipality_accepted", "officer_assigned", "in_progress", "inspection_completed"].includes(status))
    ) {
      return "active";
    }

    const allowedForStep = stepMapping[stepId] || [];
    if (allowedForStep.includes(status)) {
      return "completed";
    }
    return "pending";
  };

  const statusMapped = complaintDetail ? mapStatus(complaintDetail.status) : "Under Review";
  const severityMapped = complaintDetail?.severity ? complaintDetail.severity.charAt(0).toUpperCase() + complaintDetail.severity.slice(1) : "Medium";
  const severityScore = complaintDetail?.severity_score;

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        
        {/* Back Link */}
        <div>
          <Link
            href="/complaints/history"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <span>←</span> Back to History
          </Link>
        </div>

        {authLoading || loading ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center py-20 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-emerald-600 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading complaint details...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        ) : !complaintDetail ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center py-20">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Complaint not found.</p>
          </div>
        ) : (
          <>
            {/* Header Summary */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">
                      #{complaintDetail.id.substring(0, 8)}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                      {complaintDetail.title}
                    </h2>
                    <StatusBadge status={statusMapped} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    📍 {complaintDetail.location_name} • Submitted on{" "}
                    {new Date(complaintDetail.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Severity Level
                  </span>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-md border ${
                      severityMapped === "High" || severityMapped === "Critical"
                        ? "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400"
                        : "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400"
                    }`}
                  >
                    {severityScore !== undefined && severityScore !== null
                      ? `${Math.round(severityScore)}% ${severityMapped}`
                      : `${severityMapped} Priority`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-150 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Category</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {complaintDetail.category ? complaintDetail.category.name : "Other"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">
                    Responsible Authority
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {complaintDetail.municipality 
                      ? complaintDetail.municipality.name 
                      : (complaintDetail.status !== "submitted" && complaintDetail.status !== "draft" && complaintDetail.status !== "ai_verification_in_progress"
                        ? "Municipal Corporation (Assigned)"
                        : "Pending Assignment")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">
                    GPS Coordinates
                  </span>
                  <span className="font-mono text-slate-600 dark:text-slate-350">
                    {complaintDetail.latitude.toFixed(4)}° N, {complaintDetail.longitude.toFixed(4)}° E
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Lifecycle Timeline */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-3">
                Complaint Status Lifecycle
              </h3>
              
              <div className="grid grid-cols-5 gap-2 relative">
                {[
                  { id: "submitted", label: "Submitted" },
                  { id: "under_review", label: "Under Review" },
                  { id: "ai_verified", label: "AI Verified" },
                  { id: "approved", label: "Approved" },
                  { id: "resolved", label: "Resolved" }
                ].map((step, idx) => {
                  const stepStatus = getStepStatus(step.id, complaintDetail.status);
                  
                  let colorClass = "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800";
                  let lineClass = "bg-slate-150 dark:bg-slate-800";
                  
                  if (stepStatus === "completed") {
                    colorClass = "bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400";
                    lineClass = "bg-emerald-500";
                  } else if (stepStatus === "active") {
                    colorClass = "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400 font-extrabold";
                    lineClass = "bg-blue-450";
                  } else if (stepStatus === "rejected") {
                    colorClass = "bg-rose-50 border-rose-250 text-rose-700 dark:bg-rose-955/20 dark:border-rose-900 dark:text-rose-400";
                    lineClass = "bg-rose-400";
                  }

                  return (
                    <div key={step.id} className="flex flex-col items-center text-center relative z-10">
                      {/* Connection Line */}
                      {idx < 4 && (
                        <div className="absolute top-4.5 left-1/2 w-full h-0.5 -z-10" style={{ left: "50%", right: "-50%" }}>
                          <div className={`h-full ${lineClass} transition-colors duration-300`} />
                        </div>
                      )}
                      
                      {/* Step Indicator Dot/Icon */}
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold ${colorClass} transition-all duration-300 shadow-xs`}>
                        {stepStatus === "completed" ? "✓" : idx + 1}
                      </div>
                      
                      {/* Step Label */}
                      <span className={`text-[10px] mt-2 block uppercase tracking-wider font-bold ${stepStatus === "active" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-455"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline (Audit Trail) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-3">
                Complaint Audit Trail
              </h3>

              <div className="relative border-l-2 border-slate-100 dark:border-slate-700 pl-6 ml-3 space-y-6 text-xs text-left">
                {complaintDetail.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    {/* Connector Dot */}
                    <span
                      className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center ${
                        event.status === complaintDetail.status
                          ? "bg-emerald-600 ring-4 ring-emerald-50 dark:ring-emerald-950/30"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />

                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white text-xs">
                          {mapStatus(event.status)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(event.created_at).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {event.remarks && (
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
                          {event.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Transparency Section */}
            {statusMapped === "Resolved" && resolutionDetail && (
              <div className="space-y-8">
                
                {/* Government Resolution Report */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-3">
                    Government Resolution Report
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 block mb-0.5">
                          Department Responsible
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {resolutionDetail.department}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">
                          Assigned Officer
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {resolutionDetail.officer_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">
                          Resolution Date
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {new Date(
                            resolutionDetail.date_resolved
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 block mb-0.5">
                          Resolution Summary
                        </span>
                        <p className="text-slate-650 dark:text-slate-350">
                          {resolutionDetail.summary}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">
                          Work Details & Actions performed
                        </span>
                        <p className="text-slate-650 dark:text-slate-350">
                          {resolutionDetail.actions}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence Images */}
                {(resolutionDetail.before_image_url || resolutionDetail.after_image_url || (complaintDetail.attachments && complaintDetail.attachments.length > 0)) && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-3">
                      Resolution Evidence (Before vs After)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Before Image */}
                      {(resolutionDetail.before_image_url || (complaintDetail.attachments && complaintDetail.attachments.length > 0)) && (
                        <div className="space-y-2 text-center">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Before (Citizen Submission)
                          </span>
                          <div className="h-56 relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100">
                            <img
                              src={resolutionDetail.before_image_url || complaintDetail.attachments[0].public_url}
                              alt="Before Cleanup"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* After Image */}
                      {resolutionDetail.after_image_url && (
                        <div className="space-y-2 text-center">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            After (Municipal Resolution)
                          </span>
                          <div className="h-56 relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100">
                            <img
                              src={resolutionDetail.after_image_url}
                              alt="After Cleanup"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
}
