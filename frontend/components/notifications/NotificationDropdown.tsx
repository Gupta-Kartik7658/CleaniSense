"use client";

import React from "react";
import { Notification, NotificationItem } from "./NotificationItem";
import Link from "next/link";

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onCloseDropdown: () => void;
}

export function NotificationDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onCloseDropdown,
}: NotificationDropdownProps) {
  return (
    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 text-left transition-all duration-150 ease-in-out overflow-hidden flex flex-col max-h-[420px]">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
          Notifications
        </h4>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={onMarkAllRead}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-450 cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List Container */}
      <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            <span className="text-2xl block mb-2">🔔</span>
            No notifications yet.
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkRead={onMarkRead}
              onCloseDropdown={onCloseDropdown}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center shrink-0">
        <Link
          href="/complaints/history"
          onClick={onCloseDropdown}
          className="text-[10px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 transition-colors block w-full"
        >
          View all notifications
        </Link>
      </div>

    </div>
  );
}
