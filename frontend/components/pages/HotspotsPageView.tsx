"use client";

import React from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { HotspotResponse } from "@/types/hotspot";

interface HotspotsPageViewProps {
  coords: { latitude: number; longitude: number } | null;
  loadingLocation: boolean;
  hotspots: HotspotResponse[];
  activeHotspot: HotspotResponse | null;
  loading: boolean;
  error: string | null;
  severityFilter: "all" | "high" | "medium" | "low";
  setSeverityFilter: React.Dispatch<React.SetStateAction<"all" | "high" | "medium" | "low">>;
  onSelectHotspot: (id: string) => void;
}

const hotspotFilters = ["all", "high", "medium", "low"] as const;

function toneForSeverity(severity: string) {
  const normalized = severity.toLowerCase();
  if (normalized === "high") return "pill-badge tone-danger";
  if (normalized === "medium") return "pill-badge tone-warn";
  return "pill-badge tone-success";
}

export function HotspotsPageView({
  coords,
  loadingLocation,
  hotspots,
  activeHotspot,
  loading,
  error,
  severityFilter,
  setSeverityFilter,
  onSelectHotspot,
}: HotspotsPageViewProps) {
  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl space-y-6 text-left">
        <div className="hero-card">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)] lg:items-end">
            <div className="space-y-4">
              <p className="page-kicker">Active Hotspots</p>
              <h1 className="page-title text-3xl sm:text-4xl">Review pollution clusters already flagged around the user location.</h1>
              <p className="page-copy max-w-2xl">
                This view is tied to the hotspot API and can use browser coordinates to narrow the response.
                The map surface is kept lightweight for now, while the list and detail panel stay grounded in the available data.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="metric-card">
                <p className="metric-label">Visible Hotspots</p>
                <p className="metric-value">{loading ? "..." : hotspots.length}</p>
                <p className="metric-note">Filtered result count from the current query.</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Location</p>
                <p className="metric-value">{loadingLocation ? "Syncing" : coords ? "Nearby" : "Global"}</p>
                <p className="metric-note">Uses browser coordinates when available.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="metric-label">Severity Filter</p>
              <p className="text-sm text-[color:var(--ink-soft)]">Limit the hotspot list to one severity band when needed.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotspotFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSeverityFilter(filter)}
                  className={severityFilter === filter ? "pill-badge tone-success" : "pill-badge"}
                >
                  {filter === "all" ? "All" : `${filter.charAt(0).toUpperCase()}${filter.slice(1)}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? <div className="note-danger">{error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
          <div className="section-card relative min-h-[420px] overflow-hidden">
            <div className="topo-grid absolute inset-0 opacity-80" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="space-y-3">
                <p className="metric-label">Map Surface</p>
                <h2 className="text-2xl font-semibold text-[color:var(--ink-strong)]">Map-ready cluster view</h2>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  This panel stays intentionally simple until the richer map layer is finalized, but it already
                  reflects live hotspot results and the current user-centered query state.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-5">
                  <p className="metric-label">Query Center</p>
                  <p className="mt-3 text-sm text-[color:var(--ink-soft)]">
                    {coords
                      ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                      : "No browser coordinates available"}
                  </p>
                </div>
                <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-5">
                  <p className="metric-label">Selected Hotspot</p>
                  <p className="mt-3 text-sm text-[color:var(--ink-soft)]">
                    {activeHotspot ? activeHotspot.title : "Choose one from the list"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="section-card">
              <p className="metric-label">Hotspot List</p>
              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="flex min-h-[160px] items-center justify-center">
                    <div className="space-y-3 text-center">
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--line)] border-t-[color:var(--brand-strong)]" />
                      <p className="text-sm font-medium text-[color:var(--ink-soft)]">Loading hotspots...</p>
                    </div>
                  </div>
                ) : hotspots.length === 0 ? (
                  <p className="text-sm text-[color:var(--ink-soft)]">No hotspots are available for the current filter.</p>
                ) : (
                  hotspots.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      type="button"
                      onClick={() => onSelectHotspot(hotspot.id)}
                      className={`w-full rounded-[28px] border px-4 py-4 text-left transition ${
                        activeHotspot?.id === hotspot.id
                          ? "border-[color:var(--brand-strong)] bg-[color:var(--surface)] shadow-[0_18px_32px_-28px_rgba(44,95,74,0.6)]"
                          : "border-[color:var(--line)] bg-[color:var(--surface-muted)] hover:bg-[color:var(--surface)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--ink-strong)]">{hotspot.title}</p>
                          <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{hotspot.description}</p>
                        </div>
                        <span className={toneForSeverity(hotspot.severity)}>{hotspot.severity}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="section-card">
              <p className="metric-label">Hotspot Detail</p>
              {activeHotspot ? (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={toneForSeverity(activeHotspot.severity)}>{activeHotspot.severity}</span>
                    <span className={activeHotspot.is_active ? "pill-badge tone-success" : "pill-badge"}>
                      {activeHotspot.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[color:var(--ink-strong)]">{activeHotspot.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{activeHotspot.description}</p>
                  </div>
                  <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                    <p className="metric-label">Coordinates</p>
                    <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                      {activeHotspot.latitude.toFixed(4)}, {activeHotspot.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[color:var(--ink-soft)]">
                  Select a hotspot from the list to review its current detail.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
