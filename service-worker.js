const CACHE_NAME='comenzi-floresti-pwa-v1';
const APP_SHELL='./index.html';

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.add(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(names=>Promise.all(names.filter(name=>name.startsWith('comenzi-floresti-pwa-')&&name!==CACHE_NAME).map(name=>caches.delete(name))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.mode!=='navigate'||new URL(request.url).origin!==self.location.origin)return;
  event.respondWith(
    fetch(request).then(response=>{
      if(response.ok)return caches.open(CACHE_NAME).then(cache=>cache.put(APP_SHELL,response.clone()).then(()=>response));
      return response;
    }).catch(()=>caches.match(APP_SHELL).then(response=>response||Response.error()))
  );
});
