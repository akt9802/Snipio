/**
 * Offline shell only. Lecture images are never cached — they live in memory
 * on each client (blob URLs) and must not become a product feature here.
 */
const CACHE = "snipio-shell-v1";
const SHELL = ["/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function bypass(request) {
  if (request.method !== "GET") return true;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.includes("socket.io")) return true;
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname.startsWith("/_next/")) return true;
  if (request.destination === "image") return true;

  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (bypass(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
  }
});
