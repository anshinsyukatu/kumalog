/*
 * くまログ Service Worker（キャッシュ担当）：
 * サイトの静的資産だけをキャッシュし、オフラインでも開けるようにする。
 * 記録データは localStorage（端末内）で、このワーカーは一切扱わない。
 * 資産を変更したら CACHE_VERSION を上げること（古いキャッシュは activate で破棄）。
 */
"use strict";

var CACHE_VERSION = "v3";
var CACHE_NAME = "kumalog-cache-" + CACHE_VERSION;

var PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-180.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      });
    })
  );
});
