"use client";

import React, { useState, useEffect, useRef } from "react";
import { Notification } from "./NotificationItem";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";
import { useDashboard } from "@/hooks/useDashboard";

export function NotificationBell() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: dashboardData } = useDashboard();
  const { notifications, fetchNotifications, markRead, markAllRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications only when user clicks to open dropdown
  useEffect(() => {
    if (dropdownOpen) {
      const controller = new AbortController();
      fetchNotifications(undefined, 1, 20, controller.signal);
      return () => {
        controller.abort();
      };
    }
  }, [dropdownOpen, fetchNotifications]);

  // Close dropdown on outside click or Esc key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  // Map API NotificationResponse to UI Notification objects
  const uiNotifications: Notification[] = notifications
    ? notifications.items.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        timestamp: n.created_at,
        isRead: n.is_read,
        complaintId: n.complaint_id || "",
        type: (n.type?.toLowerCase() as any) || "submitted"
      }))
    : [];

  // Centralized badge unread count: prioritize dashboard summary, fallback to local list count
  const unreadCount = dashboardData?.unreadNotifications !== undefined
    ? dashboardData.unreadNotifications
    : uiNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative cursor-pointer hover:opacity-80 transition-opacity focus:outline-none p-1 rounded-lg"
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        aria-label="Alert notifications feed"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-extrabold leading-none border border-white dark:border-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <NotificationDropdown
          notifications={uiNotifications}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onCloseDropdown={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}
