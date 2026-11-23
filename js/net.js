'use strict';
// Pixel Breach — Modo en línea (PeerJS/WebRTC), sala y espectadores
// ---------- EN LÍNEA (PeerJS / WebRTC: conexión directa entre navegadores, sin cuentas) ----------
// El anfitrión simula la partida completa (IAs incluidas) y manda "fotos" del estado 20 veces por segundo.
// Los invitados solo mandan lo que presionan y dibujan lo que reciben.
const ONLINE_URL='https://chuckgarcia.github.io/pixel-breach/';
const MAX_PLAYERS=5,PROTO=2,WIDX=['pistol','smg','shotgun','rifle','frag','flash'];
let NET=null,peerLib=null;
const peerIdFor=c=>'pixelbreach-v1-'+c.toLowerCase();
function genCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let r='';for(let i=0;i<4;i++)r+=A[Math.floor(Math.random()*A.length)];return r;}
function sameMinor(v){const a=String(v||'').split('.'),b=VERSION.split('.');return a.length===3&&a[0]===b[0]&&a[1]===b[1];}
function cleanName(n){return String(n||'').toUpperCase().replace(/[^A-Z0-9ÑÁÉÍÓÚÜ _-]/g,'').trim().slice(0,10)||'JUGADOR';}
function peerOpts(){ // ?ps=host:puerto solo para pruebas con un servidor propio
 const m=location.search.match(/[?&]ps=([^&]+)/);if(!m)return {debug:0};
 const [host,port]=decodeURIComponent(m[1]).split(':');return {host,port:+port,path:'/',secure:false,debug:0,config:{iceServers:[]}};
}
function loadPeer(){
 if(peerLib)return peerLib;
 peerLib=new Promise((ok,ko)=>{if(window.Peer)return ok();const sc=document.createElement('script');sc.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';sc.onload=()=>window.Peer?ok():ko();sc.onerror=()=>{peerLib=null;ko();};document.head.appendChild(sc);});
 return peerLib;
}
function netMsg(t,ok){const m=$('netMsg');if(t&&!ok&&!/github\.io|127\.0\.0\.1|localhost/.test(location.host))t+=' El modo en línea funciona en '+ONLINE_URL.replace('https://','');m.textContent=t||'';m.classList.toggle('ok',!!ok);} /* classList: no borrar la clase 'inv' que lo mantiene visible en la pantalla de invitación */
function netLeave(msg){
 if(NET){try{if(NET.role==='host')for(const c of NET.clients.values())try{c.conn.send({t:'closed'});}catch(e){}}catch(e){}
  const pr=NET.peer;setTimeout(()=>{try{pr.destroy();}catch(e){}},200);}
 NET=null;toTitle();netMsg(msg||'');
}
function linkFor(code){return location.href.split('#')[0]+'#'+code;}
// --- anfitrión ---
async function createRoom(){
 if(NET)return;netMsg('Creando sala…',true);
 try{await loadPeer();}catch(e){netMsg('No se pudo cargar el modo en línea. Revisa tu conexión.');return;}
 const attempt=(tries)=>{
  const code=genCode(),peer=new Peer(peerIdFor(code),peerOpts());let opened=false;
  peer.on('open',()=>{opened=true;NET={role:'host',peer,code,clients:new Map(),ais:Math.max(1,MAX_PLAYERS-2),sendT:0,fog:true};myId=0;state='lobby';netMsg('');renderLobby();});
  peer.on('connection',conn=>hostAccept(conn));
  peer.on('disconnected',()=>{try{peer.reconnect();}catch(e){}});
  peer.on('error',err=>{
   if(!opened&&err.type==='unavailable-id'&&tries<4){try{peer.destroy();}catch(e){}attempt(tries+1);return;}
   if(!opened){try{peer.destroy();}catch(e){}netMsg('No se pudo crear la sala ('+err.type+').');}
  });
 };attempt(0);
}
function lobbyPlayers(){
 const L=[{key:'host',name:displayName(),color:playerColor,host:true}];
 for(const [k,c] of NET.clients)L.push({key:k,name:c.name,color:c.color});
 return L;
}
function clampAIs(){const n=NET.role==='host'?NET.clients.size+1:(NET.lobby?NET.lobby.players.length:1);NET.ais=Math.max(n<2?1:0,Math.min(MAX_PLAYERS-n,NET.ais));}
function hostBroadcast(msg){for(const c of NET.clients.values())if(c.conn.open)try{c.conn.send(msg);}catch(e){}}
function hostLobbyUpdate(go){clampAIs();hostBroadcast({t:'lobby',go:!!go,players:lobbyPlayers().map(p=>({key:p.key,name:p.name,color:p.color,host:!!p.host})),ais:NET.ais,diff,theme:themeChoice,fog:NET.fog,preset:SETTINGS.preset,code:NET.code});if(state==='lobby')renderLobby();}
function hostAccept(conn){
 conn.on('data',d=>{
  if(!d||typeof d!=='object')return;
  const c=NET&&NET.clients.get(conn.peer);
  if(d.t==='hello'&&!c){
   if(!sameMinor(d.ver)){conn.send({t:'version',host:VERSION});setTimeout(()=>conn.close(),600);showToast('ALGUIEN INTENTÓ ENTRAR CON OTRA VERSIÓN','#f87171');return;}
   if(NET.clients.size+1>=MAX_PLAYERS){conn.send({t:'full'});setTimeout(()=>conn.close(),400);return;}
   const used=new Set([playerColor,...[...NET.clients.values()].map(x=>x.color)]);
   let color=PALETTE.some(p=>p[1]===d.color)&&!used.has(d.color)?d.color:(PALETTE.find(p=>!used.has(p[1]))||PALETTE[0])[1];
   const name=cleanName(d.name);
   NET.clients.set(conn.peer,{conn,name,color,ent:null,input:{}});
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
}
function hostStart(){
 if(!NET||NET.role!=='host')return;
 clampAIs();
 const list=[...NET.clients.values()];
 startMatch([{name:displayName(),color:playerColor},...list.map(c=>({name:c.name,color:c.color}))],NET.ais);
 list.forEach((c,i)=>{c.spectator=false;c.ent=ents[i+1];c.ent.input=c.input||{};c.ent.lfc=c.input.fc|0;c.ent.lgc=c.input.gc|0;c.ent.lqc=c.input.qc|0;});
 list.forEach((c,i)=>sendStart(c,i+1)); // quienes esperaban como espectadores ya juegan
 NET.sentGrid=gridVer;NET.sendT=0;
}
function sendStart(c,id){ // id -1 = espectador
 const roster=ents.map(e=>({n:e.name,c:e.color,s:e.style,h:e.isPlayer?1:0}));
 try{c.conn.send({t:'start',myId:id,roster,diff,theme:themeKey,fog:NET.fog,mt:matchTime,fl:fragLimit,g:gridStr()});}catch(e){}
}
function hostToLobby(){state='lobby';hostLobbyUpdate(true);}
function gridStr(){let r='';for(let i=0;i<grid.length;i++)r+=grid[i]===CRATE?String(1+crateHP[i]):grid[i]===LAVA?'5':String(grid[i]);return r;}
function applyGridStr(g){for(let i=0;i<g.length&&i<grid.length;i++){const c=+g[i];if(c>=2&&c<=4){grid[i]=CRATE;crateHP[i]=c-1;}else{grid[i]=c===5?LAVA:c===1?WALL:FLOOR;crateHP[i]=0;}}}
function statRow(e){const s=e.st||{};const kw=s.kw||{};let fav=-1,best=0;for(const k in kw)if(kw[k]>best){best=kw[k];fav=WIDX.indexOf(k);}return [s.shots|0,s.hits|0,fav,s.nades|0,s.picks|0,s.best|0];}
function snapshot(){
 const r=v=>Math.round(Math.max(0,v)*10)/10;
 const snap={t:'s',st:state,tl:r(timeLeft),w:winner?winner.id:-1,
  e:ents.map(e=>[Math.round(e.x),Math.round(e.y),DIRS.indexOf(e.dir),e.moving?1:0,Math.ceil(Math.max(0,e.hp)),e.alive?1:0,r(e.invulnT),r(e.hurtT),r(e.blindT),e.frags,e.deaths,WIDX.indexOf(e.weapon),r(Math.min(99,e.respawnT)),
   e.isPlayer?[e.inv.smg,e.inv.shotgun,e.inv.rifle,e.inv.frag,e.inv.flash]:0,
   e.isPlayer?0:(()=>{const o={};for(const k in e.ai.known)if(ents[k]&&ents[k].isPlayer)o[k]=e.ai.known[k].seen?1:0;return o;})(),e.gone?1:0,e.tp|0,state==='over'&&e.isPlayer?statRow(e):0]),
  b:bullets.map(b=>[Math.round(b.x),Math.round(b.y),Math.round(b.vx),Math.round(b.vy),b.color]),
  n:nades.map(g=>[Math.round(g.x),Math.round(g.y),g.type==='frag'?0:1,r(g.fuse)]),
  p:pickups.map(p=>[p.tx,p.ty,p.type,p.life===undefined?-1:r(p.life)]),
  ev:netEvents};
 if(NET.sentGrid!==gridVer){snap.g=gridStr();NET.sentGrid=gridVer;}
 return snap;
}
// --- invitado ---
const JOIN_TIMEOUT=9000; // si en 9 s la sala no responde, se da por cerrada
function goneMsg(code){return 'La sala '+code+' ya no está activa o no existe. Pide a quien te invitó un enlace nuevo.';}
function setJoining(on,code){ // el botón muestra que algo está pasando y no se puede presionar dos veces
 for(const id of ['joinInvite','joinBtn']){const b=$(id);if(!b)continue;b.disabled=on;b.style.opacity=on?.6:1;}
 $('joinInvite').textContent=on?'CONECTANDO…':(inviteCode?'REINTENTAR':'UNIRSE');
 $('joinBtn').textContent=on?'…':'UNIRSE';
}
async function joinRoom(code){
 if(NET)return;code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(code.length!==4){netMsg('El código de sala tiene 4 letras o números.');return;}
 setJoining(true,code);netMsg('Buscando la sala '+code+'…',true);
 try{await loadPeer();}catch(e){setJoining(false);netMsg('No se pudo cargar el modo en línea. Revisa tu conexión a internet.');return;}
 const peer=new Peer(undefined,peerOpts());
 NET={role:'client',peer,code,conn:null,fc:0,gc:0,qc:0,inT:0,welcomed:false,lobby:null,lastIn:''};
 const mine=NET;
 const fail=t=>{clearTimeout(timer);if(NET===mine){netLeave(t);setJoining(false);}};
 const timer=setTimeout(()=>{if(NET===mine&&!mine.welcomed)fail(goneMsg(code));},JOIN_TIMEOUT);
 peer.on('open',()=>{
  const conn=peer.connect(peerIdFor(code),{reliable:true,serialization:'json'});mine.conn=conn;
  conn.on('open',()=>conn.send({t:'hello',name:displayName(),color:playerColor,v:PROTO,ver:VERSION}));
  conn.on('data',d=>{if(NET===mine){if(d&&d.t==='welcome'){clearTimeout(timer);setJoining(false);}clientOnData(d);}});
  conn.on('close',()=>fail(mine.welcomed?'Se cerró la conexión con el anfitrión.':goneMsg(code)));
  conn.on('error',()=>fail(mine.welcomed?'Se perdió la conexión con el anfitrión.':goneMsg(code)));
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
  case 'full':netLeave('La sala está llena (máximo '+MAX_PLAYERS+' combatientes).');break;
  case 'busy':netLeave('La partida ya empezó. Intenta de nuevo cuando termine.');break;
  case 'closed':netLeave('El anfitrión cerró la sala.');break;
  case 'lobby':NET.lobby=d;if(d.go||state==='lobby')state='lobby';/* solo cambia de pantalla si el anfitrión regresa a la sala */if(Number.isInteger(d.diff)&&DIFF[d.diff])diff=d.diff;{const mine=Array.isArray(d.players)&&d.players.find(p=>p.key===NET.peer.id);if(mine&&PALETTE.some(p=>p[1]===mine.color)){NET.color=mine.color;if(playerColor!==mine.color){playerColor=mine.color;save();buildSwatches();}}}
  NET.fog=d.fog!==false;if(PRESETS[d.preset])NET.preset=d.preset;if(THEME_OPTS.includes(d.theme))themeChoice=d.theme;$('tname').textContent=themeLabel(themeChoice);renderLobby();break;
  case 'start':clientStart(d);break;
  case 's':if(state==='play'||state==='over')applySnapshot(d);break;
 }
}
function clientStart(d){
 if(!Array.isArray(d.roster))return;
 myId=d.myId|0;if(DIFF[d.diff])diff=d.diff;setTheme(d.theme);NET.fog=d.fog!==false;
 grid=new Uint8Array(COLS*ROWS);crateHP=new Uint8Array(COLS*ROWS);vis=new Uint8Array(COLS*ROWS).fill(1);applyGridStr(String(d.g||''));
 ents=d.roster.slice(0,9).map((r,i)=>({id:i,isPlayer:!!r.h,name:cleanName(r.n),style:r.s?String(r.s).slice(0,12):null,color:/^#[0-9a-f]{6}$/i.test(r.c)?r.c:'#94a3b8',
  x:-99,y:-99,nx:-99,ny:-99,tx:0,ty:0,ntx:0,nty:0,speed:PLAYER_SPEED,tp:-1,dir:RIGHT,moving:false,hp:100,alive:false,invulnT:0,hurtT:0,blindT:0,frags:0,deaths:0,weapon:'pistol',respawnT:0,
  inv:{pistol:Infinity,smg:0,shotgun:0,rifle:0,frag:1,flash:0},aw:{},gone:false}));
 if(myId>=0&&!ents[myId])myId=-1;NET.spectating=myId<0;
 if(d.mt>0&&d.mt<=3600)matchTime=d.mt;if(d.fl>0&&d.fl<=99)fragLimit=d.fl;
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
  e.aw=a[14]||{};e.gone=!!a[15];if(Array.isArray(a[17]))e.stc=a[17];
  if(mine){ // mi soldado: se mueve en mi pantalla; solo me ajusto al reaparecer o si el anfitrión me corrige
   const tp=a[16]|0;
   if(!e.alive||tp!==e.tp){e.tp=tp;e.x=e.nx;e.y=e.ny;e.tx=e.ntx=wx(Math.floor(e.x/T));e.ty=e.nty=Math.floor(e.y/T);e.x=e.tx*T+T/2;e.y=e.ty*T+T/2;e.moving=false;if(DIRS[a[2]])e.dir=DIRS[a[2]];}
  }else if(!wasAlive&&e.alive){e.x=e.nx;e.y=e.ny;}
 });
 if(Array.isArray(s.b))bullets=s.b.map(a=>({x:a[0],y:a[1],vx:a[2],vy:a[3],color:String(a[4]).slice(0,7)}));
 if(Array.isArray(s.n))nades=s.n.map(a=>({x:a[0],y:a[1],vx:0,vy:0,type:a[2]?'flash':'frag',fuse:a[3]}));
 if(Array.isArray(s.p))pickups=s.p.filter(a=>PICK[a[2]]).map(a=>({tx:a[0],ty:a[1],type:a[2],t:clock+a[0],life:a[3]<0?undefined:a[3]}));
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
 for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;}
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
 const box=$('lplayers');box.textContent='';
 players.forEach(p=>{const r=document.createElement('div');const i=document.createElement('i');i.style.background=/^#[0-9a-f]{6}$/i.test(p.color)?p.color:'#94a3b8';
  const n=document.createElement('span');n.textContent=cleanName(p.name);const sm=document.createElement('small');sm.textContent=p.host?'anfitrión':'';
  r.append(i,n,sm);box.appendChild(r);});
 for(let i=0;i<ais;i++){const r=document.createElement('div');r.innerHTML='<i style="background:#475569"></i><span style="color:#64748b">IA</span>';box.appendChild(r);}
 $('aiCount').textContent=String(ais);$('ldName').textContent=DIFF[diff].name;$('ltName').textContent=themeLabel(themeChoice);$('lfName').textContent=NET.fog!==false?'SÍ':'NO';
 document.querySelectorAll('#lobby .hostonly').forEach(b=>b.style.display=host?'':'none');
 document.querySelectorAll('#lobby .hostrow').forEach(b=>b.style.display=host?'':'none');
 $('lwait').style.display=host?'none':'';
 $('lsummary').style.display=host?'none':'';
 $('lpName').textContent=presetLabel(host?SETTINGS.preset:(NET.preset|0)||1);
 $('lsummary').textContent=`${presetLabel(host?SETTINGS.preset:(NET.preset??1))} · ${ais} IA${ais===1?'':'s'} · ${themeLabel(themeChoice)} · NIEBLA ${NET.fog!==false?'SÍ':'NO'} · ${DIFF[diff].name}`;
 // colores: los que ya tomó otro jugador aparecen apagados
 const mine=myLobbyColor(),taken=new Set(players.filter(p=>(host?p.key!=='host':p.key!==NET.peer.id)).map(p=>p.color));
 const ls=$('lswatches');ls.textContent='';
 for(const [n,c] of PALETTE){const b=document.createElement('button');b.style.background=c;b.title=n;b.setAttribute('aria-label',n);
  if(c===mine)b.classList.add('sel');if(taken.has(c)){b.disabled=true;b.title=n+' (ocupado)';}
  b.addEventListener('click',()=>pickLobbyColor(c));ls.appendChild(b);}
}
$('mkRoom').addEventListener('click',()=>{audio();createRoom();});
$('joinBtn').addEventListener('click',()=>{audio();joinRoom($('jcode').value);});
$('jcode').addEventListener('input',()=>{const el=$('jcode');el.value=el.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);});
$('lleave').addEventListener('click',()=>netLeave());
$('lstart').addEventListener('click',()=>{audio();hostStart();});
$('aiMinus').addEventListener('click',()=>{NET.ais--;hostLobbyUpdate();});
$('aiPlus').addEventListener('click',()=>{NET.ais++;hostLobbyUpdate();});
$('ldPrev').addEventListener('click',()=>{diff=Math.max(1,diff-1);hostLobbyUpdate();});
$('ltPrev').addEventListener('click',()=>{stepTheme(-1);hostLobbyUpdate();});
$('lpPrev').addEventListener('click',()=>{stepPreset(-1);hostLobbyUpdate();});$('lpNext').addEventListener('click',()=>{stepPreset(1);hostLobbyUpdate();});
$('lfPrev').addEventListener('click',()=>{NET.fog=!NET.fog;hostLobbyUpdate();});$('lfNext').addEventListener('click',()=>{NET.fog=!NET.fog;hostLobbyUpdate();});$('ltNext').addEventListener('click',()=>{stepTheme(1);hostLobbyUpdate();});
$('ldNext').addEventListener('click',()=>{diff=Math.min(4,diff+1);hostLobbyUpdate();});
$('lcopy').addEventListener('click',()=>{const l=$('llink');try{navigator.clipboard.writeText(l.value).then(()=>{$('lcopy').textContent='¡COPIADO!';setTimeout(()=>$('lcopy').textContent='COPIAR ENLACE',1500);},()=>{l.select();});}catch(e){l.select();}});
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

