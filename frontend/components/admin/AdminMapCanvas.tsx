"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "../common/Skeleton";
import { AdminHotspotItem, AdminSingleItem } from "./AdminIncidentsLeafletMap";

const AdminIncidentsLeafletMap = dynamic(
  () =>
    import("./AdminIncidentsLeafletMap").then((mod) => mod.AdminIncidentsLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[550px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <p className="text-xs text-slate-400 font-semibold">Loading OpenStreetMap Canvas...</p>
      </div>
    ),
  }
);

interface AdminMapCanvasProps {
  hotspots: AdminHotspotItem[];
  singles?: AdminSingleItem[];
  selectedCity?: string | null;
  selectedHotspotId?: string | null;
  pollutionFilter?: string;
  mapMode?: "vector" | "clusters";
  height?: string;
  onSelectHotspot?: (hotspot: AdminHotspotItem) => void;
}

export function AdminMapCanvas(props: AdminMapCanvasProps) {
  return <AdminIncidentsLeafletMap {...props} />;
}
