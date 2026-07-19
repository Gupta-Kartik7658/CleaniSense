import React from "react";

interface StatusBadgeProps {
  status: "Submitted" | "Under Review" | "AI Verification Complete" | "Approved" | "Resolved" | "Rejected" | "No Pollution Detected" | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const badgeColors: Record<string, string> = {
    "Submitted": "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400",
    "Under Review": "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/70 dark:text-amber-400",
    "AI Verification Complete": "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/70 dark:text-blue-400",
    "No Pollution Detected": "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-400",
    Resolved: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/70 dark:text-emerald-400",
    Rejected: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/70 dark:text-rose-400",
    Approved: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/70 dark:text-emerald-400",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
        badgeColors[status] || "bg-zinc-100 border-zinc-200 text-zinc-700"
      }`}
    >
      {status}
    </span>
  );
}
