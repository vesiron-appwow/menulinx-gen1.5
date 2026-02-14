const CACHE_NAME = "menulinx-gen1-v1";

const ASSETS = [
  "/",
  "/index.html",
  "/admin.html",
  "/manifest.webmanifest",
  "/sw.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 🚫 ABSOLUTELY NO INTERCEPTION OF API ROUTES
  // This prevents POST /api/* being blocked or altered
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Static assets: cache-first strategy
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((res) => {
        // Only cache valid same-origin responses
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
