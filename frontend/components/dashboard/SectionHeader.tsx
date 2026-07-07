import React from "react";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  actionLabel = "View All",
  onAction,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3 border-b border-[color:var(--line)] pb-3">
      <div className="space-y-1">
        <p className="metric-label">Live Section</p>
        <h3 className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
          {title}
        </h3>
      </div>
      {onAction && (
        <button onClick={onAction} className="ghost-action text-sm">
          {actionLabel}
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
