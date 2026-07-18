"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "../common/Skeleton";
import { ComplaintMapData } from "../../types/dashboard";

const UserComplaintsMap = dynamic(
  () =>
    import("./UserComplaintsMap").then((mod) => mod.UserComplaintsMap),
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
            Registered Incidents Map
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Your registered reports plotted on OpenStreetMap — each with a unique color indicator
          </p>
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      ) : (
        <UserComplaintsMap complaints={mapData?.user_complaints || []} loading={false} />
      )}
    </section>
  );
}
