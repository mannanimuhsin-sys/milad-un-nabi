// Self-destructing Service Worker
// Automatically unregisters itself and purges CacheStorage across all connected clients

self.addEventListener('install', (event) => {
  console.log('[SW-Cleanup] Installing self-destruct service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW-Cleanup] Activating SW cleanup & purging caches...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    })
  );
});
