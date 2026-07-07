import React from "react";
import { Skeleton } from "../../common/Skeleton";
import { HotspotItem } from "../../../types/dashboard";

interface HotspotMapProps {
  hotspots?: HotspotItem[];
  loading?: boolean;
}

export function HotspotMap({ hotspots, loading = false }: HotspotMapProps) {
  if (loading) {
    return (
      <Skeleton className="h-64 w-full rounded-2xl border border-slate-200 dark:border-slate-800" />
    );
  }

  return (
    <div className="topo-grid relative flex h-64 flex-col justify-between overflow-hidden rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-left">
      {hotspots &&
        hotspots.map((item, idx) => {
          const positions = [
            { top: "30%", left: "25%" },
            { top: "65%", left: "70%" },
            { top: "45%", left: "55%" },
          ];
          const pos = positions[idx % positions.length];

          return (
            <div
              key={item.id}
              style={{ top: pos.top, left: pos.left }}
              className="absolute z-10 flex items-center gap-1 -translate-x-1/2 -translate-y-1/2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--foreground)] text-xs font-semibold text-[color:var(--surface-strong)] shadow-sm">
                {idx + 1}
              </span>
              <span className="whitespace-nowrap rounded-full bg-[color:var(--surface)] px-2 py-1 text-[0.62rem] font-semibold text-[color:var(--foreground)] shadow-sm">
                {item.title.split(" ")[0]}
              </span>
            </div>
          );
        })}

      <div className="z-10 flex items-start justify-between">
        <span className="pill-badge tone-accent">
          Active Map Grid
        </span>
        <span className="pill-badge">
          Ahmedabad Corporation
        </span>
      </div>

      <div className="z-10 max-w-[240px] rounded-[16px] border border-[color:var(--line)] bg-[color:var(--surface)] p-3 text-[0.72rem] leading-5 text-[color:var(--foreground-soft)]">
        Geospatial tracking engine active. Markers represent verified pollution
        clusters.
      </div>
    </div>
  );
}
