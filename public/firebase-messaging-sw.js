// Firebase messaging service worker for background push notifications.
// Uses data-only messages — the service worker renders the notification,
// preventing duplicates when the app is open (foreground shows a toast instead).

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

try {
  const urlParams = new URLSearchParams(self.location.search);
  const apiKey = urlParams.get('apiKey');
  const authDomain = urlParams.get('authDomain');
  const projectId = urlParams.get('projectId');
  const storageBucket = urlParams.get('storageBucket');
  const messagingSenderId = urlParams.get('messagingSenderId');
  const appId = urlParams.get('appId');

  if (apiKey && projectId && !firebase.apps.length) {
    firebase.initializeApp({
      apiKey,
      authDomain: authDomain || undefined,
      projectId,
      storageBucket: storageBucket || undefined,
      messagingSenderId: messagingSenderId || undefined,
      appId: appId || undefined,
    });
  }

  if (firebase.apps.length) {
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const data = payload.data || {};
      const title = data.title || 'IssueSnap';
      const options = {
        body: data.body || '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { url: data.url || '/' },
        tag: data.dedupe_key || undefined,
      };

      self.registration.showNotification(title, options);
    });
  }
} catch (e) {
  console.warn('[firebase-messaging-sw] Init error:', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
