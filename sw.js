// ========== การตั้งค่าแคช ==========
const APP_CACHE_NAME = 'land-survey-app-v3';
const MAP_CACHE_NAME = 'map-tiles-v3';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v3';

// ✅ ไฟล์แอปที่ต้องการแคชทันที (สำคัญ!)
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './pwa.js',
  './app.js',
  './support.js',
  './static/icons/lb-192.png',
  './static/icons/lb-512.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/lucide@latest',
  'https://unpkg.com/@turf/turf@6/turf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// ✅ URL ของไทล์แผนที่ (รองรับทุก subdomain)
const TILE_PATTERNS = [
  /^https:\/\/mt[0-3]\.google\.com\/vt\//,
  /^https:\/\/[a-z]\.tile\.openstreetmap\.org\//
];

// ========== Event: Install ==========
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(APP_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting(); // ใช้งานทันที
      })
      .catch((err) => {
        console.warn('⚠️ Failed to cache some assets:', err);
      })
  );
});

// ========== Event: Activate ==========
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // ✅ ลบแคชเก่าที่ไม่ใช้แล้ว
            return name !== APP_CACHE_NAME && 
                   name !== MAP_CACHE_NAME && 
                   name !== DYNAMIC_CACHE_NAME;
          })
          .map((name) => {
            console.log('🗑️ Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('✅ Old caches cleaned');
      return self.clients.claim(); // ใช้งานกับแท็บที่เปิดอยู่ทันที
    })
  );
});

// ========== Event: Fetch ==========
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // ✅ 1. จัดการไทล์แผนที่ (Cache First, then Network)
  if (TILE_PATTERNS.some(pattern => pattern.test(url.href))) {
    event.respondWith(handleMapTile(request));
    return;
  }
  
  // ✅ 2. จัดการ API Requests (Network First, then Cache)
  if (url.pathname.includes('/macros/s/') || url.search.includes('action=')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // ✅ 3. จัดการไฟล์แอป (Cache First, then Network)
  if (request.mode === 'navigate' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // ✅ 4. คำขออื่นๆ (Network First)
  event.respondWith(fetch(request));
});

// ✅ จัดการไทล์แผนที่
async function handleMapTile(request) {
  const cache = await caches.open(MAP_CACHE_NAME);
  
  // ✅ ลองดึงจากแคชก่อน
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  
  // ✅ ดึงจากเครือข่าย
  try {
    const response = await fetch(request);
    
    // ✅ บันทึกในแคชถ้าสำเร็จ
    if (response.ok) {
      // ✅ จำกัดขนาด: ไม่แคชถ้าใหญ่เกิน 1MB
      const clone = response.clone();
      const blob = await clone.blob();
      
      if (blob.size < 1024 * 1024) {
        await cache.put(request, response.clone());
      }
    }
    
    return response;
  } catch (err) {
    console.warn('⚠️ Map tile fetch failed:', err);
    // ✅ Return placeholder tile ถ้าออฟไลน์
    return createPlaceholderTile();
  }
}

// ✅ สร้างไทล์สำรอง (สีเทา) เมื่อออฟไลน์
function createPlaceholderTile() {
  const canvas = new OffscreenCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ออฟไลน์', 128, 128);
  
  return canvas.convertToBlob().then(blob => {
    return new Response(blob, {
      headers: { 'Content-Type': 'image/png' }
    });
  });
}

// ✅ จัดการ API Requests
async function handleAPIRequest(request) {
  // ✅ API ต้องออนไลน์เสมอ → ไม่แคช
  try {
    const response = await fetch(request);
    return response;
  } catch (err) {
    console.warn('⚠️ API request failed:', err);
    return new Response(JSON.stringify({ 
      error: 'ออฟไลน์', 
      message: 'กรุณาเชื่อมต่ออินเทอร์เน็ต' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ✅ จัดการไฟล์แอป
async function handleStaticAsset(request) {
  const cache = await caches.open(APP_CACHE_NAME);
  
  // ✅ ลองดึงจากแคชก่อน
  const cached = await cache.match(request);
  if (cached) {
    // ✅ อัปเดตแคชในพื้นหลัง (Stale-While-Revalidate)
    fetch(request).then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
      }
    }).catch(() => {});
    
    return cached;
  }
  
  // ✅ ดึงจากเครือข่าย
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('⚠️ Static asset fetch failed:', err);
    // ✅ Return offline page สำหรับ navigation
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

// ========== Message Handler ==========
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CLEAN_CACHES') {
    event.waitUntil(cleanCaches(event.data.keepNames || []));
  }
});

// ✅ ล้างแคช (รักษาชื่อที่ระบุ)
async function cleanCaches(keepNames = []) {
  const cacheNames = await caches.keys();
  const toDelete = cacheNames.filter(name => !keepNames.includes(name));
  
  await Promise.all(toDelete.map(name => caches.delete(name)));
  console.log('🧹 Cleaned caches:', toDelete);
}

// ✅ Register Message Port สำหรับสื่อสารกับหน้าเว็บ
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_CACHE_STATUS') {
    caches.keys().then(names => {
      event.ports[0]?.postMessage({ caches: names });
    });
  }
});
