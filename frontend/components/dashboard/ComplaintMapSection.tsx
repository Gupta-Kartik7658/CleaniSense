"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "../common/Skeleton";
import { ComplaintMapData } from "../../types/dashboard";

const ComplaintLeafletMap = dynamic(
  () =>
    import("./ComplaintLeafletMap").then((mod) => mod.ComplaintLeafletMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] w-full rounded-2xl" />,
  }
);

interface ComplaintMapSectionProps {
  mapData?: ComplaintMapData;
  loading?: boolean;
}

export function ComplaintMapSection({ mapData, loading = false }: ComplaintMapSectionProps) {
  return (
    <section className="section-card space-y-4">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="metric-label">Map View</p>
          <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Complaint map
          </h2>
          <p className="fine-print">
            Your reports on OpenStreetMap with 50 meter hotspot clustering
          </p>
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      ) : (
        <ComplaintLeafletMap mapData={mapData} loading={false} />
      )}
    </section>
  );
}
