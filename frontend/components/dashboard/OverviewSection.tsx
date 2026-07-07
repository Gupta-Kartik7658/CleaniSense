import React from "react";
import { StatCard } from "./StatCard";
import { StatCardData } from "../../types/dashboard";

interface OverviewSectionProps {
  summary?: StatCardData[];
  loading?: boolean;
}

export function OverviewSection({
  summary,
  loading = false,
}: OverviewSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {loading || !summary
        ? Array.from({ length: 4 }).map((_, idx) => (
            <StatCard key={idx} label="" value="" loading={true} />
          ))
        : summary.map((item, idx) => (
            <StatCard
              key={idx}
              label={item.label}
              value={item.value}
              change={item.change}
              statusType={item.statusType}
              loading={false}
            />
          ))}
    </div>
  );
}
