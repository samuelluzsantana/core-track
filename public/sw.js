// Minimal pass-through Service Worker for reliable Web App (PWA) installability.
// Keeps API calls, auth redirects, and new deploys fresh via direct network pass-through.

const CACHE_NAME = 'coretrack-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(['/', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png'])
      )
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match('/');
        return cached || Response.error();
      })
    );
  }
});
