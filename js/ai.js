'use strict';
// Pixel Breach — IA: percepción (vista, oído, memoria), objetivos y combate
// ---------- IA ----------
// Las IAs solo saben dónde está alguien si lo ven, lo oyen disparar o les acaba de pegar.
function reveal(ai,o,seen){ai.known[o.id]={tx:wx(Math.floor(o.x/T)),ty:Math.floor(o.y/T),dir:o.dir,t:0,seen};}
function hearShot(o){for(const e of ents)if(!e.isPlayer&&e!==o&&e.alive&&Math.hypot(e.x-o.x,e.y-o.y)<=HEARING*T)reveal(e.ai,o,false);}
function perceive(e,dt){
 const a=e.ai;
 for(const k in a.known){a.known[k].t+=dt;a.known[k].seen=false;}
 for(const o of ents){
  if(o===e||!o.alive)continue;
  if(Math.hypot(e.x-o.x,e.y-o.y)<=SIGHT*T&&losPx(e.x,e.y,o.x,o.y))reveal(a,o,true);
 }
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
  for(let k=0;k<40&&!a.patrol;k++){const x=ri(1,COLS-2),y=ri(1,ROWS-2);if(walkable(x,y)&&Math.abs(x-e.tx)+Math.abs(y-e.ty)>=6)a.patrol=[x,y];}
 }
 return a.patrol;
}
function nearestPickup(e,f){let b=null,bd=1e9;for(const p of pickups){if(!f(p))continue;const d=Math.abs(p.tx-e.tx)+Math.abs(p.ty-e.ty);if(d<bd){bd=d;b=p;}}return b?{p:b,d:bd}:null;}
function pickCamp(e,far){
 let best=null,bs=-1e9;
 for(let k=0;k<40;k++){
  const x=ri(1,COLS-2),y=ri(1,ROWS-2);if(!walkable(x,y))continue;
  if(far&&Math.abs(x-e.tx)+Math.abs(y-e.ty)<6)continue; // tras una baja: posición nueva y lejana
  let s=0,bl=-1,bd=null;
  for(const d of DIRS){let l=0;while(l<12&&!blocks(tile(x+d.dx*(l+1),y+d.dy*(l+1))))l++;s+=Math.min(l,8);if(l>bl){bl=l;bd=d;}}
  s-=(Math.abs(x-e.tx)+Math.abs(y-e.ty))*.25;
  if(s>bs){bs=s;best={x,y,dir:bd};}
 }
 if(!best)return null;
 e.ai.campDir=best.dir;return [best.x,best.y];
}
function aiGoal(e){
 const a=e.ai,P=e.p;
 if(e.hp<45){const m=nearestPickup(e,p=>p.type==='medkit');if(m)return [m.p.tx,m.p.ty];}
 const onlyPistol=!['smg','shotgun','rifle'].some(k=>e.inv[k]>0);
 if(P.key==='recolector'||onlyPistol){
  const pk=nearestPickup(e,p=>p.type!=='medkit'&&e.inv[p.type]<MAXAMMO[p.type]);
  if(pk&&(onlyPistol?(P.key==='recolector'||pk.d<=6):pk.d<=4))return [pk.p.tx,pk.p.ty];
 }
 const t=nearestEnemy(e);
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
 return [t.tx,t.ty];
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
 for(const o of ents){if(o===e||!o.alive||o.invulnT>0)continue;const al=aligned(e,o,13);if(al&&(!best||al.dist<best.al.dist))best={o,al};}
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
  if(!want&&best&&a.dodgeT<=0&&!relocating){
   e.dir=best.al.dir;
   const hold={asaltante:1,flanqueador:2,campero:99,recolector:3}[P.key];
   if(best.al.dist>hold)want=best.al.dir;
  }else if(!want){
   if(P.key!=='campero'&&Math.random()<.05){
    const o=DIRS.filter(d=>walkable(e.tx+d.dx,e.ty+d.dy)&&!(d.dx===-e.dir.dx&&d.dy===-e.dir.dy));
    if(o.length)want=o[ri(0,o.length-1)];
   }else{
    const g=aiGoal(e);
    if(g){const s=nextStep(e,g);
     if(s){if(tile(e.tx+s.dx,e.ty+s.dy)===CRATE){e.dir=s;a.breach=true;}else want=s;}
     else if(P.key==='campero'&&a.campDir)e.dir=a.campDir;}
   }
  }
 }
 stepMove(e,want,dt,false);
 if(best&&a.reaction<=0&&e.dir===best.al.dir&&a.dodgeT<.35){
  const dd=best.al.dist,I=e.inv;
  if(!(I.frag>0&&dd>=2&&dd<=4&&Math.random()<.02&&throwNade(e,'frag'))&&!(I.flash>0&&dd>=2&&dd<=5&&Math.random()<.01&&throwNade(e,'flash')))fire(e);
 }
 else if(a.breach){const w=e.weapon;e.weapon=e.inv.shotgun>0?'shotgun':'pistol';if(!fire(e))e.weapon=w;}
}

