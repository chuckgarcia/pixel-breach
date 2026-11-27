'use strict';
// Pixel Breach — IA: percepción (vista, oído, memoria), objetivos y combate
// ---------- IA ----------
// Las IAs solo saben dónde está alguien si lo ven, lo oyen disparar o les acaba de pegar.
function reveal(ai,o,seen){ai.known[o.id]={tx:wx(Math.floor(o.x/T)),ty:Math.floor(o.y/T),dir:o.dir,t:0,seen};}
function hearShot(o){if(ARC&&o.enemy)return;for(const e of ents)if(!e.isPlayer&&e!==o&&e.alive&&Math.hypot(e.x-o.x,e.y-o.y)<=HEARING*T)reveal(e.ai,o,false);}
function perceive(e,dt){
 const a=e.ai;
 for(const k in a.known){a.known[k].t+=dt;a.known[k].seen=false;}
 for(const o of ents){
  if(o===e||!o.alive||(ARC&&(o.enemy||o.hostage)))continue; // en Arcade los enemigos solo te buscan a ti
  if(Math.hypot(e.x-o.x,e.y-o.y)<=SIGHT*T&&losPx(e.x,e.y,o.x,o.y))reveal(a,o,true);
 }
 {const c=carrierOf();if(c&&c!==e&&c.alive&&!(a.known[c.id]&&a.known[c.id].seen))reveal(a,c,false);} // a quien lleva la bandera lo ven todos
 for(const k in a.known){const o=ents[k];if(!o||!o.alive||a.known[k].t>MEMORY)delete a.known[k];}
}
function aligned(e,o,maxT){
 const ex=Math.floor(e.x/T),ey=Math.floor(e.y/T),ox=Math.floor(o.x/T),oy=Math.floor(o.y/T);
 if(ex===ox&&ey===oy)return null;
 if(ey===oy&&Math.abs(e.y-o.y)<12){
  const dx=Math.sign(ox-ex);if(Math.abs(ox-ex)>maxT)return null;
  for(let x=ex+dx;x!==ox;x+=dx)if(blocks(tile(x,ey)))return null;
  return {dir:DIRS[dx>0?1:3],dist:Math.abs(ox-ex)};
 }
 if(ex===ox&&Math.abs(e.x-o.x)<12){
  const dy=Math.sign(oy-ey);if(Math.abs(oy-ey)>maxT)return null;
  for(let y=ey+dy;y!==oy;y+=dy)if(blocks(tile(ex,y)))return null;
  return {dir:DIRS[dy>0?2:0],dist:Math.abs(oy-ey)};
 }
 return null;
}
function nearestEnemy(e){
 let b=null,bd=1e9;
 for(const k in e.ai.known){const o=ents[k],m=e.ai.known[k];const d=Math.abs(m.tx-e.tx)+Math.abs(m.ty-e.ty)+(o.invulnT>0?6:0);if(d<bd){bd=d;b={id:+k,tx:m.tx,ty:m.ty,dir:m.dir,seen:m.seen};}}
 return b;
}
function patrolGoal(e){
 const a=e.ai;
 if(!a.patrol||a.patrolT<=0||(a.patrol[0]===e.tx&&a.patrol[1]===e.ty)){
  a.patrolT=rnd(6,10);a.patrol=null;
  for(let k=0;k<40&&!a.patrol;k++){const x=ri(1,COLS-2),y=ri(1,ROWS-2);if(!walkable(x,y))continue;
   if(ARC&&e.home){if(Math.abs(x-e.home[0])+Math.abs(y-e.home[1])<=4&&(x!==e.tx||y!==e.ty))a.patrol=[x,y];} // en Arcade vigilan su zona hasta que te ven
   else if(Math.abs(x-e.tx)+Math.abs(y-e.ty)>=6)a.patrol=[x,y];}
 }
 return a.patrol;
}
function nearestPickup(e,f){let b=null,bd=1e9;for(const p of pickups){if(!f(p))continue;const d=Math.abs(p.tx-e.tx)+Math.abs(p.ty-e.ty);if(d<bd){bd=d;b=p;}}return b?{p:b,d:bd}:null;}
function pickCamp(e,far){
 let best=null,bs=-1e9;
 for(let k=0;k<40;k++){
  const x=ri(1,COLS-2),y=ri(1,ROWS-2);if(!walkable(x,y))continue;
  if(far&&Math.abs(x-e.tx)+Math.abs(y-e.ty)<6)continue; // tras una baja: posición nueva y lejana
  if(gameMode==='ctf'&&Math.abs(x-FLAG_HOME[0])+Math.abs(y-FLAG_HOME[1])>6)continue; // en bandera, emboscada cerca del centro
  let s=0,bl=-1,bd=null;
  for(const d of DIRS){let l=0;while(l<12&&!blocks(tile(x+d.dx*(l+1),y+d.dy*(l+1))))l++;s+=Math.min(l,8);if(l>bl){bl=l;bd=d;}}
  s-=(Math.abs(x-e.tx)+Math.abs(y-e.ty))*.25;
  if(s>bs){bs=s;best={x,y,dir:bd};}
 }
 if(!best)return null;
 e.ai.campDir=best.dir;return [best.x,best.y];
}
// ---------- POSICIÓN DE TIRO ----------
// En vez de caminar hasta tu casilla, cada IA busca una casilla en tu fila o columna, con línea libre
// y a su distancia preferida, que no ocupe ni haya elegido otro soldado. Así se reparten y no se enciman.
function aiRange(e){
 if(e.enemy&&ENEMY[e.etype]&&ENEMY[e.etype].range)return ENEMY[e.etype].range;
 const r={asaltante:[2,3],flanqueador:[3,5],recolector:[3,4],campero:[3,6]}[e.p.key]||[2,4];
 return gameMode==='lms'&&(e.lives|0)===1?[r[0]+1,r[1]+2]:r; // con la última vida, más lejos
}
function firePos(e,tx,ty,lo,hi){
 const D=distField(e.tx,e.ty);let best=null,bs=1e9;
 for(const d of DIRS)for(let k=1;k<=hi;k++){
  const x=tx+d.dx*k,y=ty+d.dy*k;if(x<0||y<0||x>=COLS||y>=ROWS)break;
  const tt=tile(x,y);if(blocks(tt))break;if(tt!==FLOOR||k<lo)continue;
  if(!(x===e.tx&&y===e.ty)&&tileTaken(e,x,y))continue;
  let s=D[idx(x,y)];if(s>=1e9)continue;
  s+=Math.abs(k-(lo+hi)/2)*.5; // mejor a media distancia
  for(const o of ents)if(o!==e&&o.alive&&o.ai&&o.ai.fpos){
   if(o.ai.fpos[0]===x&&o.ai.fpos[1]===y)s+=8; // otra IA ya la eligió
   else if(ARC&&ARC.flank&&o.enemy&&Math.sign(o.ai.fpos[0]-tx)===d.dx&&Math.sign(o.ai.fpos[1]-ty)===d.dy)s+=ARC.flank; // ese lado ya está cubierto: flanquea por otro
  }
  if(s<bs){bs=s;best=[x,y];}
 }
 return best;
}
function holdPos(e,tx,ty){ // casilla libre a 3–5 casillas de ti (aunque no tenga línea de tiro), la más cercana para la IA
 const D=distField(e.tx,e.ty);let best=null,bs=1e9;
 for(let y=Math.max(1,ty-5);y<=Math.min(ROWS-2,ty+5);y++)for(let x=Math.max(1,tx-5);x<=Math.min(COLS-2,tx+5);x++){
  const m=Math.abs(x-tx)+Math.abs(y-ty);if(m<3||m>5||!walkable(x,y)||(!(x===e.tx&&y===e.ty)&&tileTaken(e,x,y)))continue;
  let s=D[idx(x,y)]+m;for(const o of ents)if(o!==e&&o.alive&&o.ai&&o.ai.fpos&&o.ai.fpos[0]===x&&o.ai.fpos[1]===y)s+=8;if(s<bs){bs=s;best=[x,y];}}
 return best;
}
// paso hacia la meta esquivando casillas ocupadas; si el camino está tapado, rodea o espera
function aiStep(e,g){
 const D=distField(g[0],g[1]),here=D[idx(e.tx,e.ty)];let best=null,bd=1e9;
 for(const d of DIRS.slice().sort(()=>Math.random()-.5)){const nx=wx(e.tx+d.dx),ny=e.ty+d.dy,tt=tile(nx,ny);
  if(tt===WALL||tt===LAVA||(tt===FLOOR&&tileTaken(e,nx,ny)))continue;const v=D[idx(nx,ny)];if(v<bd){bd=v;best=d;}}
 if(best&&bd<here)return best;
 if(best&&bd<=here+1&&(e.ai.blockT=(e.ai.blockT||0)+1)>40){e.ai.blockT=0;return best;} // tapado un rato: rodea
 return null;
}
function aiGoal(e){
 const a=e.ai,P=e.p;
 if(hasFlag(e))return ctfGoal(e); // con la bandera: directo a su base
 const careful=gameMode==='lms'&&(e.lives|0)===1; // con la última vida se cuida más
 if(!ARC&&e.hp<(careful?70:45)){const m=nearestPickup(e,p=>p.type==='medkit');if(m)return [m.p.tx,m.p.ty];}
 if(gameMode==='ctf'){const g=ctfGoal(e);if(g&&!(g[0]===e.tx&&g[1]===e.ty))return g;}
 const onlyPistol=!['smg','shotgun','rifle'].some(k=>e.inv[k]>0);
 if(!ARC&&(P.key==='recolector'||onlyPistol)){
  const pk=nearestPickup(e,p=>p.type!=='medkit'&&e.inv[p.type]<MAXAMMO[p.type]);
  if(pk&&(onlyPistol?(P.key==='recolector'||pk.d<=6):pk.d<=4))return [pk.p.tx,pk.p.ty];
 }
 const t=nearestEnemy(e);a.fpos=null;
 if(t&&!t.seen&&t.tx===e.tx&&t.ty===e.ty){delete a.known[t.id];return patrolGoal(e);} // llegó a la última posición y no hay nadie
 if(!t&&P.key!=='campero')return patrolGoal(e);
 if(P.key==='flanqueador'&&t&&Math.abs(t.tx-e.tx)+Math.abs(t.ty-e.ty)>5){
  const f=nearestFloor(t.tx+t.dir.dx*4,t.ty+t.dir.dy*4);if(f)return f;
 }
 if(P.key==='campero'){
  if(!a.camp||a.campT<=0||e.hp<a.lastHp-1){a.camp=pickCamp(e,a.relocate);a.campT=rnd(8,13);a.lastHp=e.hp;}
  if(a.camp&&a.camp[0]===e.tx&&a.camp[1]===e.ty)a.relocate=false; // ya llegó a la nueva posición
  return a.camp;
 }
 const R=aiRange(e),fp=firePos(e,t.tx,t.ty,R[0],R[1])||firePos(e,t.tx,t.ty,2,R[1]+4)||holdPos(e,t.tx,t.ty);a.fpos=fp; // si no hay hueco: espera su turno a 3–5 casillas
 if(fp){if(!t.seen&&fp[0]===e.tx&&fp[1]===e.ty){delete a.known[t.id];return patrolGoal(e);}return fp;} // desde ahí no se ve a nadie: lo olvida
 return [t.tx,t.ty]; // sin posición libre: se acerca (no puede entrar a tu casilla)
}
function chooseWeapon(e,dist){
 const I=e.inv,a=e.ai;
 if(dist<=3&&I.shotgun>0)e.weapon='shotgun';
 else if(dist<=7&&I.smg>0)e.weapon='smg';
 else if(dist>=3&&I.rifle>0)e.weapon='rifle';
 else if(I.smg>0)e.weapon='smg';
 else if(I.shotgun>0&&dist<=4)e.weapon='shotgun';
 else e.weapon='pistol';
}
function updAI(e,dt){
 const a=e.ai,P=e.p,D=DIFF[diff];
 a.keepT-=dt;a.dodgeT-=dt;a.campT-=dt;a.breach=false;
 a.patrolT-=dt;perceive(e,dt);
 if(e.blindT>0){ // cegado por flashbang: camina al azar y no dispara
  e.blindT-=dt;
  if(!e.moving){const o=DIRS.filter(d=>walkable(e.tx+d.dx,e.ty+d.dy));a.blindDir=o.length?o[ri(0,o.length-1)]:null;}
  stepMove(e,a.blindDir,dt*.55,false);return;
 }
 // ¿viene una bala hacia mí? -> intentar cubrirse
 for(const b of bullets){
  if(b.owner===e||b.checked[e.id])continue;
  const sp=Math.hypot(b.vx,b.vy)||1,ux=b.vx/sp,uy=b.vy/sp,rx=e.x-b.x,ry=e.y-b.y;
  const t=rx*ux+ry*uy,lat=Math.abs(rx*uy-ry*ux);
  if(t>0&&t<7*T&&lat<16){b.checked[e.id]=1;if(Math.random()<P.dodge*D.dodge){a.dodgeAxisH=Math.abs(ux)>Math.abs(uy);a.dodgeT=.7;}}
 }
 // objetivo en línea de tiro
 let best=null;
 for(const o of ents){if(o===e||!o.alive||o.invulnT>0||(ARC&&(o.enemy||o.hostage)))continue;const al=aligned(e,o,13);if(al&&(!best||al.dist<best.al.dist))best={o,al};}
 if(best){
  if(a.seeId!==best.o.id){a.seeId=best.o.id;const r=(P.closeReact&&best.al.dist<=3)?P.closeReact:P.react;a.reaction=r*D.react*rnd(.8,1.3)*(tut?1.8:1);/* en la guía las IAs reaccionan más lento */}
  a.reaction-=dt;chooseWeapon(e,best.al.dist);
 }else a.seeId=-1;
 // decisión de movimiento (solo en el centro de una casilla)
 let want=null;
 if(!e.moving){
  if(a.dodgeT>0&&a.dodgeAxisH!==null){
   const perp=DIRS.filter(d=>(a.dodgeAxisH?d.dx===0:d.dy===0)&&walkable(e.tx+d.dx,e.ty+d.dy));
   a.dodgeAxisH=null;if(perp.length)want=perp[ri(0,perp.length-1)];
  }
  const relocating=P.key==='campero'&&a.relocate;
  if(!want&&best&&a.dodgeT<=0&&!relocating&&!hasFlag(e)){ /* con la bandera no se detiene a pelear */
   e.dir=best.al.dir;
   const R=P.key==='campero'?[1,99]:aiRange(e),dd=best.al.dist;
   if(dd>R[1])want=best.al.dir;
   else if(dd<R[0]){ // demasiado cerca: retrocede una casilla sin dejar de apuntarte
    const back=DIRS.find(d=>d.dx===-best.al.dir.dx&&d.dy===-best.al.dir.dy),bx=wx(e.tx+back.dx),by=e.ty+back.dy;
    if(walkable(bx,by)&&!tileTaken(e,bx,by)){want=back;a.backing=true;}
    else{const g=aiGoal(e);if(g){const s=aiStep(e,g);if(s&&tile(e.tx+s.dx,e.ty+s.dy)!==CRATE)want=s;}} // atrás está ocupado: se va a su posición de tiro
   }
  }else if(!want){
   if(P.key!=='campero'&&Math.random()<.05){
    const o=DIRS.filter(d=>walkable(e.tx+d.dx,e.ty+d.dy)&&!(d.dx===-e.dir.dx&&d.dy===-e.dir.dy));
    if(o.length)want=o[ri(0,o.length-1)];
   }else{
    const g=aiGoal(e);
    if(g){const s=aiStep(e,g);
     if(s){if(tile(e.tx+s.dx,e.ty+s.dy)===CRATE){e.dir=s;a.breach=true;}else want=s;}
     else if(P.key==='campero'&&a.campDir)e.dir=a.campDir;}
   }
  }
 }
 stepMove(e,want,dt,false);
 if(a.backing){if(best)e.dir=best.al.dir;if(!e.moving)a.backing=false;} // retrocede de frente a ti
 if(best&&a.reaction<=0&&e.dir===best.al.dir&&a.dodgeT<.35){
  const dd=best.al.dist,I=e.inv;
  if(!(I.frag>0&&dd>=2&&dd<=4&&Math.random()<.02&&throwNade(e,'frag'))&&!(I.flash>0&&dd>=2&&dd<=5&&Math.random()<.01&&throwNade(e,'flash')))fire(e);
 }
 else if(a.breach){const w=e.weapon;e.weapon=e.inv.shotgun>0?'shotgun':'pistol';if(!fire(e))e.weapon=w;}
}

