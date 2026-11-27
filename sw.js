// Service worker de Pixel Breach: permite instalar el juego y jugar solo sin internet.
// Siempre intenta la red primero (para recibir actualizaciones) y usa la copia guardada si no hay conexión.
// La versión debe coincidir con VERSION en js/data.js (lo revisan las pruebas).
const VERSION='0.17.3';
const CACHE='pixel-breach-v'+VERSION;
const FILES=['./','index.html','css/game.css','manifest.json','apple-touch-icon.png','icon192.png','icon512.png',
 'js/data.js','js/skins.js','js/logo.js','js/map.js','js/entities.js','js/ai.js','js/combat.js','js/modes.js','js/levels.js','js/arcade.js','js/audio.js','js/loop.js',
 'js/render.js','js/intro.js','js/input.js','js/menu.js','js/net.js','js/ui.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return; // PeerJS y lo externo van directo
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r;})
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
});
