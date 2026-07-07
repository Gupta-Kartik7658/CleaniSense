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
          <div key={idx} className="flex items-center justify-between rounded-[20px] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3">
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
      <div className="py-6 text-center text-sm text-[color:var(--foreground-soft)]">
        No hotspots identified in your immediate vicinity.
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    High: "pill-badge tone-danger",
    Medium: "pill-badge tone-warn",
    Low: "pill-badge",
  };

  return (
    <div className="space-y-3 pt-2">
      {hotspots.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-[20px] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3.5 text-left"
        >
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-[color:var(--foreground)]">{item.title}</h4>
            <p className="fine-print">
              Distance: {item.distance} • {item.reportsCount} linked reports
            </p>
            {item.description && <p className="fine-print max-w-[26ch]">{item.description}</p>}
          </div>
          <span className={priorityColors[item.priority] || priorityColors.Low}>{item.priority}</span>
        </div>
      ))}
    </div>
  );
}
