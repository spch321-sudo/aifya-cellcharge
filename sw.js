// 愛菲亞細胞快充站 Service Worker
// 版本號更新即可強制刷新快取
var CACHE_NAME = 'aifya-cell-v2';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// 安裝：快取核心資源
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 啟動：清除舊快取
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 攔截請求：網路優先，失敗時用快取
self.addEventListener('fetch', function(e) {
  // 只處理 GET、同源請求
  if (e.request.method !== 'GET') return;
  // API 呼叫不快取（小智 AI、proxy）
  if (e.request.url.indexOf('workers.dev') > -1 ||
      e.request.url.indexOf('anthropic.com') > -1) return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      // 快取成功的回應
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // 離線時從快取讀取
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});
