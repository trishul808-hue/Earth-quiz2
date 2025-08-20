
const CACHE_NAME = 'earth-quiz-v1';
const ASSETS = [
  '.',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'images/logo.png'
];

self.addEventListener('install', evt=>{
  evt.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', evt=>{
  evt.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', evt=>{
  if(evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then(cached=>{
      if(cached) return cached;
      return fetch(evt.request).then(res=>{
        return caches.open(CACHE_NAME).then(cache=>{
          cache.put(evt.request, res.clone());
          return res;
        });
      }).catch(()=> {
        // fallback to cache index.html for navigation
        if(evt.request.mode === 'navigate') return caches.match('index.html');
      })
    })
  );
});
