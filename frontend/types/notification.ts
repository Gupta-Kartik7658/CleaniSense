export interface NotificationResponse {
  id: string;
  complaint_id?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}
