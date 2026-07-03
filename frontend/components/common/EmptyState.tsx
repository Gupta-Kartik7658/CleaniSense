import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 max-w-sm mx-auto my-6 space-y-4">
      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-450 text-xl">
        ℹ️
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-150 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
