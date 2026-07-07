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
    <div className="section-card mx-auto my-6 flex max-w-sm flex-col items-center justify-center space-y-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] text-lg font-semibold text-[color:var(--accent)]">
        00
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-[color:var(--foreground)]">
          {title}
        </h4>
        <p className="fine-print">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="primary-action"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
