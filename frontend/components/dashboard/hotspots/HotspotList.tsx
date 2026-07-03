import React from "react";
import { HotspotItem } from "../../../types/dashboard";
import { Skeleton } from "../../common/Skeleton";

interface HotspotListProps {
  hotspots?: HotspotItem[];
  loading?: boolean;
}

export function HotspotList({ hotspots, loading = false }: HotspotListProps) {
  if (loading) {
    return (
      <div className="space-y-3 pt-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!hotspots || hotspots.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-450 dark:text-slate-500">
        No hotspots identified in your immediate vicinity.
      </div>
    );
  }

  const priorityColors = {
    High: "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400",
    Medium: "bg-amber-50 border-amber-100 text-amber-805 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400",
    Low: "bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400",
  };

  return (
    <div className="space-y-3 pt-2">
      {hotspots.map((item) => (
        <div
          key={item.id}
          className="flex justify-between items-center p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors duration-150"
        >
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>📏</span>
              <span>
                Distance: {item.distance} • ({item.reportsCount} reports)
              </span>
            </p>
          </div>
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
              priorityColors[item.priority] || priorityColors.Low
            }`}
          >
            {item.priority} Priority
          </span>
        </div>
      ))}
    </div>
  );
}
