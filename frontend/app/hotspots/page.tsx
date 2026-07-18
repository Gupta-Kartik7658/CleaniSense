"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/common/Skeleton";

const ComplaintLeafletMap = dynamic(
  () => import("@/components/dashboard/ComplaintLeafletMap").then((mod) => mod.ComplaintLeafletMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[450px] w-full rounded-2xl" />,
  }
);

export default function HotspotsPage() {
  const { coords, loading: loadingLocation } = useCurrentLocation();
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [singles, setSingles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadSystemHotspots();
  }, []);

  const loadSystemHotspots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/admin/hotspots');
      const data = res?.data || res || {};
      const hList = (data.hotspots || []).map((h: any) => ({
        id: String(h.id),
        latitude: Number(h.center?.latitude || h.latitude),
        longitude: Number(h.center?.longitude || h.longitude),
        count: Number(h.incidentCount || h.count || 2),
        radius_meters: Number(h.radius || h.radius_meters || 50.0),
        city: String(h.center?.city || 'Local Region'),
        district: String(h.center?.district || 'Incident Zone'),
        dominant_category: String(h.dominantType || 'General'),
        averageSeverity: Number(h.averageSeverity || 3.5),
        complaints: h.complaints || [],
        categories_present: h.categories_present || [h.dominantType || 'General'],
        category_counts: h.category_counts || {}
      }));
      setHotspots(hList);
      setSingles(data.singles || []);
    } catch (e: any) {
      console.error('Failed to load system hotspots:', e);
      setError('Could not retrieve hotspot clusters.');
    } finally {
      setLoading(false);
    }
  };

  // Filter hotspots dynamically based on selected category pill
  const filteredHotspotsList = useMemo(() => {
    if (selectedCategory === "all") return hotspots;
    const sel = selectedCategory.toLowerCase();
    return hotspots.filter((h) => {
      const dom = (h.dominant_category || "").toLowerCase();
      const catsPresent = (h.categories_present || []).map((c: string) => c.toLowerCase());
      if (sel === "land") {
        return dom.includes("land") || dom.includes("waste") || dom.includes("garbage") ||
          catsPresent.some((c: string) => c.includes("land") || c.includes("waste") || c.includes("garbage"));
      }
      return dom.includes(sel) || catsPresent.some((c: string) => c.includes(sel));
    });
  }, [hotspots, selectedCategory]);

  const mapData = useMemo(() => {
    return {
      singles: singles.map((s) => ({
        id: s.id,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        title: s.title || 'Incident Report',
        status: s.status || 'submitted',
        location_name: s.location_name || 'Coordinates Verified'
      })),
      hotspots: filteredHotspotsList.map((h) => ({
        id: h.id,
        latitude: h.latitude,
        longitude: h.longitude,
        count: h.count || 2,
        radius_meters: h.radius_meters || 50.0,
        complaint_ids: h.complaints.map((c: any) => c.id),
        complaints: h.complaints || [],
        dominant_category: h.dominant_category,
        categories_present: h.categories_present || [],
        category_counts: h.category_counts || {}
      })),
      total_complaints: hotspots.reduce((acc, curr) => acc + (curr.count || 1), 0),
      hotspot_radius_meters: 50.0
    };
  }, [hotspots, filteredHotspotsList, singles]);

  const getSeverityStyle = (sev?: string) => {
    const s = (sev || "medium").toLowerCase();
    if (s === "high" || s === "critical") {
      return "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400";
    }
    if (s === "medium" || s === "moderate") {
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
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "Combined (All)" },
              { id: "air", label: "Air" },
              { id: "water", label: "Water" },
              { id: "land", label: "Land / Waste" },
              { id: "noise", label: "Noise" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedCategory(t.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                  selectedCategory === t.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loadingLocation && (
          <p className="text-[10px] text-emerald-600 font-semibold italic animate-pulse">
            📍 Customizing hotspot search based on live GPS coordinates...
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Interactive OpenStreetMap Canvas */}
          <div className="lg:col-span-2 space-y-2">
            <ComplaintLeafletMap mapData={mapData} height="450px" />
            {selectedCategory !== "all" && filteredHotspotsList.length === 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center justify-between">
                <span>
                  No active <strong>{selectedCategory.toUpperCase()}</strong> pollution hotspots found in system.
                </span>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="text-[10px] font-bold underline cursor-pointer"
                >
                  Show Combined (All) Hotspots
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Hotspots List */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col h-[450px]">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 uppercase tracking-widest shrink-0 flex items-center justify-between">
              <span>Hotspot List ({filteredHotspotsList.length})</span>
              {selectedCategory !== "all" && (
                <span className="text-[10px] text-emerald-600 font-bold capitalize">Filter: {selectedCategory}</span>
              )}
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
              ) : filteredHotspotsList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                    No hotspots match {selectedCategory.toUpperCase()} filter criteria.
                  </p>
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-bold underline"
                  >
                    View All Hotspots
                  </button>
                </div>
              ) : (
                filteredHotspotsList.map((h, index) => {
                  const latitude = Number(h.latitude);
                  const longitude = Number(h.longitude);
                  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

                  return (
                    <div
                      key={h.id || `hotspot-${index}`}
                      className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight">
                          {h.city || 'Local Region'} Hotspot Zone #{index + 1}
                        </h4>
                        <span className={`text-[9px] font-bold py-0.5 px-2 rounded-md border shrink-0 uppercase tracking-wider ${getSeverityStyle(h.dominant_category)}`}>
                          {h.dominant_category || "Medium"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span>🚨 {h.count || 2} Clustered Reports</span>
                        <span>Radius: {h.radius_meters || 50}m</span>
                      </div>

                      {hasCoordinates && (
                        <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                          📍 {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </PortalLayout>
  );
}
