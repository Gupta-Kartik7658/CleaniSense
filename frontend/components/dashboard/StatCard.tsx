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
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-3 text-left">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-4.5 w-28" />
      </div>
    );
  }

  const statusColorMap = {
    success: "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400",
    warning: "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400",
    danger: "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-405",
    neutral: "bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-400",
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-2 flex flex-col justify-between text-left transition-colors duration-150">
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
        {label}
      </span>
      <span className="text-3xl font-extrabold text-slate-800 dark:text-white leading-none">
        {value}
      </span>
      {change && (
        <span
          className={`inline-block self-start text-[9px] font-bold px-2 py-0.5 rounded border ${statusColorMap[statusType]}`}
        >
          {change}
        </span>
      )}
    </div>
  );
}
