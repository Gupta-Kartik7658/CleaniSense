"use client";

import React, { useEffect } from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { useHotspots } from "@/hooks/useHotspots";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

export default function HotspotsPage() {
  const { coords, loading: loadingLocation } = useCurrentLocation();
  const { hotspots, fetchHotspots, loading, error } = useHotspots();

  useEffect(() => {
    const controller = new AbortController();
    
    // Call fetchHotspots with coordinates if available, or fetch overall hotspots
    fetchHotspots(
      coords?.latitude || undefined,
      coords?.longitude || undefined,
      5.0, // radius_km
      undefined, // severity
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [coords, fetchHotspots]);

  const getSeverityStyle = (sev: string) => {
    const s = sev.toLowerCase();
    if (s === "high") {
      return "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400";
    }
    if (s === "medium") {
      return "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400";
    }
    return "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-450";
  };

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-7xl mx-auto p-4 text-left">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Active Hotspots
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review environmental pollution cluster zones flagged by municipal authorities
            </p>
          </div>
          <span className="inline-block self-start text-xs bg-emerald-50 text-emerald-800 border border-emerald-150 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900 py-1.5 px-3.5 rounded-full font-bold">
            Geospatial Clustering Active
          </span>
        </div>

        {loadingLocation && (
          <p className="text-[10px] text-emerald-600 font-semibold italic animate-pulse">
            📍 Customizing hotspot search based on live GPS coordinates...
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Map Placeholder */}
          <div className="lg:col-span-2 h-[450px] bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 p-8 text-center relative overflow-hidden">
            {/* Visual Grid Backdrop */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative space-y-2 z-10">
              <span className="text-4xl block">🗺️</span>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-white">Proximity Hotspots Map</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-sm">
                Leaflet/OSM vector tile interface. Map layers show red zone pins corresponding to the list severity ranges.
              </p>
              {coords && (
                <p className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                  Center GPS: {coords.latitude.toFixed(4)}° N, {coords.longitude.toFixed(4)}° E
                </p>
              )}
            </div>
          </div>

          {/* Right Panel: Hotspots List */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col h-[450px]">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 uppercase tracking-widest shrink-0">
              Hotspot List
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <svg className="animate-spin h-6 w-8 text-emerald-600 mb-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-[10px] text-slate-500">Loading clusters...</p>
                </div>
              ) : error ? (
                <p className="text-[10px] text-rose-600 font-semibold text-center py-10">⚠️ {error}</p>
              ) : hotspots.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold text-center py-12 leading-relaxed">
                  No hotspots detected in your surrounding ward region.
                </p>
              ) : (
                hotspots.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight">
                        {h.title}
                      </h4>
                      <span className={`text-[9px] font-bold py-0.5 px-2 rounded-md border shrink-0 uppercase tracking-wider ${getSeverityStyle(h.severity)}`}>
                        {h.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {h.description}
                    </p>
                    <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                      📍 {h.latitude.toFixed(4)}° N, {h.longitude.toFixed(4)}° E
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </PortalLayout>
  );
}
