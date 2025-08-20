// public/sw.js

self.addEventListener('install', (event) => {
    console.log('📥 Service Worker installing...');
    self.skipWaiting(); // activate immediately
  });
  
  self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activated');
  });
  
  // Basic fetch handler (network-first, fallback to cache)
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.open('kentone-cache-v1').then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          // Optionally cache successful GET requests
          if (event.request.method === 'GET' && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // If offline, try cached version
          return cache.match(event.request) || Response.error();
        }
      })
    );
  });
  