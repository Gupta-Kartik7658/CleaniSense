import React from "react";
import { Skeleton } from "../common/Skeleton";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  statusType?: "success" | "warning" | "neutral" | "danger";
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  change,
  statusType = "neutral",
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="metric-card space-y-3 text-left">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-4.5 w-28" />
      </div>
    );
  }

  const statusColorMap = {
    success: "metric-note note-success",
    warning: "metric-note note-warn",
    danger: "metric-note note-danger",
    neutral: "metric-note note-neutral",
  };

  return (
    <div className="metric-card flex flex-col justify-between space-y-3 text-left">
      <span className="metric-label block">
        {label}
      </span>
      <span className="metric-value">
        {value}
      </span>
      {change && (
        <span className={`inline-block self-start ${statusColorMap[statusType]}`}>
          {change}
        </span>
      )}
    </div>
  );
}
