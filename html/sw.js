// sw.js - Service Worker voor PWA en Push Notificaties
self.addEventListener('install', (event) => {
    console.log('EPEXenergy Service Worker geïnstalleerd');
    self.skipWaiting(); // Zorgt dat updates direct actief worden
});

self.addEventListener('activate', (event) => {
    console.log('EPEXenergy Service Worker geactiveerd');
});

// Hier bouwen we straks de luister-functie in voor de Node-RED notificaties!
self.addEventListener('push', function(event) {
    console.log('Push bericht ontvangen!');
    // Code voor de notificatie komt hier...
});

// Chrome eist een 'fetch' event om de "Toevoegen aan startscherm" pop-up te tonen!
self.addEventListener('fetch', (event) => {
    // Voor nu doen we hier nog niets mee, we laten alles gewoon door.
});