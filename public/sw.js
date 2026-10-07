// Freshly service worker: app shell + offline page. Bump VERSION to force an update.
const VERSION = "freshly-v1";
const SHELL = ["/", "/offline.html", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return; // never touch API / payment calls
  if (new URL(req.url).pathname.startsWith("/api/")) return;
  if (req.mode === "navigate") {
    // pages: network first, fall back to the cached copy, then the offline page
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match("/offline.html"))));
    return;
  }
  // static files (_next/static, images, icons): cache first
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok && /\/(_next\/static|icons)\//.test(req.url)) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  })));
});
