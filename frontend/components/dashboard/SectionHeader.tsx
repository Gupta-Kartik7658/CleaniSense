import React from "react";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  actionLabel = "View All →",
  onAction,
}: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">
      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight uppercase">
        {title}
      </h3>
      {onAction && (
        <button
          onClick={onAction}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
