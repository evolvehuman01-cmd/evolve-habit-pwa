// ── EVOLVE:WELLBEING SERVICE WORKER ──────────────────────
// Cache version: bump this on every deploy to force update.
const CACHE_VERSION = 'v7';
const CACHE_NAME    = `evolve-wellbeing-${CACHE_VERSION}`;

const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install — pre-cache shell ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// ── Activate — clean ALL old caches ──────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('evolve-wellbeing-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch — network first, fallback to cache ──────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Don't intercept Apps Script calls — they're POST/no-cors anyway
  if (event.request.url.includes('script.google.com')) return;
  // Don't intercept OneSignal
  if (event.request.url.includes('onesignal.com')) return;

  // Never cache /coach — always fetch fresh so pathname is correct
  if (event.request.url.includes('/coach')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache valid responses
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(r => r || caches.match('/index.html'))
      )
  );
});

// ── Background Sync — send queued logs when back online ───
// Queue lives in localStorage (managed by app). The sync event
// is registered by the app; we signal back via postMessage.
self.addEventListener('sync', event => {
  if (event.tag === 'sync-logs') {
    // Signal the app to flush its localStorage queue.
    // The app handles the actual sending because it owns the queue.
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => {
          clients.forEach(c => c.postMessage({ type: 'FLUSH_QUEUE' }));
        })
    );
  }
});

// ── Push notifications ─────────────────────────────────────
self.addEventListener('push', event => {
  const data  = event.data?.json() || {};
  const title = data.title || 'Evolve:Wellbeing';
  const body  = data.body  || "Have you logged today? Your coach is waiting. 💪";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      data:    { url: data.url || '/' },
      actions: [
        { action: 'log',     title: 'Log Now' },
        { action: 'dismiss', title: 'Later'   },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(target);
    })
  );
});

// ── Message handler ───────────────────────────────────────
self.addEventListener('message', event => {
  // App requests a cache version check (used on load to detect stale SW)
  if (event.data?.type === 'GET_VERSION') {
    event.ports?.[0]?.postMessage({ version: CACHE_VERSION });
  }
});
// NOTE: scheduleDaily() removed — setTimeout in a SW is unreliable
// because the browser kills idle SWs. Push notifications are handled
// entirely by OneSignal (configured in index.html).
