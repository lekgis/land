// ========== การตั้งค่าแคช ==========
const APP_CACHE_NAME = 'land-app-v2';
const MAP_CACHE_NAME = 'map-tiles-v2';

// ✅ แก้ path ให้ตรงกับ manifest + GitHub Pages
const urlsToCache = [
  '/land/',
  '/land/index.html',
  '/land/manifest.json',
  '/land/static/icons/lm-192.png',  // ✅ แก้ path
  '/land/static/icons/lm-512.png'
];

// ✅ ลบช่องว่างท้ายออก!
const TILE_URLS = [
  'https://mt0.google.com',
  'https://mt1.google.com',
  'https://mt2.google.com',
  'https://mt3.google.com'
];

// ========== Event: Install ==========
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(APP_CACHE_NAME).then((cache) => {
        console.log('📦 Caching app assets...');
        return cache.addAll(urlsToCache).catch((err) => {
          console.warn('⚠️ Failed to cache app assets:', err);
        });
      }),
      caches.open(MAP_CACHE_NAME).then((cache) => {
        console.log('🗺️ Map tile cache ready');
      })
    ]).then(() => {
      console.log('✅ Service Worker installed');
      return self.skipWaiting();
    })
  );
});

// ========== Event: Fetch ==========
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // ✅ แก้ match URL (ลบช่องว่าง)
  if (TILE_URLS.some(tileUrl => url.includes(tileUrl))) {
    event.respondWith(handleMapTileRequest(event.request));
  } else {
    event.respondWith(handleAppRequest(event.request));
  }
});

// ... (ฟังก์ชัน handleMapTileRequest และ handleAppRequest เหมือนเดิม) ...

// ========== Event: Activate ==========
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== APP_CACHE_NAME && cacheName !== MAP_CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});
