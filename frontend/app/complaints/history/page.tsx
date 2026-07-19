"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import Link from "next/link";
import { useComplaints } from "@/hooks/useComplaints";
import { useAuth } from "@/providers/AuthProvider";

type FilterType = "All" | "Under Review" | "Approved" | "Resolved" | "Rejected";

export default function ComplaintsHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");

  const { complaintsData, fetchHistory, loading, error } = useComplaints();

  // Fetch ALL complaints once auth is ready
  useEffect(() => {
    if (authLoading || !user) return;
    const controller = new AbortController();
    fetchHistory({ page: 1, page_size: 200 }, controller.signal);
    return () => { controller.abort(); };
  }, [user, authLoading, fetchHistory]);

  const mapStatus = (status: string, severityScore?: number): "Under Review" | "Resolved" | "Rejected" | "Approved" | "No Pollution Detected" => {
    const lower = (status || "").toLowerCase();
    if (lower === "no_pollution_detected" || (severityScore !== undefined && severityScore !== null && severityScore < 20)) {
      return "No Pollution Detected";
    }
    if (lower === "resolved") return "Resolved";
    if (lower === "rejected") return "Rejected";
    if (
      lower === "municipality_accepted" ||
      lower === "officer_assigned" ||
      lower === "in_progress" ||
      lower === "inspection_completed"
    )
      return "Approved";
    return "Under Review";
  };

  // Map all items once
  const allReports = useMemo(
    () =>
      (complaintsData?.items ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        status: mapStatus(r.status, r.severity_score),
        rawStatus: r.status,
        description: r.description || "",
        shortDescription: r.short_description || "",
        resolutionSummary: r.resolution?.summary || r.resolution_summary || "",
        resolutionActions: r.resolution?.actions || r.resolution_actions || "",
        assignedOfficer: r.assigned_officer || r.resolution?.officer_name || r.officer_name || "",
        locationName: r.location_name || "",
        latitude: r.latitude,
        longitude: r.longitude,
        date: r.created_at,
        category: r.category ? r.category.name : "Other",
        severity: r.severity
          ? r.severity.charAt(0).toUpperCase() + r.severity.slice(1)
          : "Medium",
        severityScore: r.severity_score,
      })),
    [complaintsData]
  );

  // Filter & search entirely client-side — instant, no loading flicker
  const filteredReports = useMemo(() => {
    return allReports.filter((r) => {
      const matchesFilter = filter === "All" || r.status === filter;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (r.title || "").toLowerCase().includes(term) ||
        (r.id || "").toLowerCase().includes(term) ||
        (r.locationName || "").toLowerCase().includes(term) ||
        (r.description || "").toLowerCase().includes(term) ||
        (r.shortDescription || "").toLowerCase().includes(term) ||
        (r.resolutionSummary || "").toLowerCase().includes(term) ||
        (r.resolutionActions || "").toLowerCase().includes(term) ||
        (r.assignedOfficer || "").toLowerCase().includes(term) ||
        (r.category || "").toLowerCase().includes(term) ||
        (r.severity || "").toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [allReports, filter, search]);

  const TABS: FilterType[] = ["All", "Under Review", "Approved", "Resolved", "Rejected"];

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-4xl mx-auto text-left">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Complaint History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track and review all your submitted environmental reports
            </p>
          </div>
          <Link
            href="/complaints"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm text-xs cursor-pointer"
          >
            Report New Issue
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <input
              type="text"
              placeholder="Search by ID, title, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Filter Tabs — client-side, instant switching */}
          <div className="md:col-span-7 flex flex-wrap gap-1 text-[10px]">
            {TABS.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-2 px-3 rounded-lg border font-bold cursor-pointer transition-all ${
                  filter === status
                    ? "border-emerald-600 bg-emerald-50/10 text-emerald-700 dark:text-emerald-400"
                    : "border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                }`}
              >
                {status}
                {/* Show count badge when a tab is active */}
                {filter === status && status !== "All" && (
                  <span className="ml-1 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {filteredReports.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Listing — show spinner if loading OR data not yet fetched (e.g. initial abort) */}
        {(loading || complaintsData === null) ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center py-20 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-emerald-600 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading history...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center py-20">
            <span className="text-3xl block mb-2">📁</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              No complaints found{filter !== "All" ? ` with status "${filter}"` : ""}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">
                      #{report.id.substring(0, 8)}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">
                      {report.title}
                    </h4>
                    <StatusBadge status={report.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <p>
                      <span className="text-slate-400">🏷️</span> Category:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {report.category}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">📍</span> {report.locationName}
                    </p>
                    <p>
                      <span className="text-slate-400">👮</span> Officer:{" "}
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {report.assignedOfficer || "None"}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">⚠️</span> Severity:{" "}
                      <span
                        className={`font-semibold ${
                          report.severity === "High" || report.severity === "Critical"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {report.severityScore !== undefined && report.severityScore !== null
                          ? `${Math.round(report.severityScore)}% ${report.severity}`
                          : report.severity}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">📅</span> Submitted:{" "}
                      <span className="font-medium">
                        {new Date(report.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <Link
                    href={`/complaints/${report.id}`}
                    className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer block text-center w-full sm:w-auto"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
