// IssueSnap — Decoupled In-App Notification Service

export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await fetch('/api/notifications/unread-count');
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markAllAsRead(): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications/read-all', {
      method: 'PATCH',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function registerDevice(fcmToken: string): Promise<boolean> {
  try {
    const res = await fetch('/api/devices/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcm_token: fcmToken, platform: 'web' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function unregisterDevice(fcmToken: string): Promise<boolean> {
  try {
    const res = await fetch('/api/devices/unregister', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcm_token: fcmToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
