// ============================================================================
// Service Worker for Baby Shape Matcher PWA
// Strategy: Cache-first for app shell, network-first for everything else
// Bump CACHE_VERSION to force a cache refresh on deploy
// ============================================================================

const CACHE_VERSION = 'baby-shapes-v2';

// Files that make up the "app shell" — everything needed for offline play
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/js/engine.js',
    '/js/levels.js',
    '/js/main.js'
];

// ----------------------------------------------------------------------------
// INSTALL — Pre-cache the app shell so the game works fully offline
// ----------------------------------------------------------------------------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting()) // Activate immediately
    );
});

// ----------------------------------------------------------------------------
// ACTIVATE — Clean up old caches when a new version deploys
// ----------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_VERSION)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim()) // Take control of all open tabs
    );
});

// ----------------------------------------------------------------------------
// FETCH — Cache-first for app shell assets, network-first for others
// ----------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
    // Only handle GET requests (ignore POST, etc.)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Serve from cache if available
            }
            // Otherwise, try the network and cache the response for next time
            return fetch(event.request).then((networkResponse) => {
                // Only cache successful same-origin responses
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // If both cache and network fail, return a friendly offline message
                return new Response('Offline — please reconnect to play.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
            });
        })
    );
});
