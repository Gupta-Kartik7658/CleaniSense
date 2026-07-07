"use client";

import React from "react";
import Link from "next/link";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export interface ComplaintHistoryRow {
  id: string;
  title: string;
  status: "Pending" | "Under Review" | "Resolved" | "Rejected";
  locationName: string;
  date: string;
  category: string;
  severity: string;
}

interface ComplaintsHistoryPageViewProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  filter: "All" | "Pending" | "Under Review" | "Resolved" | "Rejected";
  setFilter: React.Dispatch<React.SetStateAction<"All" | "Pending" | "Under Review" | "Resolved" | "Rejected">>;
  loading: boolean;
  error: string | null;
  total: number;
  filteredReports: ComplaintHistoryRow[];
}

const filters = ["All", "Pending", "Under Review", "Resolved", "Rejected"] as const;

export function ComplaintsHistoryPageView({
  search,
  setSearch,
  filter,
  setFilter,
  loading,
  error,
  total,
  filteredReports,
}: ComplaintsHistoryPageViewProps) {
  return (
    <PortalLayout>
      <div className="mx-auto max-w-5xl space-y-6 text-left">
        <div className="hero-card">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.6fr)] lg:items-end">
            <div className="space-y-4">
              <p className="page-kicker">Complaint History</p>
              <h1 className="page-title text-3xl sm:text-4xl">Track every report you have already submitted.</h1>
              <p className="page-copy max-w-2xl">
                Search by title, ID, or location and narrow the list by complaint status. Each detail page
                preserves the audit trail and any final resolution information.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="metric-card">
                <p className="metric-label">Visible Reports</p>
                <p className="metric-value">{loading ? "..." : filteredReports.length}</p>
                <p className="metric-note">Rows currently shown after filtering.</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Fetched Total</p>
                <p className="metric-value">{loading ? "..." : total}</p>
                <p className="metric-note">Current response size from the complaint API.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="field-group">
              <label className="field-label">Search Reports</label>
              <input
                type="text"
                placeholder="Search by complaint ID, title, or location"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="field-input"
              />
            </div>

            <Link href="/complaints" className="primary-action">
              Report New Issue
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={filter === status ? "pill-badge tone-success" : "pill-badge"}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="section-card flex min-h-[240px] items-center justify-center">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--line)] border-t-[color:var(--brand-strong)]" />
              <p className="text-sm font-medium text-[color:var(--ink-soft)]">Loading complaint history...</p>
            </div>
          </div>
        ) : error ? (
          <div className="note-danger">{error}</div>
        ) : filteredReports.length === 0 ? (
          <div className="section-card text-center">
            <p className="text-lg font-semibold text-[color:var(--ink-strong)]">No complaints match the current filters.</p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Try a different status or search term, or create a fresh complaint from the citizen portal.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <article key={report.id} className="section-card">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="pill-badge">#{report.id.slice(0, 8)}</span>
                      <StatusBadge status={report.status} />
                      <span className={report.severity === "High" ? "pill-badge tone-danger" : report.severity === "Low" ? "pill-badge tone-success" : "pill-badge tone-warn"}>
                        {report.severity} Severity
                      </span>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-[color:var(--ink-strong)]">{report.title}</h2>
                      <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{report.locationName}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                        <p className="metric-label">Category</p>
                        <p className="mt-2 text-sm font-medium text-[color:var(--ink-strong)]">{report.category}</p>
                      </div>
                      <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                        <p className="metric-label">Submitted</p>
                        <p className="mt-2 text-sm font-medium text-[color:var(--ink-strong)]">
                          {new Date(report.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                        <p className="metric-label">Current State</p>
                        <p className="mt-2 text-sm font-medium text-[color:var(--ink-strong)]">{report.status}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link href={`/complaints/${report.id}`} className="primary-action">
                      Open Details
                    </Link>
                    <Link href="/complaints" className="ghost-action">
                      Submit Another
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
