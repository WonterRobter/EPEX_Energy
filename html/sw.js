// sw.js - Versie 2 (Forceert directe updates)
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Haal altijd vers van de server (geen verouderde bestanden)
    event.respondWith(fetch(event.request));
});