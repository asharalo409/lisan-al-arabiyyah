const CACHE_NAME = "lisan-al-arabiyyah-v2";

const APP_FILES = [
  "/",
  "/index.html",
  "/lessons.html",
  "/vocabulary.html",
  "/quiz.html",
  "/chat.html",
  "/profile.html",
  "/settings.html",
  "/app.js",
  "/manifest.json",
  "/icon.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_FILES);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(function () {
        return caches.match("/index.html");
      });
    })
  );
});
