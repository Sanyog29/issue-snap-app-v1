// IssueSnap — Decoupled Web Push Notification Service
import { requestNotificationPermission, getFirebaseMessaging } from '@/lib/firebase';
import { getLocalStorageItem, setLocalStorageItem } from '@/lib/storage';

const PRE_PROMPT_KEY = 'issuesnap-push-preprompt-dismissed';

export function getPushPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function shouldShowPrePrompt(): boolean {
  if (getPushPermissionState() !== 'default') return false;
  const dismissed = getLocalStorageItem(PRE_PROMPT_KEY);
  if (!dismissed) return true;
  const dismissedAt = parseInt(dismissed, 10);
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  return Date.now() - dismissedAt > fourteenDays;
}

export function dismissPrePrompt(): void {
  setLocalStorageItem(PRE_PROMPT_KEY, String(Date.now()));
}

export { requestNotificationPermission, getFirebaseMessaging };
