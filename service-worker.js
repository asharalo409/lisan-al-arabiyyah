const CACHE_NAME = "lisan-al-arabiyyah-v3";

self.addEventListener("install", function () {
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
    fetch(event.request)
      .then(function (networkResponse) {
        const responseCopy = networkResponse.clone();

        if (
          networkResponse.ok &&
          new URL(event.request.url).origin === self.location.origin
        ) {
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseCopy);
          });
        }

        return networkResponse;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }

          return caches.match("/index.html");
        });
      })
  );
});
