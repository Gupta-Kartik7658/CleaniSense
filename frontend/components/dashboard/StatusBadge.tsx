import React from "react";

interface StatusBadgeProps {
  status: "Under Review" | "Resolved" | "Rejected" | "Approved";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const badgeColors: Record<string, string> = {
    "Under Review": "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/70 dark:text-amber-400",
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
