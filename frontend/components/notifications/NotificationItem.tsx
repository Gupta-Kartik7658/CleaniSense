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
      className={`p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-150 relative ${
        !notification.isRead ? "bg-slate-50/60 dark:bg-slate-900/40" : ""
      }`}
    >
      <span className="text-lg leading-none pt-0.5">
        {getStatusIcon(notification.type)}
      </span>
      <div className="space-y-1 min-w-0 flex-1 text-left">
        <div className="flex justify-between items-start gap-2">
          <p
            className={`text-xs leading-normal truncate ${
              !notification.isRead
                ? "font-bold text-slate-900 dark:text-white"
                : "text-slate-700 dark:text-slate-300"
            }`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
          )}
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed break-words">
          {notification.message}
        </p>
        {notification.reason && (
          <p className="text-[9px] text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-450 p-1.5 rounded mt-1 border border-rose-100 dark:border-rose-900 leading-normal">
            Reason: {notification.reason}
          </p>
        )}
        <p className="text-[9px] text-slate-400 dark:text-slate-550 pt-0.5">
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
