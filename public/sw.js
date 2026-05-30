const CACHE_NAME = 'evolve-wellbeing-v1';
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

// ── Activate — clean old caches ───────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch — network first, fallback to cache ──────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match('/index.html')))
  );
});

// ── Background sync — send queued logs when back online ───
self.addEventListener('sync', event => {
  if (event.tag === 'sync-logs') {
    event.waitUntil(syncQueuedLogs());
  }
});

async function syncQueuedLogs() {
  const cache = await caches.open('evolve-queue-v1');
  const keys = await cache.keys();
  for (const req of keys) {
    const res = await cache.match(req);
    const payload = await res.json();
    try {
      await fetch(payload.url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.data),
      });
      await cache.delete(req);
    } catch (_) {}
  }
}

// ── Push notifications ─────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'Evolve:Wellbeing';
  const body  = data.body  || "Have you logged today? Your coach is waiting. 💪";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      data: { url: '/' },
      actions: [
        { action: 'log', title: 'Log Now' },
        { action: 'dismiss', title: 'Later' },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow('/');
    })
  );
});

// ── Daily reminder scheduling ─────────────────────────────
// Called from the app to schedule 8pm reminders
self.addEventListener('message', event => {
  if (event.data?.type === 'SCHEDULE_REMINDER') {
    scheduleDaily();
  }
});

function scheduleDaily() {
  const now = new Date();
  const next = new Date();
  next.setHours(20, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - now.getTime();
  setTimeout(() => {
    self.registration.showNotification('Evolve:Wellbeing', {
      body: "Time to log today 📋 Your coach reviews tomorrow.",
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      data: { url: '/' },
      actions: [{ action: 'log', title: 'Log Now' }],
    });
    scheduleDaily();
  }, delay);
}
