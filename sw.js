// sw.js - Service Worker for offline & push notifications

const CACHE_NAME = 'taskmaster-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/themes/light.css',
  '/css/themes/dark.css',
  '/js/app.js',
  '/js/modules/taskManager.js',
  '/js/modules/storage.js',
  '/js/modules/renderer.js',
  '/js/modules/ui.js',
  '/js/modules/templates.js',
  '/js/utils/helpers.js',
  '/js/utils/validators.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event – cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event – clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event – serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});

// Push event – show notification
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body || 'Task due!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: { taskId: data.taskId }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'TaskMaster Pro', options)
  );
});

// Notification click – open the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});