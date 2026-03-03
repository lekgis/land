// ========== การตั้งค่าแคช ==========
const APP_CACHE_NAME = 'land-app-v2';
const MAP_CACHE_NAME = 'map-tiles-v2';

// ไฟล์แอปที่ต้องการแคช
const urlsToCache = [
  '/',
  './index.html',
  './manifest.json',
  '/icons/lm.ico',
  '/icons/lm.ico'
];

// URL ของไทล์แผนที่ที่ต้องการแคช (✅ ลบช่องว่างต่อท้ายออก!)
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
  
  // ตรวจสอบว่าเป็นคำขอไทล์แผนที่
  if (TILE_URLS.some(tileUrl => url.includes(tileUrl.replace('https://', '')))) {
    event.respondWith(handleMapTileRequest(event.request));
  } else {
    event.respondWith(handleAppRequest(event.request));
  }
});

// จัดการคำขอไทล์แผนที่
async function handleMapTileRequest(request) {
  const cache = await caches.open(MAP_CACHE_NAME);
  
  try {
    const cachedResponse = await cache.match(request);
    
    const networkFetch = fetch(request).then(async (networkResponse) => {
      if (networkResponse?.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || networkFetch;
  } catch (err) {
    console.error('❌ Tile error:', err);
    return fetch(request);
  }
}

// จัดการคำขอไฟล์แอป
async function handleAppRequest(request) {
  const cache = await caches.open(APP_CACHE_NAME);
  
  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    
    const networkResponse = await fetch(request);
    
    if (request.url.startsWith(self.location.origin)) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (err) {
    console.error('❌ App request error:', err);
    return caches.match(request);
  }
}

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
      return self.clients.claim(); // ✅ สำคัญ: ใช้งานทันทีกับแท็บที่เปิดอยู่
    })
  );
});

