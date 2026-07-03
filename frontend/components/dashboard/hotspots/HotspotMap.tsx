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
    <div className="h-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between p-4 shadow-sm text-left transition-colors duration-150">
      {/* Coordinate Grid Texture */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] [background-size:16px_16px]"></div>

      {/* Mock Map Pins representing coordinates */}
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
              <span className="text-xl">📍</span>
              <span className="bg-rose-50/95 dark:bg-rose-950/90 text-rose-800 dark:text-rose-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-rose-250 dark:border-rose-900 shadow-sm whitespace-nowrap">
                {item.title.split(" ")[0]}
              </span>
            </div>
          );
        })}

      <div className="z-10 flex justify-between items-start">
        <span className="bg-emerald-50 text-emerald-800 border-emerald-150 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-widest shadow-sm">
          Active Map Grid
        </span>
        <span className="bg-slate-900 dark:bg-slate-950 text-white text-[9px] font-semibold px-2 py-0.5 rounded">
          Ahmedabad Corporation
        </span>
      </div>

      <div className="z-10 text-[9px] text-slate-400 bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg border border-slate-205/50 dark:border-slate-700/50 shadow-sm max-w-[240px]">
        Geospatial tracking engine active. Markers represent verified pollution
        clusters.
      </div>
    </div>
  );
}
