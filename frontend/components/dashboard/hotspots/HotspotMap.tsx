"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "../../common/Skeleton";
import { ComplaintMapData } from "../../../types/dashboard";

const ComplaintLeafletMap = dynamic(
  () =>
    import("../ComplaintLeafletMap").then((mod) => mod.ComplaintLeafletMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-2xl border border-slate-200 dark:border-slate-800" />,
  }
);

interface HotspotMapProps {
  mapData?: ComplaintMapData;
  loading?: boolean;
}

export function HotspotMap({ mapData, loading = false }: HotspotMapProps) {
  if (loading) {
    return (
      <Skeleton className="h-64 w-full rounded-2xl border border-slate-200 dark:border-slate-800" />
    );
  }

  return (
    <div className="w-full relative overflow-hidden transition-colors duration-150 rounded-2xl">
      <ComplaintLeafletMap mapData={mapData} height="260px" />
    </div>
  );
}
