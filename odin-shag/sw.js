'use strict';
const VERSION='1.3.0';
const BASE=new URL('./',self.location.href);
const PREFIX='odin-shag-offline:'+BASE.pathname+':';
const CACHE=PREFIX+VERSION;
const HOME=new URL('./',BASE).href;
const ASSETS=['./','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'].map(path=>new URL(path,BASE).href);
const assetSet=new Set(ASSETS);
async function installShell(){
 // Reject login pages, redirects and partial releases instead of caching them.
 const responses=await Promise.all(ASSETS.map(async url=>{
  const response=await fetch(url,{cache:'no-store',credentials:'same-origin',redirect:'error'});
  if(!response.ok||response.redirected||response.type==='opaque')throw new Error('Asset unavailable');
  if(url===HOME){
   if(!(response.headers.get('content-type')||'').includes('text/html'))throw new Error('Invalid shell type');
   const html=await response.clone().text();
   if(!html.includes('<meta name="app-version" content="'+VERSION+'">')||!html.includes('id="flowDialog"'))throw new Error('Wrong shell');
  }else if(url.endsWith('.webmanifest')){
   if((await response.clone().json()).name!=='Один шаг')throw new Error('Invalid manifest');
  }else if(!(response.headers.get('content-type')||'').startsWith('image/png'))throw new Error('Invalid icon');
  return response;
 }));
 const cache=await caches.open(CACHE);
 try{await Promise.all(ASSETS.map((url,i)=>cache.put(url,responses[i])));}catch(error){await caches.delete(CACHE);throw error;}
 await self.skipWaiting();
}
self.addEventListener('install',event=>event.waitUntil(installShell()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 if(!await cache.match(HOME))throw new Error('Missing shell');
 await self.clients.claim();
 const names=await caches.keys();
 await Promise.all(names.filter(name=>name.startsWith(PREFIX)&&name!==CACHE).map(name=>caches.delete(name)));
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==BASE.origin)return;
 const homeNavigation=request.mode==='navigate'&&(url.pathname===BASE.pathname||url.pathname===BASE.pathname+'index.html');
 const key=homeNavigation?HOME:url.href;
 if(!homeNavigation&&!assetSet.has(key))return;
 // Launch from disk immediately, including with a slow or absent network.
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const cached=await cache.match(key);
  return cached||fetch(request);
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type!=='OFFLINE_STATUS'||!event.ports?.[0])return;
 event.waitUntil((async()=>{
  let ready=false;
  try{const cache=await caches.open(CACHE);ready=!!await cache.match(HOME);}catch(e){}
  event.ports[0].postMessage({type:'OFFLINE_STATUS',ready,version:VERSION});
 })());
});
