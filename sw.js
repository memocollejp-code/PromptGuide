// prompt_drawer sw.js v1.3.0
const CACHE_PREFIX = "prompt-drawer";
let appVersion = "20260704v1.3.0";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_VERSION") {
    appVersion = event.data.version;
  }
});

const CACHE_NAME = () => `${CACHE_PREFIX}-${appVersion}`;
const URLS_TO_CACHE = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME()).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch(() => Promise.resolve());
    }).then(() => deleteOldCaches()).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteOldCaches().then(() => self.clients.claim()));
});

function deleteOldCaches() {
  return caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME()) {
          return caches.delete(cacheName);
        }
      })
    );
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then((response) => {
      if (!response || response.status !== 200) return response;
      const clone = response.clone();
      caches.open(CACHE_NAME()).then((cache) => cache.put(request, clone));
      return response;
    }).catch(() => caches.match(request).then(r => r || caches.match("./index.html")))
  );
});
