"use client";

import React, { useState, useEffect, useRef } from "react";
import { Notification } from "./NotificationItem";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
  } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchUnreadCount(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchUnreadCount]);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="icon-action relative"
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        aria-label="Alert notifications feed"
      >
        <span className="text-sm font-semibold">Alerts</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--danger)] px-1 text-[0.62rem] font-semibold leading-none text-white">
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
