const CACHE_NAME = 'Farah-Todo-Cache-v3';
const assetsToCache = [
  './',                  // Merekam folder utama saat dibuka otomatis
  'index.html',
  'style.css?v=9.9',     // Sesuaikan dengan teks tanda tanya yang tertulis di index.html kamu
  'script.js?v=2.0',    // Sesuaikan dengan teks tanda tanya script di index.html kamu
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
