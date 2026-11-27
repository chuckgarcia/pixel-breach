'use strict';
// Pixel Breach — Intro animada
// ---------- INTRO ANIMADA ----------
let introT=0,introLogo=null;
function drawIntro(){
 const _v=()=>txt('v'+VERSION,W-10,cv.height-12,10,'#475569','right',false);
 introT+=1/60;const t=introT;
 ctx.fillStyle=`rgba(8,10,16,${Math.max(.55,1-t*.35)})`;ctx.fillRect(0,0,W,cv.height);
 // barrido de escáner
 const sy=((t*180)%(cv.height+80))-40;const g=ctx.createLinearGradient(0,sy-30,0,sy+30);g.addColorStop(0,'rgba(74,222,128,0)');g.addColorStop(.5,'rgba(74,222,128,.10)');g.addColorStop(1,'rgba(74,222,128,0)');ctx.fillStyle=g;ctx.fillRect(0,sy-30,W,60);
 // logotipo letra por letra con rebote y un poco de "glitch"
 if(!introLogo)introLogo=logoPieces(5,true);
 const L=introLogo,x0=Math.round((W-L.w)/2),y0=110,glitch=(t%2.3)>2.15;
 L.pieces.forEach((p,i)=>{
  const lt=p.row===2?(t-1.2)*1.5:t-.15-i*.06;if(lt<0)return;
  const k=Math.min(1,lt/.35),bounce=p.row===2?0:(1-k)*-60+Math.sin(Math.min(1,lt/.5)*Math.PI)*-8*(1-Math.min(1,lt/.6));
  const x=x0+Math.round(p.x),y=y0+Math.round(p.y+bounce);
  ctx.globalAlpha=k;
  if(glitch&&p.row<2){ctx.globalAlpha=k*.45;ctx.drawImage(p.img,x-4,y);ctx.drawImage(p.img,x+4,y);ctx.globalAlpha=k;}
  ctx.drawImage(p.img,x,y);
 });
 ctx.globalAlpha=1;
 // pequeña batalla: dos equipos de 3 se disparan de lado a lado en tres carriles
 introBattle(1/60,t);
 _v();
 if(t>1.8&&Math.floor(t*2)%2===0)txt(isTouch?'TOCA PARA CONTINUAR':'PRESIONA CUALQUIER TECLA',W/2,470,16,'#facc15','center');
}
// ---- batalla de la intro (solo visual) ----
let battle=null;
function initBattle(){
 const lanes=[318,368,418],A=['#4ade80','#ef4444','#f472b6'],B=['#22d3ee','#fb923c','#facc15'];
 const SA=['recruitF','commandoM','gas'],SB=['operator','recruitM','commandoF'],WA=['rifle','smg','shotgun'],WB=['rifle','pistol','smg'];
 const mk=(team,i)=>{const home=team?W-90-[0,40,15][i]:90+[0,40,15][i];
  return {team,lane:i,y:lanes[i],home,x:team?W+40+i*30:-40-i*30,skin:(team?SB:SA)[i],color:(team?B:A)[i],weapon:(team?WB:WA)[i],
   cd:rnd(.8,1.6),hp:3,hurt:0,dead:0,ph:rnd(0,6)};};
 battle={s:[0,1,2].map(i=>mk(0,i)).concat([0,1,2].map(i=>mk(1,i))),b:[],p:[]};
}
function introBattle(dt,t){
 if(!battle)initBattle();
 const B=battle;
 for(const s of B.s){
  if(s.dead>0){s.dead-=dt;if(s.dead<=0){s.hp=3;s.x=s.team?W+40:-40;s.cd=rnd(.8,1.4);}continue;}
  s.hurt=Math.max(0,s.hurt-dt);s.ph+=dt;
  const target=s.home+Math.sin(s.ph*.9)*14*(s.team?-1:1); // avanza y retrocede un poco
  const dx=target-s.x;s.moving=Math.abs(dx)>1.5;s.x+=Math.sign(dx)*Math.min(Math.abs(dx),70*dt);
  s.cd-=dt;
  const ready=s.team?s.x<W-20:s.x>20;
  if(s.cd<=0&&ready){s.cd=rnd(.7,1.5);const face=s.team?'left':'right',tp=gunTip(s.skin,face,s.weapon);
   const mx=s.x+tp.dx,my=s.y+tp.dy;B.p.push({x:mx,y:my,t:.07,mz:1});B.b.push({x:mx,y:my,v:s.team?-460:460,team:s.team,lane:s.lane});}
 }
 for(const b of B.b){b.x+=b.v*dt;
  const foe=B.s.find(o=>o.team!==b.team&&o.lane===b.lane&&o.dead<=0&&Math.abs(o.x-b.x)<10);
  if(foe){b.dead=true;foe.hurt=.15;foe.hp--;for(let k=0;k<5;k++)B.p.push({x:foe.x,y:foe.y-4,vx:rnd(-60,60),vy:rnd(-80,20),t:.3,c:'#fca5a5'});
   if(foe.hp<=0){foe.dead=1.6;for(let k=0;k<14;k++)B.p.push({x:foe.x,y:foe.y-6,vx:rnd(-120,120),vy:rnd(-160,40),t:.6,c:k%2?foe.color:'#e2e8f0'});}}
  if(b.x<-20||b.x>W+20)b.dead=true;}
 B.b=B.b.filter(b=>!b.dead);
 for(const p of B.p){p.t-=dt;if(p.vx!==undefined){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;}}
 B.p=B.p.filter(p=>p.t>0);
 // dibujo, de atrás hacia adelante
 for(const s of B.s.slice().sort((a,b)=>a.y-b.y)){if(s.dead>0)continue;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(s.x-10,s.y+11,20,4);
  drawSkin(ctx,s.skin,s.color,s.team?'left':'right',s.moving?(Math.floor(t*8+s.lane)%2?1:2):0,s.hurt>0,s.weapon,Math.round(s.x),s.y+13,2);}
 for(const b of B.b){ctx.fillStyle='rgba(255,224,102,.45)';ctx.fillRect(b.x-(b.v>0?12:-6),b.y-1,6,2);ctx.fillStyle='#ffe066';ctx.fillRect(b.x-2,b.y-2,4,4);}
 for(const p of B.p){if(p.mz){ctx.fillStyle='#fff7ae';ctx.fillRect(p.x-4,p.y-4,8,8);}else{ctx.fillStyle=p.c;ctx.fillRect(p.x-1,p.y-1,3,3);}}
}
function endIntro(){if(state!=='intro')return;state='title';audio();sfx('win');musicForState();}
function render(){
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0b0d12';ctx.fillRect(0,0,cv.width,cv.height);
 if(!grid)return;
 if(state!=='play')fogOn=false;
 const sx=shake>0?Math.round(rnd(-shake,shake)):0,sy=shake>0?Math.round(rnd(-shake,shake)):0;
 ctx.save();ctx.translate(sx,HUD+sy);
 drawMap();drawModeMap();drawPickups();drawFx();
 if(fogOn){drawFog();drawHeard();}
 drawNades();drawBullets();for(const e of ents)drawEnt(e);drawParts();
 if(state==='play')drawFlagArrow();
 ctx.restore();
 if(flashA>0){ctx.fillStyle=`rgba(255,255,255,${Math.min(1,flashA)})`;ctx.fillRect(0,HUD,W,H);}
 syncOverlays();
 if(state==='intro'){drawIntro();return;}
 if(state==='title'||state==='lobby'){drawTitle();if(state==='title')drawPreview();else if(NET&&lpvx)drawPreview(lpvx,myLobbyColor());return;}
 drawHUD();drawModeHud();drawFeed();
 if(announce&&state==='play'){const a=Math.min(1,announce.t*2),k=1+Math.max(0,announce.t-1.6)*1.5;ctx.globalAlpha=a;txt(announce.text,W/2,HUD+78,Math.round(22*k),announce.c||'#facc15','center');ctx.globalAlpha=1;}
 if(tut&&state==='play')drawTut();
 const p=me();
 if(state==='over'){
  overlay(.82);txt('FIN DE LA PARTIDA',W/2,100,30,'#facc15','center');
  txt(winTitle(winner),W/2,142,18,winner.color,'center');
  if(!winner.isPlayer)txt(winner.style,W/2,166,10,'#94a3b8','center');
  if(!me()&&NET)txt('Entras en la siguiente partida cuando el anfitrión dé REVANCHA',W/2,428,11,'#facc15','center');
  scoreboard(196);
  {const m=me();if(m){const r=m.stc||statRow(m);const acc=r[0]?Math.round(Math.min(1,r[1]/r[0])*100):0;
   txt(`PRECISIÓN ${acc}%   ·   ARMA FAVORITA: ${r[2]>=0?WEAP[WIDX[r[2]]].name:'—'}`,W/2,350,11,'#cbd5e1','center');
   txt(`MEJOR RACHA ${r[5]}   ·   GRANADAS ${r[3]}   ·   BOTÍN ${r[4]}`,W/2,370,11,'#cbd5e1','center');}}if(!isTouch&&(!NET||NET.role==='host'))txt('ENTER: revancha (mapa nuevo)   ·   ESC: menú',W/2,402,11,'#94a3b8','center');
  else if(NET&&NET.role==='client'&&me())txt('Esperando a que el anfitrión elija revancha o sala…',W/2,402,11,'#94a3b8','center');
 }else if(paused){
  overlay(.8);txt('PAUSA',W/2,120,30,'#facc15','center');scoreboard(176);if(!isTouch)txt('P o ESC: continuar',W/2,500,11,'#94a3b8','center');
 }else if(NET&&NET.role==='client'&&NET.hostQuiet>2.5){ // el anfitrión no responde
  overlay(.55);txt('ESPERANDO AL ANFITRIÓN…',W/2,HUD+H/2-12,22,'#facc15','center');
  txt(`Si no vuelve en ${Math.max(0,Math.ceil(15-NET.hostQuiet))} s, regresarás al menú`,W/2,HUD+H/2+18,12,'#cbd5e1','center');
 }else if(!p){ // espectador
  if(Math.floor(clock*1.5)%3!==0)txt('ESPECTADOR · ENTRAS EN LA SIGUIENTE PARTIDA',W/2,HUD+H-22,13,'#facc15','center');
 }else if(!p.alive&&p.out){ // último en pie: sin vidas, miras hasta el final
  txt('SIN VIDAS',W/2,HUD+H/2-14,28,'#ef4444','center');
  if(Math.floor(clock*1.5)%3!==0)txt('Miras la partida hasta que termine',W/2,HUD+H/2+18,13,'#e2e8f0','center');
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

