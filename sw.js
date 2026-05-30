const CACHE_NAME = 'farah-todo-cache-v5'; // Naikkan versi cache ke v5

// File-file utama yang perlu disimpan untuk mode offline
const assetsToCache = [
  './',
  'index.html',
  'style.css',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    }).then(() => {
      return self.skipWaiting(); 
    })
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama yang bikin macet:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); 
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('script.js')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request); 
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});