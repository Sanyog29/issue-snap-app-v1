// IssueSnap v2 — Notification types

export type NotificationType =
  | 'report_received'
  | 'queue_new'
  | 'queue_urgent'
  | 'report_seen'
  | 'assigned'
  | 'report_in_progress'
  | 'report_update'
  | 'report_fixed'
  | 'report_reopened'
  | 'report_rejected'
  | 'overdue'
  | 'rating_received';

export type DeliveryChannel = 'push' | 'email' | 'sms';
export type DeliveryStatus = 'pending' | 'accepted' | 'failed';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  url?: string | null;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  dedupe_key: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  fcm_token: string;
  platform: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  device_id: string | null;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  provider_message_id: string | null;
  error_message: string | null;
  attempted_at: string;
}
