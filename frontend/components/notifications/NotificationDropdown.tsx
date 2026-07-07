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
    <div className="absolute right-0 mt-3 flex max-h-[420px] w-80 flex-col overflow-hidden rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface)] text-left shadow-[var(--shadow-pop)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-3">
        <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)]">
          Notifications
        </h4>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-[color:var(--accent)]"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex-1 divide-y divide-[color:var(--line)] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-[color:var(--foreground-soft)]">
            <span className="mb-2 block text-xl font-semibold">00</span>
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

      <div className="shrink-0 border-t border-[color:var(--line)] bg-[color:var(--surface-muted)] p-2.5 text-center">
        <Link
          href="/complaints/history"
          onClick={onCloseDropdown}
          className="block w-full text-xs font-semibold text-[color:var(--foreground-soft)] hover:text-[color:var(--accent)]"
        >
          View all notifications
        </Link>
      </div>

    </div>
  );
}
