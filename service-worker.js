// ===============================
// SERVICE WORKER — Rapport intervention
// ===============================

const CACHE_NAME = "rapport-intervention-v15"; // <-- change à chaque update

const STATIC_ASSETS = [
  "./",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./service-worker.js"
];

// Install: cache uniquement le “statique” (PAS index.html)
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      await self.skipWaiting(); // active le nouveau SW tout de suite
    })()
  );
});

// Activate: nettoie les anciens caches + prend le contrôle + force reload clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 1) Supprime anciens caches
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));

      // 2) Prend le contrôle immédiatement
      await self.clients.claim();

      // 3) 🔥 Demande aux pages ouvertes de recharger (pour prendre la nouvelle UI)
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      clients.forEach((client) => {
        client.postMessage({ type: "RELOAD_PAGE", cache: CACHE_NAME });
      });
    })()
  );
});

// Fetch:
// - index.html / navigation = Network first (toujours la dernière version)
// - autres assets = Cache first
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Navigation ou index.html -> network first
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(() => caches.match("./")) // fallback si offline
    );
    return;
  }

  // Assets -> cache first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});



