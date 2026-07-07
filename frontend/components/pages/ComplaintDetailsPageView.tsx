"use client";

import React from "react";
import Link from "next/link";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ComplaintDetailResponse, ResolutionResponse } from "@/types/complaint";

interface ComplaintDetailsPageViewProps {
  authLoading: boolean;
  loading: boolean;
  error: string | null;
  complaintDetail: ComplaintDetailResponse | null;
  resolutionDetail: ResolutionResponse | null;
}

function mapStatus(status: string): "Pending" | "Under Review" | "Resolved" | "Rejected" {
  const lower = status.toLowerCase();
  if (lower === "submitted" || lower === "draft") return "Pending";
  if (lower === "resolved") return "Resolved";
  if (lower === "rejected") return "Rejected";
  return "Under Review";
}

export function ComplaintDetailsPageView({
  authLoading,
  loading,
  error,
  complaintDetail,
  resolutionDetail,
}: ComplaintDetailsPageViewProps) {
  const statusMapped = complaintDetail ? mapStatus(complaintDetail.status) : "Pending";
  const severityMapped = complaintDetail?.severity
    ? complaintDetail.severity.charAt(0).toUpperCase() + complaintDetail.severity.slice(1)
    : "Medium";

  return (
    <PortalLayout>
      <div className="mx-auto max-w-5xl space-y-6 text-left">
        <div className="flex items-center justify-between gap-4">
          <Link href="/complaints/history" className="ghost-action">
            Back to History
          </Link>
          <Link href="/complaints" className="secondary-action">
            New Complaint
          </Link>
        </div>

        {authLoading || loading ? (
          <div className="section-card flex min-h-[280px] items-center justify-center">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--line)] border-t-[color:var(--brand-strong)]" />
              <p className="text-sm font-medium text-[color:var(--ink-soft)]">Loading complaint details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="note-danger">{error}</div>
        ) : !complaintDetail ? (
          <div className="section-card text-center">
            <p className="text-lg font-semibold text-[color:var(--ink-strong)]">Complaint not found.</p>
          </div>
        ) : (
          <>
            <div className="hero-card">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="pill-badge">#{complaintDetail.id.slice(0, 8)}</span>
                    <StatusBadge status={statusMapped} />
                    <span className={severityMapped === "High" ? "pill-badge tone-danger" : severityMapped === "Low" ? "pill-badge tone-success" : "pill-badge tone-warn"}>
                      {severityMapped} Severity
                    </span>
                  </div>
                  <div>
                    <p className="page-kicker">Complaint Detail</p>
                    <h1 className="page-title text-3xl">{complaintDetail.title}</h1>
                    <p className="page-copy mt-3 max-w-3xl">{complaintDetail.description}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="metric-card">
                    <p className="metric-label">Category</p>
                    <p className="metric-value text-2xl">{complaintDetail.category?.name || "Other"}</p>
                    <p className="metric-note">Complaint classification from the backend.</p>
                  </div>
                  <div className="metric-card">
                    <p className="metric-label">Municipality</p>
                    <p className="metric-value text-2xl">{complaintDetail.municipality?.name || "Pending"}</p>
                    <p className="metric-note">Responsible authority for the current case.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
              <div className="space-y-6">
                <div className="section-card">
                  <p className="metric-label">Location</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                      <p className="text-sm font-semibold text-[color:var(--ink-strong)]">Reported Place</p>
                      <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{complaintDetail.location_name}</p>
                    </div>
                    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                      <p className="text-sm font-semibold text-[color:var(--ink-strong)]">Coordinates</p>
                      <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                        {complaintDetail.latitude.toFixed(4)}, {complaintDetail.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="section-card">
                  <p className="metric-label">Audit Trail</p>
                  <div className="mt-5 space-y-4">
                    {complaintDetail.timeline.map((event) => (
                      <div key={event.id} className="timeline-rail items-start rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                        <div className={event.status === complaintDetail.status ? "timeline-node timeline-node-active" : "timeline-node"}>
                          {event.status === complaintDetail.status ? "!" : ""}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm font-semibold text-[color:var(--ink-strong)]">{mapStatus(event.status)}</p>
                            <p className="text-sm text-[color:var(--ink-soft)]">
                              {new Date(event.created_at).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <p className="text-sm text-[color:var(--ink-soft)]">{event.remarks || "No remarks added for this step."}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="section-card">
                  <p className="metric-label">Attachments</p>
                  <div className="mt-5 space-y-3">
                    {complaintDetail.attachments.length === 0 ? (
                      <p className="text-sm text-[color:var(--ink-soft)]">No evidence files were attached to this complaint.</p>
                    ) : (
                      complaintDetail.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4 transition hover:bg-[color:var(--surface)]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[color:var(--ink-strong)]">{attachment.file_name}</p>
                            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                              {attachment.file_type} • {(attachment.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <span className="ghost-action">Open</span>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="section-card">
                  <p className="metric-label">Submitted</p>
                  <p className="mt-3 text-lg font-semibold text-[color:var(--ink-strong)]">
                    {new Date(complaintDetail.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    This complaint remains available in the citizen history view until resolution.
                  </p>
                </div>

                {statusMapped === "Resolved" && resolutionDetail ? (
                  <div className="section-card">
                    <p className="metric-label">Resolution Report</p>
                    <div className="mt-4 space-y-4 text-sm text-[color:var(--ink-soft)]">
                      <div>
                        <p className="font-semibold text-[color:var(--ink-strong)]">Department</p>
                        <p className="mt-1">{resolutionDetail.department}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[color:var(--ink-strong)]">Officer</p>
                        <p className="mt-1">{resolutionDetail.officer_name}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[color:var(--ink-strong)]">Summary</p>
                        <p className="mt-1">{resolutionDetail.summary}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[color:var(--ink-strong)]">Actions Taken</p>
                        <p className="mt-1">{resolutionDetail.actions}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[color:var(--ink-strong)]">Resolved On</p>
                        <p className="mt-1">
                          {new Date(resolutionDetail.date_resolved).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </aside>
            </div>

            {statusMapped === "Resolved" && resolutionDetail && (resolutionDetail.before_image_url || resolutionDetail.after_image_url) ? (
              <div className="section-card">
                <p className="metric-label">Resolution Evidence</p>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  {resolutionDetail.before_image_url ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[color:var(--ink-strong)]">Before</p>
                      <div className="overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface-muted)]">
                        <img
                          src={resolutionDetail.before_image_url}
                          alt="Before resolution"
                          className="h-72 w-full object-cover"
                        />
                      </div>
                    </div>
                  ) : null}
                  {resolutionDetail.after_image_url ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[color:var(--ink-strong)]">After</p>
                      <div className="overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface-muted)]">
                        <img
                          src={resolutionDetail.after_image_url}
                          alt="After resolution"
                          className="h-72 w-full object-cover"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PortalLayout>
  );
}
