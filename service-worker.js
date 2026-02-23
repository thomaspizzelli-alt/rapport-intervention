const CACHE_NAME = "rapport-intervention-v5"; // <-- change à chaque update
const STATIC_ASSETS = [
  "./",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./service-worker.js"
];

// Install: cache uniquement le “statique” (PAS index.html)
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

// Activate: nettoie les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch:
// - index.html = Network first (toujours la dernière version)
// - autres assets = Cache first
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Toujours aller chercher la dernière version de l'app
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(() => caches.match("./"))
    );
    return;
  }

  // Cache first pour le reste
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});