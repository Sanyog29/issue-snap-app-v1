// IssueSnap — Notifications Module Types

export interface AppNotification {
  id: string;
  user_id: string;
  request_id?: string;
  type: string;
  title: string;
  body: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface PushTokenResult {
  token: string | null;
  supported: boolean;
  reason?: string;
}
