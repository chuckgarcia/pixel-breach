'use strict';
// Pixel Breach — Intro animada
// ---------- INTRO ANIMADA ----------
let introT=0;
const INTRO_COLORS=['#4ade80','#ef4444','#f472b6','#22d3ee','#fb923c'];
function drawIntro(){
 const _v=()=>txt('v'+VERSION,W-10,cv.height-12,10,'#475569','right',false);
 introT+=1/60;const t=introT;
 ctx.fillStyle=`rgba(8,10,16,${Math.max(.55,1-t*.35)})`;ctx.fillRect(0,0,W,cv.height);
 // barrido de escáner
 const sy=((t*180)%(cv.height+80))-40;const g=ctx.createLinearGradient(0,sy-30,0,sy+30);g.addColorStop(0,'rgba(74,222,128,0)');g.addColorStop(.5,'rgba(74,222,128,.10)');g.addColorStop(1,'rgba(74,222,128,0)');ctx.fillStyle=g;ctx.fillRect(0,sy-30,W,60);
 // título letra por letra con rebote y un poco de "glitch"
 const TITLE='PIXEL BREACH';ctx.font='bold 56px "Courier New",monospace';ctx.textBaseline='middle';ctx.textAlign='left';
 const tw=ctx.measureText(TITLE).width,x0=(W-tw)/2,cw=tw/TITLE.length,ty=170;
 const glitch=(t%2.3)>2.15;
 for(let i=0;i<TITLE.length;i++){
  const lt=t-.15-i*.07;if(lt<0)continue;
  const k=Math.min(1,lt/.35),bounce=(1-k)*-60+Math.sin(Math.min(1,lt/.5)*Math.PI)*-8*(1-Math.min(1,lt/.6));
  const x=x0+i*cw,y=ty+bounce;
  ctx.globalAlpha=k;
  if(glitch){ctx.fillStyle='#ef4444';ctx.fillText(TITLE[i],x-3,y);ctx.fillStyle='#22d3ee';ctx.fillText(TITLE[i],x+3,y);}
  ctx.fillStyle='#000';ctx.fillText(TITLE[i],x+4,y+4);ctx.fillStyle='#4ade80';ctx.fillText(TITLE[i],x,y);
 }
 ctx.globalAlpha=1;
 if(t>1.2){ctx.globalAlpha=Math.min(1,(t-1.2)*2);txt('DEATHMATCH CQB',W/2,222,16,'#94a3b8','center');ctx.globalAlpha=1;}
 // escuadrón marchando
 const baseY=372,spd=70,gap=64,span=W+gap*6;
 INTRO_COLORS.forEach((c,i)=>{
  const x=((t*spd+i*gap)%span)-gap*2,frame=Math.floor((t*8)+i)%2?1:2;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x-14,baseY+26,28,5);
  drawSkin(ctx,SKIN_KEYS[i%SKIN_KEYS.length],c,'right',frame,false,['rifle','smg','shotgun','pistol'][i%4],x,baseY+29,2); // el escuadrón luce todos los aspectos
  if(i===0&&(t%1.6)<.08){ctx.fillStyle='#fff7ae';ctx.fillRect(x+30,baseY+4,7,8);}
 });
 if((t%1.6)<.6){const bx=(((Math.floor(t/1.6)*1.6)*spd)%span)-gap*2+36+((t%1.6)*500);ctx.fillStyle='#ffe066';ctx.fillRect(bx,baseY+4,6,3);}
 ctx.fillStyle='#1f2937';ctx.fillRect(0,baseY+31,W,2);
 _v();
 if(t>1.8&&Math.floor(t*2)%2===0)txt(isTouch?'TOCA PARA CONTINUAR':'PRESIONA CUALQUIER TECLA',W/2,470,16,'#facc15','center');
}
function endIntro(){if(state!=='intro')return;state='title';audio();sfx('win');musicForState();}
function render(){
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0b0d12';ctx.fillRect(0,0,cv.width,cv.height);
 if(!grid)return;
 if(state!=='play')fogOn=false;
 const sx=shake>0?Math.round(rnd(-shake,shake)):0,sy=shake>0?Math.round(rnd(-shake,shake)):0;
 ctx.save();ctx.translate(sx,HUD+sy);
 drawMap();drawPickups();drawFx();
 if(fogOn){drawFog();drawHeard();}
 drawNades();drawBullets();for(const e of ents)drawEnt(e);drawParts();
 ctx.restore();
 if(flashA>0){ctx.fillStyle=`rgba(255,255,255,${Math.min(1,flashA)})`;ctx.fillRect(0,HUD,W,H);}
 syncOverlays();
 if(state==='intro'){drawIntro();return;}
 if(state==='title'||state==='lobby'){drawTitle();if(state==='title')drawPreview();else if(NET&&lpvx)drawPreview(lpvx,myLobbyColor());return;}
 drawHUD();drawFeed();
 if(announce&&state==='play'){const a=Math.min(1,announce.t*2),k=1+Math.max(0,announce.t-1.6)*1.5;ctx.globalAlpha=a;txt(announce.text,W/2,HUD+78,Math.round(22*k),announce.c||'#facc15','center');ctx.globalAlpha=1;}
 if(tut&&state==='play')drawTut();
 const p=me();
 if(state==='over'){
  overlay(.82);txt('FIN DE LA PARTIDA',W/2,100,30,'#facc15','center');
  txt(winner.id===myId?'¡GANASTE!':`GANÓ ${winner.name}`,W/2,142,18,winner.color,'center');
  if(!winner.isPlayer)txt(winner.style,W/2,166,10,'#94a3b8','center');
  if(!me()&&NET)txt('Entras en la siguiente partida cuando el anfitrión dé REVANCHA',W/2,428,11,'#facc15','center');
  scoreboard(196);
  {const m=me();if(m){const r=m.stc||statRow(m);const acc=r[0]?Math.round(Math.min(1,r[1]/r[0])*100):0;
   txt(`PRECISIÓN ${acc}%   ·   ARMA FAVORITA: ${r[2]>=0?WEAP[WIDX[r[2]]].name:'—'}`,W/2,350,11,'#cbd5e1','center');
   txt(`MEJOR RACHA ${r[5]}   ·   GRANADAS ${r[3]}   ·   BOTÍN ${r[4]}`,W/2,370,11,'#cbd5e1','center');}}if(!isTouch&&(!NET||NET.role==='host'))txt('ENTER: revancha (mapa nuevo)   ·   ESC: menú',W/2,402,11,'#94a3b8','center');
  else if(NET&&NET.role==='client'&&me())txt('Esperando a que el anfitrión elija revancha o sala…',W/2,402,11,'#94a3b8','center');
 }else if(paused){
  overlay(.8);txt('PAUSA',W/2,120,30,'#facc15','center');scoreboard(176);txt(isTouch?'Toca la pantalla para continuar':'P para continuar',W/2,440,12,'#cbd5e1','center');
 }else if(NET&&NET.role==='client'&&NET.hostQuiet>2.5){ // el anfitrión no responde
  overlay(.55);txt('ESPERANDO AL ANFITRIÓN…',W/2,HUD+H/2-12,22,'#facc15','center');
  txt(`Si no vuelve en ${Math.max(0,Math.ceil(15-NET.hostQuiet))} s, regresarás al menú`,W/2,HUD+H/2+18,12,'#cbd5e1','center');
 }else if(!p){ // espectador
  if(Math.floor(clock*1.5)%3!==0)txt('ESPECTADOR · ENTRAS EN LA SIGUIENTE PARTIDA',W/2,HUD+H-22,13,'#facc15','center');
 }else if(!p.alive){
  txt('ELIMINADO',W/2,HUD+H/2-14,28,'#ef4444','center');
  txt(`Reapareces en ${Math.max(0,p.respawnT).toFixed(1)}`,W/2,HUD+H/2+18,13,'#e2e8f0','center');
 }
}
let last=performance.now();
function step(dt){
 clock+=dt;
 if(state==='play'&&!paused){if(NET&&NET.role==='client')clientUpdate(dt);else update(dt);}
 else{for(const p of parts)p.t-=dt;}
 if(NET)netTick(dt);
}
function loop(now){
 const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;
 if(!bgActive)step(dt);
 render();requestAnimationFrame(loop);
}
// Si el anfitrión cambia de pestaña, el navegador deja de dibujar; un "reloj" en un Worker
// mantiene la partida corriendo para los invitados. (Si el celular se bloquea, el sistema congela
// la página por completo: para eso está el aviso a los invitados y el bloqueo de pantalla de abajo.)
let bgWorker=null,bgActive=false,bgLast=0;
function bgSetup(){
 if(bgWorker)return;
 try{bgWorker=new Worker(URL.createObjectURL(new Blob(["let t=null;onmessage=e=>{if(e.data==='on'&&!t)t=setInterval(()=>postMessage(0),33);if(e.data==='off'){clearInterval(t);t=null;}}"],{type:'text/javascript'})));
  bgWorker.onmessage=()=>{if(!bgActive)return;const now=performance.now();const dt=Math.max(0,Math.min(.05,(now-bgLast)/1000));bgLast=now;step(dt);};}catch(e){bgWorker=null;}
}
function bgUpdate(){
 const want=document.hidden&&NET&&NET.role==='host'&&(state==='play'||state==='over');
 if(want&&!bgActive){bgSetup();if(bgWorker){bgActive=true;bgLast=performance.now();bgWorker.postMessage('on');}}
 else if(!want&&bgActive){bgActive=false;last=performance.now();if(bgWorker)bgWorker.postMessage('off');}
}
document.addEventListener('visibilitychange',()=>{bgUpdate();wakeUpdate();});
// mantener la pantalla encendida durante la partida (celulares compatibles)
let wakeLock=null;
async function wakeUpdate(){
 const want=state==='play'&&!document.hidden;
 try{
  if(want&&!wakeLock&&navigator.wakeLock){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null;});}
  else if(!want&&wakeLock){const w=wakeLock;wakeLock=null;await w.release();}
 }catch(e){wakeLock=null;}
}
let lastStateW=null;setInterval(()=>{if(state!==lastStateW){lastStateW=state;wakeUpdate();bgUpdate();musicForState();document.body.classList.toggle('playing',state==='play');}},300);

