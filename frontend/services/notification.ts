import api from "../lib/api";
import { NotificationResponse } from "../types/notification";

export interface NotificationsQueryResponse {
  items: NotificationResponse[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export const notificationService = {
  getNotifications(
    isRead?: boolean,
    page?: number,
    limit?: number,
    signal?: AbortSignal
  ): Promise<NotificationsQueryResponse> {
    return api.get("/notifications", {
      params: {
        is_read: isRead !== undefined ? isRead : undefined,
        page: page || 1,
        page_size: limit || 20
      },
      signal
    });
  },

  markNotificationRead(id: string, signal?: AbortSignal): Promise<NotificationResponse> {
    return api.put(`/notifications/${id}/read`, {}, { signal });
  },

  markAllNotificationsRead(signal?: AbortSignal): Promise<{ count_marked: number }> {
    return api.put("/notifications/read-all", {}, { signal });
  },

  getUnreadCount(signal?: AbortSignal): Promise<{ count: number }> {
    return api.get("/notifications/unread-count", { signal });
  }
};
