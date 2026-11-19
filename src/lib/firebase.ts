// IssueSnap v2 — Firebase/FCM client initialization (push notifications only)

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

function isValidVapidKey(key: string | undefined): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 30) return false;
  if (trimmed.toLowerCase().includes('dummy') || trimmed.toLowerCase().includes('your-')) return false;
  return true;
}

function getFirebaseApp() {
  if (!firebaseConfig.apiKey) {
    return null;
  }
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

let messaging: Messaging | null = null;

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!messaging) {
    try {
      const app = getFirebaseApp();
      if (!app) return null;
      messaging = getMessaging(app);
    } catch {
      return null;
    }
  }
  return messaging;
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // Web Push requires browser Notification and ServiceWorker support
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.info('[IssueSnap Push] Web Push notifications are not supported in this browser.');
    return null;
  }

  // Push notifications require a secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    console.warn(
      '[IssueSnap Push] Push notifications require a secure context (HTTPS or localhost). ' +
      'If testing on a local IP, use localhost or an HTTPS tunnel.'
    );
    return null;
  }

  // Validate VAPID key before invoking browser PushManager
  if (!isValidVapidKey(VAPID_KEY)) {
    console.warn(
      '[IssueSnap Push] NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing or contains a placeholder. ' +
      'To enable browser push, generate a Web Push key pair in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates.'
    );
    return null;
  }

  const fcmMessaging = getFirebaseMessaging();
  if (!fcmMessaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // Register service worker with current project params so config stays in sync
    const swParams = new URLSearchParams();
    if (firebaseConfig.apiKey) swParams.set('apiKey', firebaseConfig.apiKey);
    if (firebaseConfig.authDomain) swParams.set('authDomain', firebaseConfig.authDomain);
    if (firebaseConfig.projectId) swParams.set('projectId', firebaseConfig.projectId);
    if (firebaseConfig.storageBucket) swParams.set('storageBucket', firebaseConfig.storageBucket);
    if (firebaseConfig.messagingSenderId) swParams.set('messagingSenderId', firebaseConfig.messagingSenderId);
    if (firebaseConfig.appId) swParams.set('appId', firebaseConfig.appId);
    const swUrl = `/firebase-messaging-sw.js?${swParams.toString()}`;

    const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
    await navigator.serviceWorker.ready;

    const token = await getToken(fcmMessaging, {
      vapidKey: VAPID_KEY!.trim(),
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('push service error') || msg.includes('Registration failed')) {
      console.warn(
        '[IssueSnap Push] Browser push service rejected the registration. ' +
        'Please verify that NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local matches your Firebase project Web Push certificate (Cloud Messaging settings).'
      );
    } else {
      console.warn('[IssueSnap Push] Could not acquire FCM push token:', msg);
    }
    return null;
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void): (() => void) | null {
  const fcmMessaging = getFirebaseMessaging();
  if (!fcmMessaging) return null;
  return onMessage(fcmMessaging, callback);
}
