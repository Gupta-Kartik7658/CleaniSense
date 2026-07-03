import React from "react";

interface StatusBadgeProps {
  status: "Pending" | "Under Review" | "Resolved" | "Rejected";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const badgeColors = {
    Pending: "bg-slate-150 border-slate-200 text-slate-750",
    "Under Review": "bg-amber-50 border-amber-200 text-amber-800",
    Resolved: "bg-emerald-50 border-emerald-250 text-emerald-800",
    Rejected: "bg-rose-50 border-rose-200 text-rose-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
        badgeColors[status] || badgeColors.Pending
      }`}
    >
      {status}
    </span>
  );
}
