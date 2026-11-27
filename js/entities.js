'use strict';
// Pixel Breach — Soldados: aparición, movimiento, disparos, daño, bajas y jugador local
// ---------- ENTIDADES ----------
function makeEnt(isPlayer,p,i,name){
 return {id:i,isPlayer,p,name,style:p?p.name:null,color:isPlayer?playerColor:p.color,skin:isPlayer?playerSkin:SKIN_KEYS[ri(0,SKIN_KEYS.length-1)],
  x:0,y:0,tx:0,ty:0,ntx:0,nty:0,moving:false,dir:RIGHT,
  speed:isPlayer?PLAYER_SPEED:p.speed*DIFF[diff].speed,
  hp:100,alive:true,respawnT:0,invulnT:0,frags:0,deaths:0,inv:null,weapon:'pistol',cd:0,gcd:0,blindT:0,hurtT:0,
  ai:{seeId:-1,reaction:0,dodgeAxisH:null,dodgeT:0,camp:null,campDir:null,campT:0,lastHp:100,keepT:0,blindDir:null,breach:false,known:{},patrol:null,patrolT:0}};
}
function resetInv(e){e.inv={pistol:Infinity,smg:0,shotgun:0,rifle:0,frag:1,flash:0};e.weapon='pistol';}
function placeAt(e,s){e.tx=e.ntx=s[0];e.ty=e.nty=s[1];e.x=s[0]*T+T/2;e.y=s[1]*T+T/2;e.moving=false;}
function spawn(e,fixed){
 if(fixed)placeAt(e,fixed);else{
  const others=ents.filter(o=>o!==e&&o.alive);
  const ranked=SPAWNS.map(s=>({s,d:others.length?Math.min(...others.map(o=>Math.abs(o.tx-s[0])+Math.abs(o.ty-s[1]))):rnd(0,10)})).sort((a,b)=>b.d-a.d);
  placeAt(e,ranked[Math.random()<.6?0:1].s);
 }
 e.tp=(e.tp|0)+1;e.hp=100;e.alive=true;e.invulnT=1.5;resetInv(e);e.blindT=0;e.cd=.3;e.dir=RIGHT;
 Object.assign(e.ai,{known:{},patrol:null,patrolT:0,camp:null,dodgeAxisH:null,dodgeT:0,seeId:-1,lastHp:100,keepT:0});
}
function startMatch(humans,nAI,aiNames){
 // humans: [{name,color}] — el primero eres tú (anfitrión). Sin argumentos: partida de un jugador.
 humans=humans||[{name:displayName(),color:playerColor,skin:playerSkin}];nAI=nAI===undefined?PERS.length:nAI;
 setTheme(themeChoice==='random'?THEME_KEYS[ri(0,THEME_KEYS.length-1)]:themeChoice);
 genMap();bullets=[];nades=[];pickups=[];parts=[];fx=[];feed=[];heard=[];toast=null;netEvents=[];gridVer++;
 const names=Array.isArray(aiNames)&&aiNames.length>=nAI?aiNames:AI_NAMES.slice().sort(()=>Math.random()-.5); /* en línea: los mismos nombres que se vieron en la sala */
 const styles=PERS.slice().sort(()=>Math.random()-.5);
 ents=humans.map((h,i)=>{const e=makeEnt(true,null,i,h.name);e.color=h.color;e.skin=SKIN_KEYS.includes(h.skin)?h.skin:playerSkin;e.lfc=e.lgc=e.lqc=0;return e;});
 for(let i=0;i<nAI;i++){const p=nAI>=PERS.length?PERS[i%PERS.length]:styles[i];ents.push(makeEnt(false,p,ents.length,names[i]));}
 myId=0;
 ents.forEach((e,i)=>{spawn(e,SPAWNS[i]);e.st={shots:0,hits:0,kw:{},nades:0,picks:0,best:0};e.streak=0;});
 {const pr=PRESETS[SETTINGS.preset]||PRESETS[1];matchTime=pr.t;fragLimit=pr.f;}
 timeLeft=matchTime;pickupT=6;firstBlood=false;announce=null;for(let i=0;i<3;i++)spawnPickup();
 state='play';paused=false;shake=0;flashA=0;winner=null;showToast('ESCENARIO: '+theme.name,'#facc15');tutStart();
}
function toTitle(){state='title';myId=0;setTheme(themeChoice==='random'?THEME_KEYS[ri(0,THEME_KEYS.length-1)]:themeChoice);genMap();/* el fondo coincide con el escenario elegido */ents=[];bullets=[];nades=[];pickups=[];parts=[];fx=[];feed=[];}
function endMatch(){
 if(state!=='play')return;
 state='over';winner=[...ents].filter(e=>!e.gone).sort((a,b)=>b.frags-a.frags||a.deaths-b.deaths)[0];
 onMatchEnd();
}
function onMatchEnd(){sfx(winner&&winner.id===myId?'win':'die');
}

// movimiento por cuadrícula con deslizamiento suave (estilo Bomberman / Pac-Man)
function stepMove(e,want,dt,cont){
 let dist=e.speed*T*dt,guard=0;
 while(dist>0&&guard++<4){
  if(!e.moving){
   if(!want)return;
   e.dir=want;
   const nx=e.tx+want.dx,ny=e.ty+want.dy;
   if(!walkable(nx,ny))return;
   e.ntx=nx;e.nty=ny;e.moving=true;
  }else if(want){
   const mdx=e.ntx-e.tx,mdy=e.nty-e.ty;
   if(want.dx===-mdx&&want.dy===-mdy){const ox=e.tx,oy=e.ty;e.tx=e.ntx;e.ty=e.nty;e.ntx=ox;e.nty=oy;e.dir=want;}
  }
  const gx=e.ntx*T+T/2,gy=e.nty*T+T/2,d=Math.hypot(gx-e.x,gy-e.y);
  if(d<=dist){e.x=gx;e.y=gy;e.tx=e.ntx;e.ty=e.nty;e.moving=false;dist-=d;
   if(WRAP&&(e.tx<0||e.tx>=COLS)){const s=e.tx<0?COLS:-COLS;e.tx+=s;e.ntx=e.tx;e.x+=s*T;}
   if(!cont)return;}
  else{e.x+=(gx-e.x)/d*dist;e.y+=(gy-e.y)/d*dist;dist=0;}
 }
}

// granada: botón fijo, no hace falta cambiar de arma. Lanza frag; si no hay, flashbang; si no hay, nada.
function throwNade(e,type){
 type=type||(e.inv.frag>0?'frag':e.inv.flash>0?'flash':null);
 if(!type||e.gcd>0||!e.alive||!(e.inv[type]>0))return false;
 const d=e.dir;
 nades.push({x:e.x+d.dx*8,y:e.y+d.dy*8,vx:d.dx*8*T,vy:d.dy*8*T,owner:e,type,fuse:1.6});
 e.inv[type]--;e.gcd=WEAP[type].cd;if(e.st)e.st.nades++;if(tut&&e.id===myId)tut.nades++;snd('throw',e.x,e.y);
 return true;
}
function fire(e){
 if(e.cd>0||!e.alive)return false;
 if(!(e.inv[e.weapon]>0)){e.weapon='pistol';return false;}
 const w=WEAP[e.weapon],d=e.dir;
 {
  const sx=e.x+d.dx*14,sy=e.y+d.dy*14,base=Math.atan2(d.dy,d.dx);
  // la bala nace aquí (para los choques), pero se dibuja desde la punta del arma
  const tp=gunTip(e.skin,d.dy<0?'up':d.dy>0?'down':d.dx>0?'right':'left',e.weapon),vis=Math.max(0,Math.abs(tp.dx+tp.dy)-14);
  const extra=e.moving&&w.pellets===1?MOVE_SPREAD:0;
  for(let i=0;i<w.pellets;i++){
   let a=base;
   if(w.pellets>1)a+=(i/(w.pellets-1)-.5)*w.spread+rnd(-.04,.04);else a+=rnd(-(w.spread+extra)/2,(w.spread+extra)/2);
   const sp=w.spd*T*(w.pellets>1?rnd(.9,1.1):1);
   bullets.push({x:sx,y:sy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,owner:e,dmg:w.dmg,range:w.range*T,trav:0,crate:w.crate,color:w.color,checked:{},w:e.weapon,vis});
  }
  if(e.st)e.st.shots+=w.pellets;
  if(tut&&e.id===myId)tut.shots++;
  emitEv({k:'mz',x:Math.round(e.x+tp.dx),y:Math.round(e.y+tp.dy)}); // fogonazo en la boca del cañón
  hearShot(e);
  emitEv({k:'shot',id:e.id,x:Math.round(sx),y:Math.round(sy)}); // fogonazo que oyen los demás
  snd(e.weapon,e.x,e.y);
 }
 e.cd=w.cd*(e.isPlayer?1:DIFF[diff].fire);
 if(e.inv[e.weapon]!==Infinity){e.inv[e.weapon]--;if(e.inv[e.weapon]<=0)e.weapon='pistol';}
 return true;
}
function damage(e,d,src,w){
 if(!e.alive||e.invulnT>0)return;
 if(!e.isPlayer&&src&&src!==e&&src.alive)reveal(e.ai,src,false);
 if(e.isPlayer&&src&&src!==e)d*=DIFF[diff].taken;
 e.hp-=d;e.hurtT=.12;
 if(e.isPlayer)emitEv({k:'hurt',to:e.id});
 if(e.hp<=0)kill(e,src,w);
}
let tut=null;
const TUT=[
 {m:()=>isTouch?'Desliza el dedo en la cruceta para moverte':'Muévete con WASD o las flechas',ok:t=>t.moves>=4},
 {m:()=>`Dispara con ${isTouch?'FUEGO':'ESPACIO'}. Los muros te cubren de las balas`,ok:t=>t.shots>=3},
 {m:()=>'Rompe cajas: a veces sueltan armas, granadas o botiquines',ok:t=>t.picks>=1||t.t>10},
 {m:()=>`Lanza una granada con ${isTouch?'GRAN':'G'}: explota en cruz`,ok:t=>t.nades>=1||t.t>10},
 {m:()=>`Gana quien llegue a ${fragLimit} bajas. ¡Suerte, soldado!`,ok:t=>t.t>5},
];
function tutStart(){tut=null;if(NET)return;try{if(localStorage.getItem('pb_tut'))return;}catch(e){return;}tut={i:0,t:0,moves:0,last:null,shots:0,nades:0,picks:0};}
function tutTick(dt){
 if(!tut)return;tut.t+=dt;const m=me();
 if(m){const k=m.tx+','+m.ty;if(k!==tut.last){if(tut.last)tut.moves++;tut.last=k;}}
 if(TUT[tut.i].ok(tut)){tut.i++;tut.t=0;sfx('pick');if(tut.i>=TUT.length){tut=null;try{localStorage.setItem('pb_tut','1');}catch(e){}syncGuide();}}
}
// La guía nunca tapa al soldado: en computadora y celular vertical va fuera del mapa (#guide);
// en celular horizontal se dibuja en el mapa, en la mitad contraria a donde está el jugador.
let tutBox=null,tutSide='bottom';
function guideOutside(){return !isTouch||(typeof matchMedia==='function'&&matchMedia('(orientation:portrait)').matches);}
function syncGuide(){
 const el=$('guide');if(!el)return;const on=!!(tut&&state==='play'&&guideOutside());
 document.body.classList.toggle('guiding',on);
 if(on){$('guideN').textContent=`GUÍA ${tut.i+1}/${TUT.length}`;const m=TUT[tut.i].m();if($('guideMsg').textContent!==m)$('guideMsg').textContent=m;}
}
function skipTut(){if(!tut)return;tut=null;tutBox=null;try{localStorage.setItem('pb_tut','1');}catch(e){}syncGuide();showToast('GUÍA SALTADA · SE REACTIVA EN AJUSTES','#94a3b8');}
function drawTut(){
 syncGuide();tutBox=null;if(guideOutside())return;
 const m=me(),msg=TUT[tut.i].m();
 if(m){const mid=HUD+(cv.height-HUD)/2;if(m.y<mid-24)tutSide='bottom';else if(m.y>mid+24)tutSide='top';} // con margen para que no parpadee
 ctx.font=`bold ${fsz(12)}px "Courier New",monospace`;const w=Math.min(W-24,ctx.measureText(msg).width+64),h=fsz(12)+26;
 const x=W/2-w/2,y=tutSide==='top'?HUD+6:cv.height-h-6;
 ctx.fillStyle='rgba(8,10,16,.72)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#facc15';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
 txt(`GUÍA ${tut.i+1}/${TUT.length}`,W/2,y+10,9,'#facc15','center',false);
 txt(msg,W/2,y+h/2+5,12,'#e2e8f0','center');txt('✕',x+w-14,y+h/2,14,'#94a3b8','center',false);
 tutBox={x,y,w,h};
}
const STREAKS={2:'¡DOBLE!',3:'¡TRIPLE!',5:'¡IMPARABLE!',7:'¡LEYENDA!'};
function kill(e,src,w){
 e.streak=0;
 if(src&&src!==e){
  src.streak=(src.streak|0)+1;
  if(src.st){src.st.best=Math.max(src.st.best,src.streak);const k=w||'pistol';src.st.kw[k]=(src.st.kw[k]|0)+1;}
  if(!firstBlood){firstBlood=true;emitEv({k:'ann',t:'PRIMERA SANGRE',n:src.name,c:src.color});}
  else if(STREAKS[src.streak])emitEv({k:'ann',t:STREAKS[src.streak],n:src.name,c:src.color});
 }
 e.alive=false;e.hp=0;e.respawnT=2.2;e.deaths++;
 if(src&&src!==e){src.frags++;if(src.p&&src.p.key==='campero'){src.ai.campT=0;src.ai.relocate=true;}emitEv({k:'feed',parts:[[src.name,src.color],[' ▸ ','#cbd5e1'],[e.name,e.color]]});}
 else{e.frags=Math.max(0,e.frags-1);emitEv({k:'feed',parts:[[e.name,e.color],[' se voló solo','#cbd5e1']]});}
 let drop=e.weapon!=='pistol'&&e.inv[e.weapon]>0?e.weapon:null;
 if(!drop)for(const k of ['rifle','shotgun','smg','frag','flash'])if(e.inv[k]>0){drop=k;break;}
 if(drop)pickups.push({tx:wx(Math.floor(e.x/T)),ty:Math.floor(e.y/T),type:drop,amt:e.inv[drop],t:0,life:15});
 sparks(e.x,e.y,e.color,18,160);sparks(e.x,e.y,'#7f1d1d',10,90);
 snd('die',e.x,e.y);
 if(src&&src!==e&&src.frags>=fragLimit)endMatch();
}

// ---------- JUGADOR ----------
const keys={};let dirStack=[];
const KEYDIR={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3};
function heldDir(){return dirStack.length?DIRS[KEYDIR[dirStack[dirStack.length-1]]]:null;}
function updPlayer(e,dt){
 stepMove(e,heldDir(),dt,true);
 if(keys.Space||keys.KeyJ)fire(e);
 if(keys.KeyG||keys.KeyK)throwNade(e);
}
function cycle(p){let i=FIREARMS.indexOf(p.weapon);for(let n=0;n<4;n++){i=(i+1)%4;if(p.inv[FIREARMS[i]]>0){p.weapon=FIREARMS[i];return;}}}

