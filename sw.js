const CACHE_NAME = 'land-app-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './static/icons/lm.ico',
  './static/icons/lm-192.png',
  './static/icons/lm-512.png',
  'https://cdn.jsdelivr.net/npm/ol@v10.3.1/ol.css',
  'https://cdn.jsdelivr.net/npm/ol@v10.3.1/dist/ol.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@turf/turf@6/turf.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (STATIC_ASSETS.some(a => request.url.includes(a))) {
    e.respondWith(caches.match(request).then(cached => cached || fetch(request)));
    return;
  }
  if (request.url.includes('tiles') || request.url.includes('localhost')) {
    e.respondWith(fetch(request).then(res => { if (res.ok) { const clone = res.clone(); caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone)); } return res; }).catch(() => caches.match(request)));
    return;
  }
  e.respondWith(fetch(request).catch(() => caches.match(request)));
});
