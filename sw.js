// sw.js - Service Worker สำหรับแอปวัดที่ดิน
const CACHE_NAME = 'land-app-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

// ✅ ไฟล์ที่ควรแคชทันที (ลบ trailing spaces ออก!)
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './static/icons/lm.ico',
  './static/icons/icon-192.png',
  './static/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/ol@v10.3.1/ol.css',
  'https://cdn.jsdelivr.net/npm/ol@v10.3.1/dist/ol.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@turf/turf@6/turf.min.js'
];

// ติดตั้ง Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// เปิดใช้งาน - ลบแคชเก่า
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(
        keys.filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ดึงข้อมูล - Cache First สำหรับ static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // ✅ Cache First: ไฟล์ static
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }
  
  // ✅ Network First: ข้อมูล dynamic (tiles, geojson)
  if (request.url.includes('tiles') || request.url.includes('localhost')) {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes.ok) {
            const resClone = networkRes.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, resClone));
          }
          return networkRes;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // ✅ Default
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
