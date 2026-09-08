/* Поездки — сервис-воркер.
   Оболочка приложения кэшируется при установке; шрифты и Motion — при первом обращении.
   При обновлении приложения поменяй VERSION — старый кэш будет удалён. */
const VERSION = "v15";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon.svg", "./icons/favicon.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-180.png", "./icons/icon-120.png", "./icons/icon-152.png", "./icons/icon-167.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open("shell-" + VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // сторонние ресурсы (шрифты, jsDelivr): кэш, иначе сеть, затем в кэш
  const isThirdParty = url.origin !== location.origin;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const fetchAndCache = fetch(e.request).then((res) => {
        if (res && (res.ok || res.type === "opaque")) caches.open((isThirdParty ? "ext-" : "shell-") + VERSION).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => hit);
      // для оболочки — сначала сеть (чтобы обновления доезжали), при обрыве — кэш; для сторонних — сначала кэш
      return isThirdParty ? (hit || fetchAndCache) : fetchAndCache.then((r) => r || hit);
    })
  );
});
