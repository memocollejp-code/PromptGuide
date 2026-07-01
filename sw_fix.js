// ========== SERVICE WORKER ==========
// Version: 20260701v1
// Handles cache busting on new app versions

const CACHE_PREFIX = "prompt-drawer";
let appVersion = "20260701v1";

// Listen for version updates from the app
self.addEventListener("message", (event) => {
  if (event.data.type === "SET_VERSION") {
    appVersion = event.data.version;
    console.log("🔔 SW received version:", appVersion);
  }
});

const CACHE_NAME = () => `${CACHE_PREFIX}-${appVersion}`;

const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ========== INSTALL EVENT ==========
// Create new cache & delete old ones
self.addEventListener("install", (event) => {
  console.log("📦 SW Installing, version:", appVersion);
  
  event.waitUntil(
    caches.open(CACHE_NAME()).then((cache) => {
      console.log("✅ Cache opened:", CACHE_NAME());
      return cache.addAll(URLS_TO_CACHE).catch((err) => {
        console.log("⚠️ Some URLs could not be cached (network issues OK):", err);
        return Promise.resolve();
      });
    }).then(() => {
      return deleteOldCaches();
    }).then(() => {
      console.log("🚀 Skipping waiting phase");
      return self.skipWaiting();
    })
  );
});

// ========== ACTIVATE EVENT ==========
// Clean up old caches & take control
self.addEventListener("activate", (event) => {
  console.log("⚡ SW Activating");
  
  event.waitUntil(
    deleteOldCaches().then(() => {
      console.log("🎯 All old caches deleted");
      return self.clients.claim();
    })
  );
});

// ========== DELETE OLD CACHES ==========
function deleteOldCaches() {
  return caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME()) {
          console.log("🗑️ Deleting old cache:", cacheName);
          return caches.delete(cacheName);
        }
      })
    );
  });
}

// ========== FETCH EVENT ==========
// Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and external requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Cache strategy: Network first, fallback to cache
  event.respondWith(
    fetch(request).then((response) => {
      if (!response || response.status !== 200) {
        return response;
      }

      const responseClone = response.clone();
      caches.open(CACHE_NAME()).then((cache) => {
        cache.put(request, responseClone);
      });

      return response;
    }).catch(() => {
      return caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return caches.match("/index.html");
      });
    })
  );
});

// ========== CLIENT MESSAGE ==========
// Notify app when new version is available
self.addEventListener("controllerchange", () => {
  console.log("🔄 Controller changed - new SW is now active");
  if (self.clients && self.clients.matchAll) {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "SW_UPDATED", version: appVersion });
      });
    });
  }
});
