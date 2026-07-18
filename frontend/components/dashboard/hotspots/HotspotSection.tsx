"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "../SectionHeader";
import { HotspotMap } from "./HotspotMap";
import { HotspotList } from "./HotspotList";
import { HotspotItem, ComplaintMapData, ComplaintHotspotCluster, ComplaintMapPoint } from "../../../types/dashboard";
import { matchesCategoryFilter, filterComplaintsByPollutionType } from "../../../utils/hotspotFilters";

interface HotspotSectionProps {
  hotspots?: HotspotItem[];
  mapData?: ComplaintMapData;
  loading?: boolean;
}

const FILTER_PILLS = [
  { id: "all", label: "All" },
  { id: "air", label: "💨 Air" },
  { id: "water", label: "💧 Water" },
  { id: "land", label: "🗑️ Land/Waste" },
  { id: "noise", label: "📢 Noise" },
];

/** Filter complaint map points (singles) by category_name */
function filterPoints(points: ComplaintMapPoint[], filter: string): ComplaintMapPoint[] {
  if (filter === "all") return points;
  return points.filter((p) =>
    matchesCategoryFilter(p.category_name ?? undefined, filter)
  );
}

/** Filter clusters and adjust count to reflect matching complaints */
function filterClusters(
  clusters: ComplaintHotspotCluster[],
  filter: string
): ComplaintHotspotCluster[] {
  if (filter === "all") return clusters;
  const result: ComplaintHotspotCluster[] = [];
  for (const h of clusters) {
    const domMatches = matchesCategoryFilter(h.dominant_category ?? undefined, filter);
    const matchingComplaints = filterComplaintsByPollutionType(
      (h.complaints || []).map((c) => ({
        category_name: c.category_name ?? undefined,
      })),
      filter
    );
    const filteredCount = matchingComplaints.length > 0
      ? matchingComplaints.length
      : domMatches
      ? h.count
      : 0;

    // Only include if dominant type matches OR at least one complaint matches
    if (filteredCount > 0 || domMatches) {
      result.push({
        ...h,
        count: filteredCount || h.count,
        // Only show matching complaints in popup
        complaints: matchingComplaints.length > 0
          ? h.complaints.filter((c) =>
              matchesCategoryFilter(c.category_name ?? undefined, filter)
            )
          : h.complaints,
      });
    }
  }
  return result;
}

export function HotspotSection({
  hotspots,
  mapData,
  loading = false,
}: HotspotSectionProps) {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredMapData = useMemo((): ComplaintMapData | undefined => {
    if (!mapData) return undefined;
    if (selectedFilter === "all") return mapData;

    const filteredHotspots = filterClusters(mapData.hotspots, selectedFilter);
    const filteredSingles = filterPoints(mapData.singles, selectedFilter);

    return {
      ...mapData,
      hotspots: filteredHotspots,
      singles: filteredSingles,
      total_complaints: filteredHotspots.length + filteredSingles.length,
    };
  }, [mapData, selectedFilter]);

  return (
    <div className="space-y-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm text-left">
      <SectionHeader
        title="Nearby Hotspots"
        actionLabel="Expand →"
        onAction={() => router.push("/hotspots")}
      />

      {/* Pollution Type Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.id}
            onClick={() => setSelectedFilter(pill.id)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-all ${
              selectedFilter === pill.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
            }`}
          >
            {pill.label}
          </button>
        ))}
        {selectedFilter !== "all" && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold self-center ml-1">
            {filteredMapData?.hotspots?.length ?? 0} zone{filteredMapData?.hotspots?.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <HotspotMap mapData={filteredMapData} loading={loading} />
      <HotspotList hotspots={hotspots} loading={loading} />
    </div>
  );
}
