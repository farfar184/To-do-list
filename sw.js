const CACHE_NAME = 'workspace-todo-v1';
const assets = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json'
];

// Menyimpan file aplikasi ke dalam memori HP saat pertama kali diinstal
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Mengambil data dari memori HP agar aplikasi bisa dibuka tanpa internet
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});