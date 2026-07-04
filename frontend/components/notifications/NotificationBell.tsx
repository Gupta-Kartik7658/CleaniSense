"use client";

import React, { useState, useEffect, useRef } from "react";
import { Notification } from "./NotificationItem";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications state
  useEffect(() => {
    const initialNotifications: Notification[] = [
      {
        id: "notif-001",
        title: "Complaint Resolved Successfully",
        message: "The garbage heap at Satellite Road has been cleared. Tap to inspect evidence.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        isRead: false,
        complaintId: "rep-001",
        type: "resolved",
      },
      {
        id: "notif-002",
        title: "Municipality Assigned to Work",
        message: "Ahmedabad Municipal Corporation accepted Open Waste Burning report at Bopal.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        isRead: false,
        complaintId: "rep-002",
        type: "accepted",
      },
      {
        id: "notif-003",
        title: "AI Verification Completed",
        message: "Smoke emission verified. Severity flagged: High.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        isRead: true,
        complaintId: "rep-003",
        type: "ai_verified",
      },
      {
        id: "notif-004",
        title: "Additional Info Requested",
        message: "Blocked Drainage: Please submit a clearer image of the coordinates.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        isRead: true,
        complaintId: "rep-005",
        type: "info_requested",
      },
    ];

    const cached = localStorage.getItem("cleanisense_notifications");
    if (cached) {
      setNotifications(JSON.parse(cached));
    } else {
      setNotifications(initialNotifications);
      localStorage.setItem(
        "cleanisense_notifications",
        JSON.stringify(initialNotifications)
      );
    }
  }, []);

  const saveNotifications = (updated: Notification[]) => {
    setNotifications(updated);
    localStorage.setItem("cleanisense_notifications", JSON.stringify(updated));
  };

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

  const handleMarkRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    saveNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onCloseDropdown={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}
