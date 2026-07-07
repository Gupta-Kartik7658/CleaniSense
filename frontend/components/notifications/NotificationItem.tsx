"use client";

import React from "react";
import { useRouter } from "next/navigation";

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  complaintId: string;
  type:
    | "submitted"
    | "ai_verified"
    | "accepted"
    | "inspection"
    | "info_requested"
    | "resolved"
    | "rejected";
  reason?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onCloseDropdown: () => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onCloseDropdown,
}: NotificationItemProps) {
  const router = useRouter();

  const getStatusIcon = (type: string) => {
    switch (type) {
      case "submitted":
        return "📝";
      case "ai_verified":
        return "🤖";
      case "accepted":
        return "🏛️";
      case "inspection":
        return "🔍";
      case "info_requested":
        return "⚠️";
      case "resolved":
        return "✅";
      case "rejected":
        return "❌";
      default:
        return "🔔";
    }
  };

  const handleNotificationClick = () => {
    onMarkRead(notification.id);
    onCloseDropdown();
    router.push(`/complaints/${notification.complaintId}`);
  };

  return (
    <div
      onClick={handleNotificationClick}
      className={`relative flex cursor-pointer items-start gap-3 border-b border-[color:var(--line)] p-3.5 transition-all duration-150 hover:bg-[color:var(--surface-muted)] ${
        !notification.isRead ? "bg-[color:var(--surface-muted)]" : ""
      }`}
    >
      <span className="pt-0.5 text-base font-semibold leading-none text-[color:var(--accent)]">
        {getStatusIcon(notification.type)}
      </span>
      <div className="min-w-0 flex-1 space-y-1 text-left">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`truncate text-sm leading-normal ${
              !notification.isRead
                ? "font-semibold text-[color:var(--foreground)]"
                : "text-[color:var(--foreground)]"
            }`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[color:var(--accent)]" />
          )}
        </div>
        <p className="text-xs leading-relaxed text-[color:var(--foreground-soft)] break-words">
          {notification.message}
        </p>
        {notification.reason && (
          <p className="mt-1 rounded-[14px] border border-transparent bg-[color:var(--danger-soft)] p-2 text-[0.7rem] leading-normal text-[color:var(--danger)]">
            Reason: {notification.reason}
          </p>
        )}
        <p className="pt-0.5 text-[0.7rem] text-[color:var(--foreground-soft)]">
          {new Date(notification.timestamp).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
