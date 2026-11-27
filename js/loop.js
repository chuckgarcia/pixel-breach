'use strict';
// Pixel Breach — Ciclo del juego, segundo plano y pantalla encendida
// ---------- LOOP ----------
function computeVis(){
 const p=me();vis.fill(0);
 const pts=[[0,0],[-10,-10],[10,-10],[-10,10],[10,10]];
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
  const cx=x*T+T/2,cy=y*T+T/2;if(Math.hypot(cx-p.x,cy-p.y)>(ARC&&ARC.dark?ARC.dark+.5:10)*T)continue; // APAGÓN: solo ves unas casillas
  for(const [ox,oy] of pts)if(losPx(p.x,p.y,cx+ox,cy+oy)){vis[idx(x,y)]=1;break;}
 }
}
function update(dt){
 if(ARC&&arcGate(dt))return; // tarjeta de misión del Arcade
 timeLeft-=dt;if(timeLeft<=0){timeLeft=0;endMatch();return;}
 tutTick(dt);
 for(const e of ents){
  if(!e.alive){if(e.out||e.gone)continue;e.respawnT-=dt;if(e.respawnT<=0)spawn(e,gameMode==='ctf'?baseOf(e):null);continue;} // en bandera se reaparece en tu base
  e.cd-=dt;e.gcd-=dt;e.invulnT-=dt;e.hurtT-=dt;
  if(e.isPlayer)(e.id===myId?updPlayer(e,dt):updRemote(e,dt));else if(e.hostage)updHostage(e,dt);else if(!(tut&&tut.i===0&&tut.moves===0))updAI(e,dt); /* con la guía, las IAs esperan tu primer paso */
 }
 updBullets(dt);updNades(dt);updPickups(dt);updFlag(dt);lmsCheck();if(ARC&&state==='play')arcTick(dt);
 tickFx(dt);
}
function tickFx(dt){ // efectos visuales locales (anfitrión, invitado y un jugador)
 for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.9;p.vy*=.9;p.t-=dt;}
 parts=parts.filter(p=>p.t>0);
 for(const f of fx)f.t-=dt;fx=fx.filter(f=>f.t>0);
 for(const f of feed)f.t-=dt;feed=feed.filter(f=>f.t>0);
 for(const h of heard)h.t-=dt;heard=heard.filter(h=>h.t>0);
 if(toast){toast.t-=dt;if(toast.t<=0)toast=null;}
 if(announce){announce.t-=dt;if(announce.t<=0)announce=null;}
 modeTick(dt);
 shake=Math.max(0,shake-dt*30);flashA=Math.max(0,flashA-dt*.55);
 if(theme.lava&&grid&&Math.random()<dt*8){for(let k=0;k<6;k++){const i=ri(0,grid.length-1);if(grid[i]===LAVA){const x=(i%COLS)*T+rnd(6,26),y=((i/COLS)|0)*T+rnd(6,26);parts.push({x,y,vx:rnd(-8,8),vy:rnd(-60,-30),t:rnd(.4,.8),life:.8,col:Math.random()<.5?'#fb923c':'#fde047',s:2});break;}}}
 const m=me();fogOn=((NET?NET.fog!==false:fog)||!!(ARC&&ARC.dark))&&m&&m.alive; // en línea manda el anfitrión
 if(fogOn)computeVis();
}
// jugador humano conectado (en el anfitrión): usa lo que manda su dispositivo
function applyRemotePos(e,d){
 if(state!=='play'||!e.alive||e.gone)return;
 if((d.tp|0)!==(e.tp|0))return; // reporte de antes de reaparecer: se ignora
 const x=+d.x,y=+d.y;if(!isFinite(x)||!isFinite(y))return;
 const now=performance.now(),dts=Math.max(.05,(now-(e.lastRep||now))/1000);e.lastRep=now;
 let dx=x-e.x,dy=y-e.y;if(WRAP){if(dx>W/2)dx-=W;else if(dx<-W/2)dx+=W;}
 const tx=wx(Math.floor(x/T)),ty=Math.floor(y/T);
 if(Math.hypot(dx,dy)<=e.speed*T*dts*1.6+24&&walkable(tx,ty)){
  e.x=WRAP?((x%W)+W)%W:x;e.y=y;e.tx=e.ntx=tx;e.ty=e.nty=ty;e.moving=!!d.mv;if(DIRS[d.dr])e.dir=DIRS[d.dr];
  e.rejects=0;
 }else if((e.rejects=(e.rejects|0)+1)>=3){e.tp=(e.tp|0)+1;e.rejects=0;} // corrección: el invitado vuelve a la posición del anfitrión
}
function updRemote(e,dt){
 // el invitado mueve su soldado en su pantalla y reporta dónde está; aquí solo se valida (applyRemotePos)
 const I=e.input||{};
 if((I.fc|0)>e.lfc){e.lfc=I.fc|0;fire(e);}
 if(I.f)fire(e);
 if((I.gc|0)>e.lgc){e.lgc=I.gc|0;throwNade(e);}
 if((I.qc|0)>e.lqc){e.lqc=I.qc|0;cycle(e);}
}

