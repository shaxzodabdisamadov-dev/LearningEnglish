// LearningEnglishStat service worker — birinchi tashrifdan keyin saytni internetsiz ochish uchun.
// Versiya raqamini oshirsangiz, eski kesh avtomatik tozalanadi.
const CACHE_VERSION = "v7";
const CACHE_NAME = `wordpath-${CACHE_VERSION}`;

const APP_SHELL = [
  "/",
  "/css/style.css?v=7",
  "/js/app.js?v=2",
  "/manifest.json",
  "/assets/icon.svg",
  "/assets/brand-icon.svg",
  "/assets/uz-flag.svg",
  "/data/levels.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Sahifa navigatsiyasi: avval tarmoqdan yangi holatini olishga urinamiz
  // (HTML har doim yangi bo'lishi kerak), ulanish bo'lmasa keshdan qaytaramiz.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // CSS/JS/ma'lumot fayllari: avval keshdan darhol javob beramiz, fonda
  // tarmoqdan yangilab, keyingi safar uchun keshni yangilaymiz.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
