import { useState, useCallback } from "react";
import { notificationService, NotificationsQueryResponse } from "../services/notification";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationsQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (isRead?: boolean, page?: number, limit?: number, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications(isRead, page, limit, signal);
      setNotifications(data);
    } catch (err: any) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(err.message || "Failed to retrieve notifications feed.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      await notificationService.markNotificationRead(id);
      // Update local state to avoid extra GET requests
      if (notifications) {
        const updatedItems = notifications.items.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        );
        setNotifications({
          ...notifications,
          items: updatedItems
        });
      }
    } catch (err: any) {
      console.error("Failed to mark notification read:", err);
    }
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllNotificationsRead();
      if (notifications) {
        const updatedItems = notifications.items.map((n) => ({ ...n, is_read: true }));
        setNotifications({
          ...notifications,
          items: updatedItems
        });
      }
    } catch (err: any) {
      console.error("Failed to mark all notifications read:", err);
    }
  }, [notifications]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markRead,
    markAllRead
  };
}
