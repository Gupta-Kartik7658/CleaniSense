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
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Complaint Map
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Your reports on OpenStreetMap — clusters form within 50 meters
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
