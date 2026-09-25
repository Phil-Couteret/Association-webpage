// Elektr-Âme PWA Service Worker
// Version 1.0.8 - New logo, force icon cache refresh

const CACHE_VERSION = 'elektr-ame-v1.0.8';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/placeholder.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete caches that don't match current version
              return cacheName.startsWith('elektr-ame-') && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== IMAGE_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Take control of all pages
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API calls (always fetch fresh)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If API fails and offline, return offline page
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        })
    );
    return;
  }

  // Skip video files (need range requests for playback)
  if (request.destination === 'video' || 
      url.pathname.match(/\.(mp4|webm|ogg|mov|avi)$/i)) {
    // Let videos bypass service worker completely
    return;
  }

  // Images - Cache First strategy
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              // Cache the image for future use
              return caches.open(IMAGE_CACHE)
                .then((cache) => {
                  cache.put(request, response.clone());
                  return response;
                });
            });
        })
        .catch(() => {
          // Return placeholder if offline
          return caches.match('/placeholder.svg');
        })
    );
    return;
  }

  // HTML pages - Network First strategy (fresh content)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the page for offline use
          return caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
        })
        .catch(() => {
          // If offline, try cache first
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, show offline page
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // JS, CSS, Fonts - Cache First strategy (performance)
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              return caches.open(STATIC_CACHE)
                .then((cache) => {
                  cache.put(request, response.clone());
                  return response;
                });
            });
        })
    );
    return;
  }

  // Default - Network First
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background Sync (for future use - e.g., queue form submissions when offline)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-form-data') {
    console.log('[Service Worker] Background sync triggered');
    event.waitUntil(
      // Future: Sync queued data when back online
      Promise.resolve()
    );
  }
});

// Push Notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Elektr-Âme';
  const options = {
    body: data.body || 'New notification',
    icon: '/pwa-icons/icon-192x192.png',
    badge: '/pwa-icons/icon-72x72.png',
    tag: data.tag || 'general',
    data: data.url || '/',
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler (for communication with app)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(urls))
    );
  }
});

console.log('[Service Worker] Loaded and ready');

