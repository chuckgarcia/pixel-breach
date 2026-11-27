'use strict';
// Pixel Breach — Modo en línea (PeerJS/WebRTC), sala y espectadores
// ---------- EN LÍNEA (PeerJS / WebRTC: conexión directa entre navegadores, sin cuentas) ----------
// El anfitrión simula la partida completa (IAs incluidas) y manda "fotos" del estado 20 veces por segundo.
// Los invitados solo mandan lo que presionan y dibujan lo que reciben.
const ONLINE_URL='https://chuckgarcia.github.io/pixel-breach/';
const MAX_PLAYERS=5,PROTO=3,WIDX=['pistol','smg','shotgun','rifle','frag','flash'];
let NET=null,peerLib=null;
const peerIdFor=c=>'pixelbreach-v1-'+c.toLowerCase();
function genCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let r='';for(let i=0;i<4;i++)r+=A[Math.floor(Math.random()*A.length)];return r;}
function sameMinor(v){const a=String(v||'').split('.'),b=VERSION.split('.');return a.length===3&&a[0]===b[0]&&a[1]===b[1];}
function cleanName(n){return String(n||'').toUpperCase().replace(/[^A-Z0-9ÑÁÉÍÓÚÜ _-]/g,'').trim().slice(0,10)||'JUGADOR';}
// Servicio propio (Cloud Run) que entrega credenciales TURN temporales. El secreto maestro vive en
// Secret Manager de Google Cloud y nunca llega al navegador. Vacío = solo conexión directa.
const TURN_API='https://pixel-breach-creds-hdi4ocofhq-uc.a.run.app/turn';
let iceCache=null;
async function iceServers(){ // se piden antes de crear o unirse a una sala; si el servicio falla, se juega sin relevo
 if(!TURN_API||/[?&]ps=/.test(location.search))return null;
 if(iceCache&&iceCache.exp>Date.now())return iceCache.list;
 try{
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),4000);
  const r=await fetch(TURN_API,{signal:ctl.signal,cache:'no-store'});clearTimeout(t);
  const j=r.ok?await r.json():null;if(!j||!Array.isArray(j.iceServers))return null;
  iceCache={list:j.iceServers,exp:Date.now()+Math.max(60,(j.ttl|0)-3600)*1000};return j.iceServers;
 }catch(e){return null;}
}
function peerOpts(ice){ // ?ps=host:puerto solo para pruebas con un servidor propio
 const m=location.search.match(/[?&]ps=([^&]+)/);if(!m)return ice?{debug:0,config:{iceServers:ice}}:{debug:0};
 const [host,port]=decodeURIComponent(m[1]).split(':');return {host,port:+port,path:'/',secure:false,debug:0,config:{iceServers:[]}};
}
function loadPeer(){
 if(peerLib)return peerLib;
 peerLib=new Promise((ok,ko)=>{if(window.Peer)return ok();const sc=document.createElement('script');sc.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';sc.onload=()=>window.Peer?ok():ko();sc.onerror=()=>{peerLib=null;ko();};document.head.appendChild(sc);});
 return peerLib;
}
function netMsg(t,ok){const m=$('netMsg');if(t&&!ok&&!/github\.io|127\.0\.0\.1|localhost/.test(location.host))t+=' El modo en línea funciona en '+ONLINE_URL.replace('https://','');m.textContent=t||'';m.classList.toggle('ok',!!ok);} /* classList: no borrar la clase 'inv' que lo mantiene visible en la pantalla de invitación */
function netLeave(msg){
 if(NET){try{if(NET.role==='host')for(const c of NET.clients.values())try{c.conn.send({t:'closed'});}catch(e){}else if(NET.conn&&NET.conn.open)NET.conn.send({t:'bye'});}catch(e){}
  const pr=NET.peer;setTimeout(()=>{try{pr.destroy();}catch(e){}},200);}
 NET=null;toTitle();netMsg(msg||'');
}
function linkFor(code){return location.href.split('#')[0]+'#'+code;}
// --- anfitrión ---
let netBusy=false; // evita crear o unirse dos veces mientras se preparan la librería y las credenciales
async function createRoom(){
 if(menuMode()==='arcade'){SETTINGS.mode='dm';saveSettings();showMode();} // ARCADE es de un jugador
 if(NET||netBusy)return;netMsg('Creando sala…',true);
 try{await loadPeer();}catch(e){netMsg('No se pudo cargar el modo en línea. Revisa tu conexión.');return;}
 netBusy=true;const ice=await iceServers();netBusy=false;if(NET)return;
 const attempt=(tries)=>{
  const code=genCode(),peer=new Peer(peerIdFor(code),peerOpts(ice));let opened=false;
  peer.on('open',()=>{
   if(opened){if(NET&&NET.peer===peer)setSig('ok');return;} // reconexión: la sala y sus jugadores se conservan
   opened=true;NET={role:'host',peer,code,clients:new Map(),ais:Math.max(1,MAX_PLAYERS-2),aiNames:AI_NAMES.slice().sort(()=>Math.random()-.5),sendT:0,fog:true,sig:'ok',rcTries:0};myId=0;state='lobby';netMsg('');renderLobby();
  });
  peer.on('connection',conn=>hostAccept(conn));
  peer.on('disconnected',()=>{if(NET&&NET.peer===peer&&!NET.forcing){setSig('reconnecting');hostReconnect(800);}});
  peer.on('error',err=>{
   if(!opened&&err.type==='unavailable-id'&&tries<4){try{peer.destroy();}catch(e){}attempt(tries+1);return;}
   if(!opened){try{peer.destroy();}catch(e){}netMsg('No se pudo crear la sala ('+err.type+').');return;}
   if(NET&&NET.peer===peer&&err.type!=='peer-unavailable'){setSig('reconnecting');hostReconnect(err.type==='unavailable-id'?3000:1500);}
  });
 };attempt(0);
}
// ---- la sala sobrevive a cambiar de app ----
// En el celular, al ir a WhatsApp u otra app, el sistema congela la página y el servidor de salas
// suelta la conexión sin que el juego se entere. Al volver, se vuelve a registrar la sala con el
// mismo código; los jugadores que ya estaban siguen dentro.
function setSig(s){if(!NET||NET.role!=='host')return;const was=NET.sig;NET.sig=s;if(s==='ok'){NET.rcTries=0;if(was==='reconnecting'&&state==='play')showToast('SALA RECUPERADA','#4ade80');}if(state==='lobby')renderLobby();}
function hostReconnect(delay,force){
 if(!NET||NET.role!=='host')return;
 clearTimeout(NET.rcT);
 NET.rcT=setTimeout(()=>{
  if(!NET||NET.role!=='host')return;const p=NET.peer;if(p.destroyed)return;
  NET.rcTries++;
  if(p.disconnected){try{p.reconnect();}catch(e){}}
  else if(force){NET.forcing=true;try{p.disconnect();}catch(e){}setTimeout(()=>{if(NET)NET.forcing=false;try{p.reconnect();}catch(e){}},250);}
  // si no quedó en línea, reintentar (cada vez más espaciado, máximo cada 8 s)
  setTimeout(()=>{if(NET&&NET.role==='host'&&NET.peer===p&&(p.disconnected||NET.sig!=='ok'))hostReconnect(Math.min(8000,1000*NET.rcTries));},4000);
 },delay||0);
}
function hostRefresh(){ // al volver a la app: renovar la conexión con el servidor de salas aunque parezca viva
 if(!NET||NET.role!=='host')return;setSig('reconnecting');hostReconnect(0,true);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)hostRefresh();});
addEventListener('pageshow',e=>{if(e.persisted)hostRefresh();});
addEventListener('online',hostRefresh);
setInterval(()=>{if(NET&&NET.role==='host'&&NET.peer.disconnected&&!NET.peer.destroyed)hostReconnect(0);},8000);
function shareLink(){
 const url=$('llink').value,text='¡Únete a mi partida de Pixel Breach! Sala '+NET.code;
 if(navigator.share){navigator.share({title:'Pixel Breach',text,url}).catch(()=>{});return;}
 copyLink();
}
function copyLink(){const l=$('llink');try{navigator.clipboard.writeText(l.value).then(()=>{$('lcopy').textContent='¡COPIADO!';setTimeout(()=>$('lcopy').textContent='COPIAR',1500);},()=>{l.select();});}catch(e){l.select();}}
function lobbyPlayers(){
 const L=[{key:'host',name:displayName(),color:playerColor,skin:playerSkin,host:true,ready:true}];
 for(const [k,c] of NET.clients)L.push({key:k,name:c.name,color:c.color,skin:c.skin,ready:!!c.ready});
 return L;
}
const roomMode=()=>NET&&NET.role==='client'?(MODES[NET.mode]?NET.mode:'dm'):menuMode();
const roomMax=()=>MODES[roomMode()].max; // bandera: hasta 4 (una base por esquina)
function clampAIs(){const n=NET.role==='host'?NET.clients.size+1:(NET.lobby?NET.lobby.players.length:1);NET.ais=Math.max(n<2?1:0,Math.min(roomMax()-n,NET.ais));}
function hostBroadcast(msg){for(const c of NET.clients.values())if(c.conn.open)try{c.conn.send(msg);}catch(e){}}
function hostLobbyUpdate(go){clampAIs();hostBroadcast({t:'lobby',go:!!go,players:lobbyPlayers().map(p=>({key:p.key,name:p.name,color:p.color,skin:p.skin,host:!!p.host,ready:!!p.ready})),ais:NET.ais,an:(NET.aiNames||[]).slice(0,MAX_PLAYERS),diff,theme:themeChoice,fog:NET.fog,mode:menuMode(),preset:presetIdx(),code:NET.code});if(state==='lobby')renderLobby();}
function hostAccept(conn){
 conn.on('data',d=>{
  if(!d||typeof d!=='object')return;
  const c=NET&&NET.clients.get(conn.peer);if(c)c.seen=performance.now();
  if(d.t==='bye'){drop();try{conn.close();}catch(e){}return;} // el invitado salió de la sala
  if(d.t==='hello'&&!c){
   if(!sameMinor(d.ver)){conn.send({t:'version',host:VERSION});setTimeout(()=>conn.close(),600);showToast('ALGUIEN INTENTÓ ENTRAR CON OTRA VERSIÓN','#f87171');return;}
   if(NET.clients.size+1>=roomMax()){conn.send({t:'full',n:roomMax()});setTimeout(()=>conn.close(),400);return;}
   const used=new Set([playerColor,...[...NET.clients.values()].map(x=>x.color)]);
   let color=PALETTE.some(p=>p[1]===d.color)&&!used.has(d.color)?d.color:(PALETTE.find(p=>!used.has(p[1]))||PALETTE[0])[1];
   const name=cleanName(d.name);
   NET.clients.set(conn.peer,{conn,name,color,seen:performance.now(),skin:SKIN_ALL.includes(d.skin)?d.skin:'recruitM',ent:null,input:{}});
   const nc=NET.clients.get(conn.peer);
   if(state==='play'||state==='over'){ // partida en curso: entra como espectador y juega en la siguiente
    nc.spectator=true;
    conn.send({t:'welcome',color,code:NET.code,spectate:true});
    sendStart(nc,-1);
    emitEv({k:'feed',parts:[[name,color],[' mira la partida y entra en la siguiente','#cbd5e1']]});
    hostLobbyUpdate();
   }else{
    conn.send({t:'welcome',color,code:NET.code});
    hostLobbyUpdate();showToast(name+' ENTRÓ A LA SALA',color);snd('pick',0,0);
   }
  }else if(d.t==='ready'&&c&&state==='lobby'){ // un invitado avisa que está listo (o ya no)
   c.ready=!!d.r;if(!c.ready&&NET.count)hostCancelCount();hostLobbyUpdate();
  }else if(d.t==='skin'&&c&&state!=='play'){ // un invitado cambia su aspecto en la sala
   if(SKIN_ALL.includes(d.k)){c.skin=d.k;hostLobbyUpdate();}
  }else if(d.t==='color'&&c&&state!=='play'){ // un invitado cambia su color en la sala
   const taken=new Set([playerColor,...[...NET.clients.values()].filter(x=>x!==c).map(x=>x.color)]);
   if(PALETTE.some(p=>p[1]===d.c)&&!taken.has(d.c)){c.color=d.c;hostLobbyUpdate();}else hostLobbyUpdate();
  }else if(d.t==='i'&&c){
   const I={d:Number.isInteger(d.d)?d.d:-1,f:!!d.f,fc:d.fc|0,gc:d.gc|0,qc:d.qc|0};c.input=I;if(c.ent){c.ent.input=I;applyRemotePos(c.ent,d);}
  }
 });
 const drop=()=>{
  if(!NET||NET.role!=='host'||!NET.clients.has(conn.peer))return;
  const c=NET.clients.get(conn.peer);NET.clients.delete(conn.peer);
  if(c.ent&&!c.spectator){c.ent.gone=true;c.ent.alive=false;c.ent.respawnT=1e9;emitEv({k:'feed',parts:[[c.name,c.color],[' salió de la partida','#cbd5e1']]});}
  hostLobbyUpdate();
 };
 conn.on('close',drop);conn.on('error',drop);
 conn._pbDrop=drop;
}
function hostStart(){
 if(!NET||NET.role!=='host')return;
 clampAIs();
 const list=[...NET.clients.values()];
 startMatch([{name:displayName(),color:playerColor,skin:playerSkin},...list.map(c=>({name:c.name,color:c.color,skin:c.skin}))],NET.ais,NET.aiNames);
 list.forEach((c,i)=>{c.spectator=false;c.ent=ents[i+1];c.ent.input=c.input||{};c.ent.lfc=c.input.fc|0;c.ent.lgc=c.input.gc|0;c.ent.lqc=c.input.qc|0;});
 list.forEach((c,i)=>sendStart(c,i+1)); // quienes esperaban como espectadores ya juegan
 NET.sentGrid=gridVer;NET.sendT=0;
}
function sendStart(c,id){ // id -1 = espectador
 const roster=ents.map(e=>({n:e.name,c:e.color,s:e.style,k:e.skin,h:e.isPlayer?1:0}));
 try{c.conn.send({t:'start',myId:id,roster,diff,theme:themeKey,fog:NET.fog,mt:matchTime,fl:isFinite(fragLimit)?fragLimit:0,mode:gameMode,cl:capLimit,lv:lifeCount,g:gridStr()});}catch(e){}
}
function hostToLobby(){hostCancelCount(true);state='lobby';for(const c of NET.clients.values()){c.ready=false;c.spectator=false;}hostLobbyUpdate(true);}
// ---- listos y cuenta regresiva: EMPEZAR solo cuando todos los invitados están listos; luego 3… 2… 1… para todos ----
function allReady(){for(const c of NET.clients.values())if(!c.spectator&&!c.ready)return false;return true;}
function readyCount(){let r=0,n=0;for(const c of NET.clients.values()){if(c.spectator)continue;n++;if(c.ready)r++;}return [r,n];}
function hostCountdown(){
 if(!NET||NET.role!=='host'||NET.count)return;
 if(state==='lobby'&&!allReady())return;
 NET.count={n:3};const tick=()=>{if(!NET||!NET.count)return;const n=NET.count.n;hostBroadcast({t:'count',n});showCount(n);
  if(n<=0){NET.count=null;hostStart();return;}NET.count.n--;NET.count.t=setTimeout(tick,1000);};
 tick();if(state==='lobby')renderLobby();
}
function hostCancelCount(silent){if(!NET||!NET.count)return;clearTimeout(NET.count.t);NET.count=null;hostBroadcast({t:'count',n:-1});showCount(-1);if(!silent&&state==='lobby')renderLobby();}
function showCount(n){ // n>0: número; 0: ¡YA!; -1: se oculta
 const el=$('countdown');if(!el)return;
 if(n<0){el.style.display='none';return;}
 el.style.display='flex';$('cdNum').textContent=n>0?String(n):'¡YA!';el.querySelector('small').style.visibility=n>0?'visible':'hidden';
 sfx(n>0?'tick':'go');if(n===0)setTimeout(()=>{if($('countdown').style.display!=='none'&&$('cdNum').textContent==='¡YA!')el.style.display='none';},700);
}
function gridStr(){let r='';for(let i=0;i<grid.length;i++)r+=grid[i]===CRATE?String(1+crateHP[i]):grid[i]===LAVA?'5':String(grid[i]);return r;}
function applyGridStr(g){for(let i=0;i<g.length&&i<grid.length;i++){const c=+g[i];if(c>=2&&c<=4){grid[i]=CRATE;crateHP[i]=c-1;}else{grid[i]=c===5?LAVA:c===1?WALL:FLOOR;crateHP[i]=0;}}}
function statRow(e){const s=e.st||{};const kw=s.kw||{};let fav=-1,best=0;for(const k in kw)if(kw[k]>best){best=kw[k];fav=WIDX.indexOf(k);}return [s.shots|0,s.hits|0,fav,s.nades|0,s.picks|0,s.best|0];}
function snapshot(){
 const r=v=>Math.round(Math.max(0,v)*10)/10;
 const snap={t:'s',st:state,tl:r(timeLeft),w:winner?winner.id:-1,
  e:ents.map(e=>[Math.round(e.x),Math.round(e.y),DIRS.indexOf(e.dir),e.moving?1:0,Math.ceil(Math.max(0,e.hp)),e.alive?1:0,r(e.invulnT),r(e.hurtT),r(e.blindT),e.frags,e.deaths,WIDX.indexOf(e.weapon),r(Math.min(99,e.respawnT)),
   e.isPlayer?[e.inv.smg,e.inv.shotgun,e.inv.rifle,e.inv.frag,e.inv.flash]:0,
   e.isPlayer?0:(()=>{const o={};for(const k in e.ai.known)if(ents[k]&&ents[k].isPlayer)o[k]=e.ai.known[k].seen?1:0;return o;})(),e.gone?1:0,e.tp|0,state==='over'&&e.isPlayer?statRow(e):0,e.caps|0,e.lives|0,e.out?1:0]),
  b:bullets.map(b=>[Math.round(b.x),Math.round(b.y),Math.round(b.vx),Math.round(b.vy),b.color,Math.max(0,Math.round((b.vis||0)-b.trav))]),
  n:nades.map(g=>[Math.round(g.x),Math.round(g.y),g.type==='frag'?0:1,r(g.fuse)]),
  p:pickups.map(p=>[p.tx,p.ty,p.type,p.life===undefined?-1:r(p.life)]),
  ev:netEvents};
 if(flag)snap.fl=[Math.round(flag.x),Math.round(flag.y),flag.carrier,r(flag.dropT)];
 if(NET.sentGrid!==gridVer){snap.g=gridStr();NET.sentGrid=gridVer;}
 return snap;
}
// --- invitado ---
const JOIN_TIMEOUT=12000; // si en 12 s no hay respuesta, se avisa (el relevo puede tardar unos segundos más)
function goneMsg(code){return 'La sala '+code+' ya no está activa o no existe. Pide a quien te invitó un enlace nuevo.';}
function noRouteMsg(code){return 'La sala '+code+' existe, pero no se pudo conectar con el anfitrión por la red. Intenta de nuevo; si sigue igual, que alguno de los dos se conecte a Wi-Fi.';}
function setJoining(on,code){ // el botón muestra que algo está pasando y no se puede presionar dos veces
 for(const id of ['joinInvite','joinBtn']){const b=$(id);if(!b)continue;b.disabled=on;b.style.opacity=on?.6:1;}
 $('joinInvite').textContent=on?'CONECTANDO…':(inviteCode?'REINTENTAR':'UNIRSE');
 $('joinBtn').textContent=on?'…':'UNIRSE';
}
async function joinRoom(code){
 if(NET||netBusy)return;code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(code.length!==4){netMsg('El código de sala tiene 4 letras o números.');return;}
 setJoining(true,code);netMsg('Buscando la sala '+code+'…',true);
 try{await loadPeer();}catch(e){setJoining(false);netMsg('No se pudo cargar el modo en línea. Revisa tu conexión a internet.');return;}
 netBusy=true;const ice=await iceServers();netBusy=false;if(NET){setJoining(false);return;}
 const peer=new Peer(undefined,peerOpts(ice));
 NET={role:'client',peer,code,conn:null,fc:0,gc:0,qc:0,inT:0,welcomed:false,lobby:null,lastIn:''};
 const mine=NET;
 const fail=t=>{clearTimeout(timer);if(NET===mine){netLeave(t);setJoining(false);}};
 /* el servidor de salas avisa enseguida si el código no existe (peer-unavailable); si eso no pasó y aun así
    no hay conexión, la sala existe pero la red no deja llegar al anfitrión */
 const lost=()=>mine.conn&&!mine.connOpen?noRouteMsg(code):goneMsg(code);
 const timer=setTimeout(()=>{if(NET===mine&&!mine.welcomed)fail(lost());},JOIN_TIMEOUT);
 peer.on('open',()=>{
  const conn=peer.connect(peerIdFor(code),{reliable:true,serialization:'json'});mine.conn=conn;
  conn.on('open',()=>{mine.connOpen=true;conn.send({t:'hello',name:displayName(),color:playerColor,skin:playerSkin,v:PROTO,ver:VERSION});});
  conn.on('data',d=>{if(NET===mine){if(d&&d.t==='welcome'){clearTimeout(timer);setJoining(false);}clientOnData(d);}});
  conn.on('close',()=>fail(mine.welcomed?'Se cerró la conexión con el anfitrión.':lost()));
  conn.on('error',()=>fail(mine.welcomed?'Se perdió la conexión con el anfitrión.':lost()));
 });
 peer.on('error',err=>{
  if(err.type==='peer-unavailable')fail(goneMsg(code));
  else if(['network','server-error','socket-error','socket-closed'].includes(err.type))fail('No se pudo conectar al servidor de salas. Revisa tu internet e intenta de nuevo.');
  else fail('No se pudo entrar a la sala '+code+' ('+err.type+').');
 });
}
function clientOnData(d){
 if(!d||typeof d!=='object')return;
 switch(d.t){
  case 'welcome':NET.welcomed=true;NET.spectating=!!d.spectate;if(inviteCode)clearInvite();if(PALETTE.some(p=>p[1]===d.color))NET.color=d.color;if(!d.spectate)state='lobby';netMsg('');break;
  case 'version':netLeave(`La sala usa la versión v${String(d.host).replace(/[^0-9.]/g,'').slice(0,12)} y tú tienes la v${VERSION}. Recarga la página (Ctrl+Shift+R) para actualizar; si sigue igual, pide a quien te invitó que también recargue.`);break;
  case 'full':netLeave('La sala está llena (máximo '+((d.n|0)>0&&(d.n|0)<=MAX_PLAYERS?d.n|0:MAX_PLAYERS)+' combatientes).');break;
  case 'busy':netLeave('La partida ya empezó. Intenta de nuevo cuando termine.');break;
  case 'closed':netLeave('El anfitrión cerró la sala.');break;
  case 'lobby':NET.lobby=d;{const me=Array.isArray(d.players)&&d.players.find(p=>p.key===NET.peer.id);if(me)NET.ready=!!me.ready;}if(d.go||state==='lobby')state='lobby';/* solo cambia de pantalla si el anfitrión regresa a la sala */if(Number.isInteger(d.diff)&&DIFF[d.diff])diff=d.diff;{const mine=Array.isArray(d.players)&&d.players.find(p=>p.key===NET.peer.id);if(mine&&PALETTE.some(p=>p[1]===mine.color)){NET.color=mine.color;if(playerColor!==mine.color){playerColor=mine.color;save();buildSwatches();}}}
  NET.fog=d.fog!==false;NET.mode=MODES[d.mode]?d.mode:'dm';if(MODES[NET.mode].p[d.preset])NET.preset=d.preset;if(THEME_OPTS.includes(d.theme))themeChoice=d.theme;$('tname').textContent=themeLabel(themeChoice);renderLobby();break;
  case 'count':{const n=d.n|0;NET.counting=n>0;showCount(n);if(state==='lobby')renderLobby();}break;
  case 'start':showCount(-1);NET.counting=false;clientStart(d);break;
  case 's':if(state==='play'||state==='over')applySnapshot(d);break;
 }
}
function clientStart(d){
 if(!Array.isArray(d.roster))return;
 myId=d.myId|0;if(DIFF[d.diff])diff=d.diff;setTheme(d.theme);NET.fog=d.fog!==false;
 grid=new Uint8Array(COLS*ROWS);crateHP=new Uint8Array(COLS*ROWS);vis=new Uint8Array(COLS*ROWS).fill(1);applyGridStr(String(d.g||''));
 ents=d.roster.slice(0,9).map((r,i)=>({id:i,isPlayer:!!r.h,name:cleanName(r.n),style:r.s?String(r.s).slice(0,12):null,color:/^#[0-9a-f]{6}$/i.test(r.c)?r.c:'#94a3b8',skin:SKIN_ALL.includes(r.k)?r.k:'recruitM',
  x:-99,y:-99,nx:-99,ny:-99,tx:0,ty:0,ntx:0,nty:0,speed:PLAYER_SPEED,tp:-1,dir:RIGHT,moving:false,hp:100,alive:false,invulnT:0,hurtT:0,blindT:0,frags:0,deaths:0,weapon:'pistol',respawnT:0,
  inv:{pistol:Infinity,smg:0,shotgun:0,rifle:0,frag:1,flash:0},aw:{},gone:false}));
 if(myId>=0&&!ents[myId])myId=-1;NET.spectating=myId<0;
 if(d.mt>0&&d.mt<=3600)matchTime=d.mt;gameMode=MODES[d.mode]?d.mode:'dm';fragLimit=gameMode==='dm'?(d.fl>0&&d.fl<=99?d.fl:fragLimit):Infinity;
 if(d.cl>0&&d.cl<=9)capLimit=d.cl|0;if(d.lv>0&&d.lv<=9)lifeCount=d.lv|0;
 ents.forEach((e,i)=>{e.caps=0;e.lives=lifeCount;e.out=false;e.base=i%4;});flag=gameMode==='ctf'?{x:FLAG_HOME[0]*T+T/2,y:FLAG_HOME[1]*T+T/2,carrier:-1,dropT:0}:null;goalSign=myId>=0?{text:modeGoal(),t:3.2}:null;
 bullets=[];nades=[];pickups=[];parts=[];fx=[];feed=[];heard=[];toast=null;timeLeft=matchTime;announce=null;winner=null;shake=0;flashA=0;paused=false;
 NET.fc=NET.gc=NET.qc=0;NET.lastSnap=performance.now();state='play';sendInput();
 if(NET.spectating)showToast('ESTÁS VIENDO LA PARTIDA','#facc15');else showToast('ESCENARIO: '+theme.name,'#facc15');
}
function applySnapshot(s){
 NET.lastSnap=performance.now();
 if(typeof s.g==='string')applyGridStr(s.g);
 if(Array.isArray(s.e))s.e.forEach((a,i)=>{const e=ents[i];if(!e||!Array.isArray(a))return;
  const wasAlive=e.alive,mine=i===myId;
  e.nx=a[0];e.ny=a[1];if(!mine){e.dir=DIRS[a[2]]||e.dir;e.moving=!!a[3];}e.hp=a[4];e.alive=!!a[5];e.invulnT=a[6];e.hurtT=a[7];e.blindT=a[8];e.frags=a[9];e.deaths=a[10];e.weapon=WIDX[a[11]]||'pistol';e.respawnT=a[12];
  if(Array.isArray(a[13]))e.inv={pistol:Infinity,smg:a[13][0],shotgun:a[13][1],rifle:a[13][2],frag:a[13][3],flash:a[13][4]};
  e.aw=a[14]||{};e.gone=!!a[15];if(Array.isArray(a[17]))e.stc=a[17];e.caps=a[18]|0;e.lives=a[19]|0;e.out=!!a[20];
  if(mine){ // mi soldado: se mueve en mi pantalla; solo me ajusto al reaparecer o si el anfitrión me corrige
   const tp=a[16]|0;
   if(!e.alive||tp!==e.tp){e.tp=tp;e.x=e.nx;e.y=e.ny;e.tx=e.ntx=wx(Math.floor(e.x/T));e.ty=e.nty=Math.floor(e.y/T);e.x=e.tx*T+T/2;e.y=e.ty*T+T/2;e.moving=false;if(DIRS[a[2]])e.dir=DIRS[a[2]];}
  }else if(!wasAlive&&e.alive){e.x=e.nx;e.y=e.ny;}
 });
 if(Array.isArray(s.b))bullets=s.b.map(a=>({x:a[0],y:a[1],vx:a[2],vy:a[3],color:String(a[4]).slice(0,7),vis:+a[5]||0,trav:0}));
 if(Array.isArray(s.n))nades=s.n.map(a=>({x:a[0],y:a[1],vx:0,vy:0,type:a[2]?'flash':'frag',fuse:a[3]}));
 if(Array.isArray(s.p))pickups=s.p.filter(a=>PICK[a[2]]).map(a=>({tx:a[0],ty:a[1],type:a[2],t:clock+a[0],life:a[3]<0?undefined:a[3]}));
 if(flag&&Array.isArray(s.fl)){flag.x=+s.fl[0]||0;flag.y=+s.fl[1]||0;flag.carrier=Number.isInteger(s.fl[2])&&ents[s.fl[2]]?s.fl[2]:-1;flag.dropT=+s.fl[3]||0;}
 if(Array.isArray(s.ev))for(const ev of s.ev)if(ev&&typeof ev==='object')try{applyEv(ev);}catch(e){}
 timeLeft=+s.tl||0;
 if(s.st==='over'&&state!=='over'){state='over';winner=ents[s.w]||null;if(winner)onMatchEnd();}
}
function clientUpdate(dt){
 const m=me();
 if(m&&m.alive&&m.tp>=0)stepMove(m,heldDir(),dt,true); // respuesta inmediata a mis controles
 for(const e of ents){
  if(e.nx===undefined)continue;
  if(e===m&&e.alive&&e.tp>=0){e.invulnT-=dt;e.hurtT-=dt;e.blindT-=dt;e.respawnT-=dt;continue;}
  const d=Math.hypot(e.nx-e.x,e.ny-e.y);
  if(d>T*1.5){e.x=e.nx;e.y=e.ny;}else{const k=Math.min(1,dt*18);e.x+=(e.nx-e.x)*k;e.y+=(e.ny-e.y)*k;}
  e.invulnT-=dt;e.hurtT-=dt;e.blindT-=dt;e.respawnT-=dt;
 }
 for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.trav=(b.trav||0)+Math.hypot(b.vx,b.vy)*dt;}
 for(const g of nades)g.fuse-=dt;
 for(const p of pickups){p.t+=dt;if(p.life!==undefined)p.life-=dt;}
 timeLeft=Math.max(0,timeLeft-dt);
 tickFx(dt);
}
function sendInput(){
 if(!NET||NET.role!=='client'||!NET.conn||!NET.conn.open)return;
 const hd=heldDir(),m={t:'i',d:hd?DIRS.indexOf(hd):-1,f:!!(keys.Space||keys.KeyJ),fc:NET.fc,gc:NET.gc,qc:NET.qc};
 const mm=me();if(mm&&mm.alive){m.x=Math.round(mm.x);m.y=Math.round(mm.y);m.dr=DIRS.indexOf(mm.dir);m.mv=mm.moving?1:0;m.tp=mm.tp|0;}
 try{NET.conn.send(m);}catch(e){}NET.inT=0;
}
function netTick(dt){
 if(NET.role==='host'){
  NET.sendT+=dt;
  if(NET.sendT>=.05&&(state==='play'||state==='over')){NET.sendT=0;if(NET.clients.size)hostBroadcast(snapshot());netEvents=[];}
 }else{
  NET.inT+=dt;if(NET.inT>=.05&&state==='play')sendInput();
  if(state==='play'||state==='over'){
   const quiet=(performance.now()-(NET.lastSnap||performance.now()))/1000;
   NET.hostQuiet=quiet;
   if(quiet>15)netLeave('Se perdió la conexión con el anfitrión: cerró el juego, se le bloqueó la pantalla o se quedó sin internet.');
  }
 }
}
// --- pantalla de sala ---
function myLobbyColor(){
 if(!NET)return playerColor;if(NET.role==='host')return playerColor;
 const me=NET.lobby&&NET.lobby.players.find(p=>p.key===NET.peer.id);return me?me.color:(NET.color||playerColor);
}
function pickLobbyColor(c){
 if(!NET||state!=='lobby')return;
 playerColor=c;save();buildSwatches();
 if(NET.role==='host')hostLobbyUpdate();else{try{NET.conn.send({t:'color',c});}catch(e){}}
}
function renderLobby(){
 if(!NET)return;
 const host=NET.role==='host';
 let players,ais;
 if(host){players=lobbyPlayers();clampAIs();ais=NET.ais;}
 else{const L=NET.lobby;players=L?L.players:[];ais=L?L.ais:0;}
 $('lcode').textContent=NET.code;$('llink').value=linkFor(NET.code);
 {const st=$('lstatus');st.style.display=host?'':'none';const ok=NET.sig!=='reconnecting';st.className=ok?'ok':'rc';st.textContent=ok?'● SALA ACTIVA: ya pueden unirse':'● RECONECTANDO LA SALA…';}
 $('lshare').style.display=navigator.share?'':'none';
 const box=$('lplayers');box.textContent='';
 players.forEach(p=>{const r=document.createElement('div');const i=document.createElement('i');i.style.background=/^#[0-9a-f]{6}$/i.test(p.color)?p.color:'#94a3b8';
  const n=document.createElement('span');n.textContent=cleanName(p.name);const sm=document.createElement('small');sm.textContent=[p.host?'anfitrión':'',SKIN_ALL.includes(p.skin)?skinOf(p.skin).n.toLowerCase():''].filter(Boolean).join(' · ');
  const rd=document.createElement('em');rd.className=p.ready?'rdy on':'rdy';rd.textContent=p.host?'':p.ready?'✓ LISTO':'esperando';
  r.append(i,n,sm,rd);box.appendChild(r);});
 const an=host?NET.aiNames:(NET.lobby&&Array.isArray(NET.lobby.an)?NET.lobby.an:[]);
 for(let i=0;i<ais;i++){const r=document.createElement('div');r.innerHTML='<i style="background:#475569"></i><span style="color:#64748b"></span>';r.querySelector('span').textContent='IA'+(an&&an[i]?' · '+cleanName(an[i]):'');box.appendChild(r);}
 $('aiCount').textContent=String(ais);$('ldName').textContent=DIFF[diff].name;$('ltName').textContent=themeLabel(themeChoice);$('lfName').textContent=NET.fog!==false?'SÍ':'NO';
 document.querySelectorAll('#lobby .hostonly').forEach(b=>b.style.display=host?'':'none');
 document.querySelectorAll('#lobby .hostrow').forEach(b=>b.style.display=host?'':'none');
 $('lwait').style.display=host?'none':'';
 if(host){const [r,n]=readyCount(),st=$('lstart');st.disabled=!NET.count&&n>0&&r<n;
  st.textContent=NET.count?'CANCELAR':n>0&&r<n?`ESPERANDO (${r}/${n} LISTOS)`:'EMPEZAR';st.style.opacity=st.disabled?.55:1;}
 else{const b=$('lready');b.textContent=NET.ready?'✓ LISTO':'ESTOY LISTO';b.classList.toggle('on',!!NET.ready);b.disabled=!!NET.counting;
  $('lwait').textContent=NET.counting?'¡La partida está por empezar!':NET.ready?'Esperando a que el anfitrión empiece…':'Toca ESTOY LISTO cuando estés preparado.';}
 document.querySelectorAll('#lobby .clientonly').forEach(b=>b.style.display=host?'none':'');
 $('lsummary').style.display=host?'none':'';
 {const m=roomMode();$('lmName').textContent=MODES[m].n;$('lpName').textContent=presetLabel(host?presetIdx(m):(NET.preset??1),m);
  $('lnote').textContent=NET.note||(m==='ctf'?'Captura la bandera: máximo 4 combatientes, una base por esquina. Comparte el enlace o el código.':'Máximo 5 combatientes por partida (humanos + IAs). Comparte el enlace o el código.');}
 $('lsummary').textContent=`${MODES[roomMode()].n} · ${presetLabel(host?presetIdx():(NET.preset??1),roomMode())} · ${ais} IA${ais===1?'':'s'} · ${themeLabel(themeChoice)} · NIEBLA ${NET.fog!==false?'SÍ':'NO'} · ${DIFF[diff].name}`;
 // color: el selector salta los colores que ya tomó otro jugador
 NET.taken=new Set(players.filter(p=>(host?p.key!=='host':p.key!==NET.peer.id)).map(p=>p.color));
 showColor($('lcname'),myLobbyColor());showSkin();
 $('lshare').textContent=isTouch&&navigator.share?'COMPARTIR ENLACE':'COMPARTIR';
}
function lobbyStepColor(d){if(!NET||state!=='lobby')return;const c=stepColor(d,NET.taken);if(c)pickLobbyColor(c);}
$('lcprev').addEventListener('click',()=>lobbyStepColor(-1));$('lcnext').addEventListener('click',()=>lobbyStepColor(1));
swipeColor($('lpv'),d=>lobbyStepColor(d));
$('mkRoom').addEventListener('click',()=>{audio();createRoom();});
$('joinBtn').addEventListener('click',()=>{audio();joinRoom($('jcode').value);});
$('jcode').addEventListener('input',()=>{const el=$('jcode');el.value=el.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);});
$('lleave').addEventListener('click',()=>netLeave());
$('lstart').addEventListener('click',()=>{audio();if(NET&&NET.count)hostCancelCount();else hostCountdown();});
$('lready').addEventListener('click',()=>{audio();if(!NET||NET.role!=='client'||NET.counting)return;NET.ready=!NET.ready;try{NET.conn.send({t:'ready',r:NET.ready});}catch(e){}renderLobby();});
$('aiMinus').addEventListener('click',()=>{NET.ais--;hostLobbyUpdate();});
$('aiPlus').addEventListener('click',()=>{NET.ais++;hostLobbyUpdate();});
$('ldPrev').addEventListener('click',()=>{diff=Math.max(1,diff-1);hostLobbyUpdate();});
$('ltPrev').addEventListener('click',()=>{stepTheme(-1);hostLobbyUpdate();});
$('lpPrev').addEventListener('click',()=>{stepPreset(-1);hostLobbyUpdate();});
function lobbyStepMode(d){if(!NET||NET.role!=='host')return;const n=NET.clients.size+1,before=n+NET.ais;stepMode(d,n);clampAIs();
 const cut=before-(n+NET.ais);NET.note=cut>0?`Este modo es de hasta ${roomMax()}: ${cut===1?'hay una IA de más y se quitó':`se quitaron ${cut} IAs`}.`:'';clearTimeout(NET.noteT);NET.noteT=setTimeout(()=>{if(NET){NET.note='';if(state==='lobby')renderLobby();}},4000);hostLobbyUpdate();}
$('lmPrev').addEventListener('click',()=>lobbyStepMode(-1));$('lmNext').addEventListener('click',()=>lobbyStepMode(1));$('lpNext').addEventListener('click',()=>{stepPreset(1);hostLobbyUpdate();});
$('lfPrev').addEventListener('click',()=>{NET.fog=!NET.fog;hostLobbyUpdate();});$('lfNext').addEventListener('click',()=>{NET.fog=!NET.fog;hostLobbyUpdate();});$('ltNext').addEventListener('click',()=>{stepTheme(1);hostLobbyUpdate();});
$('ldNext').addEventListener('click',()=>{diff=Math.min(4,diff+1);hostLobbyUpdate();});
$('lcopy').addEventListener('click',copyLink);
$('lshare').addEventListener('click',shareLink);
// enlace de invitación: pixel-breach/#K7QF
const CALLSIGNS=['HALCON','LOBO','COBRA','TITAN','RAYO','SOMBRA','PUMA','JAGUAR','CUERVO','TIGRE','BUHO','FENIX'];
let inviteCode=null;
function readInvite(){
 const m=location.hash.match(/^#([A-Za-z0-9]{4})$/);if(!m||NET)return;
 inviteCode=m[1].toUpperCase();$('jcode').value=inviteCode;
 if(!playerName.trim()){playerName=CALLSIGNS[ri(0,CALLSIGNS.length-1)]+ri(10,99);nameEl.value=playerName;save();} // nombre sugerido, se puede cambiar
 menuEl.classList.add('invite');$('joinInvite').textContent='UNIRSE A LA SALA '+inviteCode;
 netMsg('Te invitaron a una partida en línea.',true);
}
function clearInvite(){inviteCode=null;menuEl.classList.remove('invite');try{history.replaceState(null,'',location.href.split('#')[0]);}catch(e){}}
$('joinInvite').addEventListener('click',()=>{audio();joinRoom(inviteCode);});
$('inviteCancel').addEventListener('click',()=>{clearInvite();netMsg('');});
readInvite();addEventListener('hashchange',readInvite);
addEventListener('beforeunload',()=>{if(NET&&NET.role==='host')try{hostBroadcast({t:'closed'});}catch(e){}});


// En la sala, los invitados avisan cada 3 s que siguen ahí; el anfitrión saca a quien lleva 12 s sin dar señales
// (por ejemplo, si cerró la pestaña sin salir), para que no se quede esperando a alguien que ya no está.
setInterval(()=>{
 if(!NET)return;
 if(NET.role==='client'&&NET.conn&&NET.conn.open&&NET.welcomed){try{NET.conn.send({t:'ping'});}catch(e){}}
 if(NET.role==='host'&&state==='lobby'){const now=performance.now();for(const c of [...NET.clients.values()])if(c.seen&&now-c.seen>12000&&c.conn._pbDrop)c.conn._pbDrop();}
},3000);
