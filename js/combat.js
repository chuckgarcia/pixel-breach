'use strict';
// Pixel Breach — Balas, granadas, explosiones, botín y eventos de efectos
// ---------- PROYECTILES ----------
function updBullets(dt){
 for(const b of bullets){
  const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/4));
  const sx=b.vx*dt/steps,sy=b.vy*dt/steps,sl=Math.hypot(sx,sy);
  for(let s=0;s<steps&&!b.dead;s++){
   b.x+=sx;b.y+=sy;b.trav+=sl;
   if(WRAP){if(b.x<0)b.x+=W;else if(b.x>=W)b.x-=W;}
   const tx=Math.floor(b.x/T),ty=Math.floor(b.y/T),t=tile(tx,ty);
   if(t===WALL){b.dead=true;sparks(b.x,b.y,'#94a3b8',3);break;}
   if(t===CRATE){b.dead=true;hitCrate(tx,ty,b.crate);sparks(b.x,b.y,'#a16207',4);break;}
   for(const e of ents){
    if(!e.alive||e===b.owner)continue;
    if(ARC&&b.owner&&((b.owner.enemy&&e.enemy)||(!b.owner.enemy&&e.hostage)))continue; // en Arcade no hay fuego amigo
    if(Math.abs(e.x-b.x)<11&&Math.abs(e.y-b.y)<11){b.dead=true;const hit=e.alive&&e.invulnT<=0;damage(e,b.dmg,b.owner,b.w);if(hit&&b.owner.st)b.owner.st.hits++;sparks(b.x,b.y,'#f87171',5);break;}
   }
   if(b.trav>b.range)b.dead=true;
  }
 }
 bullets=bullets.filter(b=>!b.dead);
}
function updNades(dt){
 for(const g of nades){
  g.fuse-=dt;
  const sp=Math.hypot(g.vx,g.vy);
  if(sp>0){
   const k=Math.max(0,sp-7*T*dt)/sp;g.vx*=k;g.vy*=k;
   const nx=g.x+g.vx*dt,ny=g.y+g.vy*dt;
   if(blocks(tile(Math.floor(nx/T),Math.floor(ny/T)))){g.vx*=-.5;g.vy*=-.5;if(sp>40)snd('bounce',g.x,g.y);}
   else{g.x=nx;g.y=ny;if(WRAP){if(g.x<0)g.x+=W;else if(g.x>=W)g.x-=W;}}
  }
  if(g.fuse<=0&&!g.dead){g.dead=true;g.type==='frag'?explode(g):flashbang(g);}
 }
 nades=nades.filter(g=>!g.dead);
}
function explode(g){ // explosión en cruz, como Bomberman
 const cx=wx(Math.floor(g.x/T)),cy=Math.floor(g.y/T),tiles=[[cx,cy]];
 for(const d of DIRS)for(let r=1;r<=2;r++){
  const x=wx(cx+d.dx*r),y=cy+d.dy*r,t=tile(x,y);
  if(t===WALL)break;tiles.push([x,y]);
  if(t===CRATE){destroyCrate(x,y);break;}
 }
 for(const [x,y] of tiles)emitEv({k:'fx',f:{kind:'boom',x,y}});
 for(const e of ents){
  if(!e.alive||(ARC&&g.owner&&g.owner.enemy&&e.enemy))continue;const ex=wx(Math.floor(e.x/T)),ey=Math.floor(e.y/T);
  if(tiles.some(([x,y])=>x===ex&&y===ey))damage(e,ex===cx&&ey===cy?100:75,g.owner,'frag');
 }
 for(const o of nades)if(!o.dead&&tiles.some(([x,y])=>x===Math.floor(o.x/T)&&y===Math.floor(o.y/T)))o.fuse=Math.min(o.fuse,.05);
 emitEv({k:'shake',a:8});snd('boom',g.x,g.y);
}
function flashbang(g){
 for(const e of ents){
  if(!e.alive)continue;const d=Math.hypot(e.x-g.x,e.y-g.y)/T;
  if(d<=4.5&&losPx(g.x,g.y,e.x,e.y)){if(e.isPlayer)emitEv({k:'flash',to:e.id,a:+(1.3-d*.15).toFixed(2)});else e.blindT=Math.max(e.blindT,2.8-d*.3);}
 }
 emitEv({k:'fx',f:{kind:'flash',px:Math.round(g.x),py:Math.round(g.y)}});snd('flash',g.x,g.y);
}

// ---------- PICKUPS ----------
function weightedType(){let s=PICK_W.reduce((a,b)=>a+b[1],0),r=Math.random()*s;for(const [k,w] of PICK_W){r-=w;if(r<=0)return k;}return 'smg';}
function spawnPickup(){
 for(let k=0;k<60;k++){
  const x=ri(1,COLS-2),y=ri(1,ROWS-2);
  if(!walkable(x,y)||pickups.some(p=>p.tx===x&&p.ty===y))continue;
  if(ents.some(e=>e.alive&&Math.abs(e.tx-x)+Math.abs(e.ty-y)<3))continue;
  const type=weightedType();pickups.push({tx:x,ty:y,type,amt:PICK[type].amt,t:rnd(0,6)});return;
 }
}
function updPickups(dt){
 pickupT-=dt;if(pickupT<=0){pickupT=9;if(pickups.length<5)spawnPickup();}
 for(const p of pickups){
  p.t+=dt;if(p.life!==undefined){p.life-=dt;if(p.life<=0)p.dead=true;}
  for(const e of ents){
   if(!e.alive||p.dead)continue;
   if(Math.abs(e.x-(p.tx*T+T/2))<12&&Math.abs(e.y-(p.ty*T+T/2))<12){
    if(p.type==='medkit'){if(e.hp>=100)continue;e.hp=Math.min(100,e.hp+p.amt);}
    else{if(e.inv[p.type]>=MAXAMMO[p.type])continue;e.inv[p.type]=Math.min(MAXAMMO[p.type],e.inv[p.type]+p.amt);
     if(!WEAP[p.type].throw)e.weapon=p.type;}
    p.dead=true;snd('pick',e.x,e.y);if(e.st)e.st.picks++;if(tut&&e.id===myId)tut.picks++;
    if(e.isPlayer)emitEv({k:'toast',to:e.id,t:p.type==='medkit'?`+${p.amt} SALUD`:`+${p.amt} ${WEAP[p.type].name}`,c:PICK[p.type].col});
   }
  }
 }
 pickups=pickups.filter(p=>!p.dead);
}

// ---------- EFECTOS ----------
// Los efectos pasan por emitEv: se aplican aquí y, si eres anfitrión, viajan a los demás jugadores.
let netEvents=[];
function emitEv(ev){applyEv(ev);if(NET&&NET.role==='host'&&NET.clients.size)netEvents.push(ev);}
function snd(n,x,y){emitEv({k:'sfx',n,x:Math.round(x),y:Math.round(y)});}
function applyEv(ev){
 const m=me();
 switch(ev.k){
  case 'sfx':sfx(ev.n,ev.x,ev.y);break;
  case 'sp':sparksLocal(ev.x,ev.y,ev.c,ev.n,ev.s);break;
  case 'mz':parts.push({x:ev.x,y:ev.y,vx:0,vy:0,t:.06,life:.06,col:'#fff7ae',s:8});{const m=me();if(m&&m.alive&&Math.hypot(m.x-ev.x,m.y-ev.y)<40)buzz('shot');}break;
  case 'shot':if(m&&m.alive&&ev.id!==myId&&Math.hypot(m.x-ev.x,m.y-ev.y)<=HEARING*T){const h=heard.find(h=>h.id===ev.id&&h.t>.2);if(h){h.x=ev.x;h.y=ev.y;h.t=h.max;}else heard.push({id:ev.id,x:ev.x,y:ev.y,t:.45,max:.45});}break;
  case 'hurt':if(ev.to===myId){shake=Math.max(shake,4);sfx('hurt');buzz('hurt');}break;
  case 'flash':if(ev.to===myId)flashA=Math.max(flashA,ev.a);break;
  case 'toast':if(ev.to===myId)showToast(ev.t,ev.c);break;
  case 'shake':shake=Math.max(shake,ev.a);break;
  case 'fx':fx.push(ev.f.kind==='boom'?{kind:'boom',x:ev.f.x,y:ev.f.y,t:.45,max:.45}:{kind:'flash',px:ev.f.px,py:ev.f.py,t:.35,max:.35});break;
  case 'feed':feed.push({t:4,parts:ev.parts});break;
  case 'flag':case 'out':modeEv(ev);break;
  case 'ann':announce={text:String(ev.n||'').slice(0,10)+' · '+String(ev.t||'').slice(0,16),c:ev.c,t:1.9};sfx('streak');break;
 }
}
function sparks(x,y,col,n,sp=90){emitEv({k:'sp',x:Math.round(x),y:Math.round(y),c:col,n,s:sp});}
function sparksLocal(x,y,col,n,sp=90){for(let i=0;i<n;i++){const a=rnd(0,6.283),v=rnd(20,sp);parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:rnd(.2,.45),life:.45,col,s:ri(2,3)});}}
function showToast(text,col){toast={text,col:col||'#e2e8f0',t:1.6};}

