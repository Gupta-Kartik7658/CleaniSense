import React from "react";

interface StatusBadgeProps {
  status: "Pending" | "Under Review" | "Resolved" | "Rejected";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const badgeColors = {
    Pending: "pill-badge",
    "Under Review": "pill-badge tone-warn",
    Resolved: "pill-badge tone-success",
    Rejected: "pill-badge tone-danger",
  };

  return (
    <span
      className={`inline-flex items-center ${
        badgeColors[status] || badgeColors.Pending
      }`}
    >
      {status}
    </span>
  );
}
