'use strict';
// Pixel Breach — Dibujo: escenarios, HUD, marcador y sprites
// ---------- RENDER ----------
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const m=c=>Math.max(0,Math.min(255,Math.round(f<0?c*(1+f):c+(255-c)*f)));return `rgb(${m(r)},${m(g)},${m(b)})`;}
// en móvil el lienzo se ve reducido, así que los textos de interfaz se agrandan (los del mapa, <10px, no)
function fsz(size){return !isTouch||size<10?size:Math.round(size*(size<20?1.5:1.15));}
function txt(s,x,y,size,col,align='left',shadow=true){
 size=fsz(size);
 ctx.font=`bold ${size}px "Courier New",monospace`;ctx.textAlign=align;ctx.textBaseline='middle';
 if(shadow){ctx.fillStyle='#000';ctx.fillText(s,x+2,y+2);}
 ctx.fillStyle=col;ctx.fillText(s,x,y);
}
const canSee=(x,y)=>!fogOn||vis[idx(Math.max(0,Math.min(COLS-1,Math.floor(x/T))),Math.max(0,Math.min(ROWS-1,Math.floor(y/T))))];
const hsh=(x,y)=>((x*73856093)^(y*19349663))>>>0;
function drawMap(){
 const D=DRAW[themeKey];
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
  const i=idx(x,y),t=grid[i],px=x*T,py=y*T;
  D.floor(px,py,x,y);
  if(t===WALL)D.wall(px,py,x,y);
  else if(t===CRATE)D.crate(px,py,x,y,crateHP[i]);
  else if(t===LAVA)drawLava(px,py,x,y);
 }
}
function rect(c,x,y,w,h){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function crackMarks(px,py,hp,col){if(hp<3){rect(col,px+8,py+10,6,2);rect(col,px+20,py+19,5,2);}if(hp<2){rect(col,px+12,py+22,8,2);rect(col,px+18,py+8,2,6);}}
function woodCrate(px,py,hp){
 rect('#5c3a1a',px+2,py+2,T-4,T-4);rect('#8b5a2b',px+5,py+5,T-10,T-10);ctx.fillStyle='#5c3a1a';
 for(let i=0;i<T-10;i+=2){ctx.fillRect(px+5+i,py+5+i,3,3);ctx.fillRect(px+T-8-i,py+5+i,3,3);}
 crackMarks(px,py,hp,'#1d2331');
}
function drawLava(px,py,x,y){
 const h=hsh(x,y),w=.5+.5*Math.sin(clock*2.5+x*1.7+y*1.3);
 rect('#7c1d06',px,py,T,T);
 ctx.fillStyle=`rgba(234,88,12,${.55+w*.45})`;ctx.fillRect(px+3,py+3,T-6,T-6);
 ctx.fillStyle=`rgba(253,186,116,${.35+w*.4})`;ctx.fillRect(px+8+(h%6),py+8+((h>>3)%6),10,6);ctx.fillRect(px+5+((h>>5)%10),py+19,6,4);
 const b=Math.floor(clock*2+h)%4;rect('#fde047',px+6+((h>>b)%18),py+6+((h>>(b+2))%18),3,3);
 rect('rgba(0,0,0,.25)',px,py,T,2);
}
const DRAW={
 bunker:{
  floor:(px,py,x,y)=>rect(((x+y)&1)?'#1a1f2b':'#1d2331',px,py,T,T),
  wall:(px,py)=>{rect('#3b4558',px,py,T,T);rect('#56637a',px,py,T,4);rect('#262d3a',px,py+T-5,T,5);
   ctx.fillStyle='#323b4c';ctx.fillRect(px,py+13,T,2);ctx.fillRect(px+15,py+4,2,9);ctx.fillRect(px+7,py+15,2,12);ctx.fillRect(px+23,py+15,2,12);},
  crate:(px,py,x,y,hp)=>woodCrate(px,py,hp),
 },
 jungle:{
  floor:(px,py,x,y)=>{rect(((x+y)&1)?'#1e3a22':'#21402a',px,py,T,T);const h=hsh(x,y);ctx.fillStyle='#2f5a35';
   ctx.fillRect(px+(h%24)+2,py+((h>>4)%22)+4,2,4);ctx.fillRect(px+((h>>8)%24)+3,py+((h>>12)%22)+3,2,3);ctx.fillRect(px+((h>>16)%24)+2,py+((h>>20)%22)+5,2,4);},
  wall:(px,py,x,y)=>{ // árbol
   rect('rgba(0,0,0,.35)',px+4,py+24,26,7);rect('#5b3a1e',px+13,py+19,7,11);rect('#3f2814',px+13,py+26,7,4);
   rect('#14532d',px+3,py+5,26,17);rect('#14532d',px+7,py+1,18,25);rect('#166534',px+5,py+3,20,15);
   rect('#22803d',px+8,py+4,8,6);rect('#22803d',px+17,py+9,6,5);rect('#3aa356',px+9,py+5,3,3);rect('#0f3d22',px+4,py+18,24,4);},
  crate:(px,py,x,y,hp)=>{ // arbusto
   const h=hsh(x,y);rect('rgba(0,0,0,.3)',px+5,py+24,22,5);
   rect('#4d7c0f',px+4,py+9,24,17);rect('#4d7c0f',px+8,py+5,16,24);rect('#65a30d',px+7,py+8,18,12);
   rect('#a3e635',px+9,py+9,5,4);rect('#a3e635',px+17,py+13,5,4);
   if(hp>1){rect('#dc2626',px+10+(h%8),py+15,3,3);rect('#dc2626',px+18,py+9+(h%6),3,3);}
   crackMarks(px,py,hp,'#0b2614');},
 },
 brick:{
  floor:(px,py,x,y)=>{rect(((x+y)&1)?'#2b2b30':'#2f2f35',px,py,T,T);rect('#242428',px,py,T,1);rect('#242428',px,py,1,T);},
  wall:(px,py,x,y)=>{rect('#8f3a2c',px,py,T,T);ctx.fillStyle='#4a1f18';
   for(let r=0;r<4;r++){ctx.fillRect(px,py+r*8+6,T,2);const off=((r+y)&1)?8:0;for(let c=off;c<T;c+=16)ctx.fillRect(px+c,py+r*8,2,6);}
   rect('#b4513f',px,py,T,2);rect('rgba(0,0,0,.25)',px,py+T-3,T,3);},
  crate:(px,py,x,y,hp)=>woodCrate(px,py,hp),
 },
 arcade:{
  floor:(px,py)=>rect('#000',px,py,T,T),
  wall:(px,py,x,y)=>{ // líneas azules estilo Pac-Man: solo se dibuja el borde que da al pasillo
   rect('#000',px,py,T,T);
   const isW=(ax,ay)=>{const t=tile(ax,ay);return t===WALL;},I=7,L=3;
   const up=!isW(x,y-1),dn=!isW(x,y+1),lf=!isW(x-1,y),rt=!isW(x+1,y);
   ctx.fillStyle='#2b4cff';
   const x0=lf?I:0,x1=rt?T-I:T,y0=up?I:0,y1=dn?T-I:T;
   if(up)ctx.fillRect(px+x0,py+I,x1-x0,L);
   if(dn)ctx.fillRect(px+x0,py+T-I-L,x1-x0,L);
   if(lf)ctx.fillRect(px+I,py+y0,L,y1-y0);
   if(rt)ctx.fillRect(px+T-I-L,py+y0,L,y1-y0);
   // esquinas interiores (cuando el pasillo toca solo en diagonal)
   if(!up&&!lf&&!isW(x-1,y-1))ctx.fillRect(px,py+I,I+L,L),ctx.fillRect(px+I,py,L,I);
   if(!up&&!rt&&!isW(x+1,y-1))ctx.fillRect(px+T-I-L,py+I,I+L,L),ctx.fillRect(px+T-I-L,py,L,I);
   if(!dn&&!lf&&!isW(x-1,y+1))ctx.fillRect(px,py+T-I-L,I+L,L),ctx.fillRect(px+I,py+T-I,L,I);
   if(!dn&&!rt&&!isW(x+1,y+1))ctx.fillRect(px+T-I-L,py+T-I-L,I+L,L),ctx.fillRect(px+T-I-L,py+T-I,L,I);},
  crate:(px,py,x,y,hp)=>{rect('#fbbf24',px+5,py+5,T-10,T-10);rect('#000',px+7,py+7,T-14,T-14);
   const r=hp>2?5:hp>1?4:2;ctx.fillStyle='#fde68a';ctx.beginPath();ctx.arc(px+T/2,py+T/2,r,0,6.283);ctx.fill();},
 },
 desert:{
  floor:(px,py,x,y)=>{rect(((x+y)&1)?'#b8975e':'#bf9e65',px,py,T,T);const h=hsh(x,y);ctx.fillStyle='#a8874f';
   ctx.fillRect(px+(h%26)+2,py+((h>>4)%26)+2,2,1);ctx.fillRect(px+((h>>8)%26)+2,py+((h>>12)%26)+3,3,1);ctx.fillStyle='#d1b47c';ctx.fillRect(px+((h>>16)%24)+4,py+((h>>20)%24)+4,2,1);},
  wall:(px,py,x,y)=>{ // costales de arena apilados
   rect('rgba(60,40,10,.35)',px+2,py+T-4,T-2,4);
   for(let r=0;r<3;r++){const off=((r+x)&1)?-8:0;for(let c=off;c<T;c+=16){const bx=px+Math.max(0,c),bw=Math.min(16,T-Math.max(0,c),16+Math.min(0,c));if(bw<=2)continue;
     const by=py+r*10+1;rect('#7a6440',bx,by,bw,10);rect('#a58a5c',bx+1,by+1,bw-2,7);rect('#c2a875',bx+2,by+1,bw-4,2);rect('#6b5637',bx+bw-2,by+3,1,4);}}},
  crate:(px,py,x,y,hp)=>{ // tambo metálico
   rect('rgba(0,0,0,.3)',px+7,py+26,20,4);rect('#3f4a22',px+7,py+4,18,24);rect('#55632e',px+9,py+4,6,24);
   rect('#2f3819',px+7,py+10,18,2);rect('#2f3819',px+7,py+20,18,2);rect('#6b7a3a',px+8,py+4,16,2);crackMarks(px,py,hp,'#1a1f0e');},
 },
 killhouse:{
  floor:(px,py,x,y)=>{rect(((x+y)&1)?'#3a3a3e':'#3e3e43',px,py,T,T);const h=hsh(x,y);if(h%9===0){rect('#facc15',px+4,py+14,24,2);}},
  wall:(px,py,x,y)=>{ // tablas de madera (triplay)
   rect('#9c6f3c',px,py,T,T);ctx.fillStyle='#6e4a24';for(let c=0;c<T;c+=8)ctx.fillRect(px+c,py,1,T);
   ctx.fillStyle='#b7874f';for(let c=1;c<T;c+=8)ctx.fillRect(px+c,py,2,T);
   const h=hsh(x,y);rect('#7d5530',px+((h%4)*8)+3,py+((h>>3)%20)+4,3,2);
   rect('#2b2b2b',px+3,py+4,1,1);rect('#2b2b2b',px+11,py+4,1,1);rect('#2b2b2b',px+19,py+4,1,1);rect('#2b2b2b',px+27,py+4,1,1);
   rect('#2b2b2b',px+3,py+27,1,1);rect('#2b2b2b',px+11,py+27,1,1);rect('#2b2b2b',px+19,py+27,1,1);rect('#2b2b2b',px+27,py+27,1,1);
   rect('#c99a5f',px,py,T,2);rect('rgba(0,0,0,.3)',px,py+T-3,T,3);},
  crate:(px,py,x,y,hp)=>{ // llantas apiladas
   rect('rgba(0,0,0,.3)',px+5,py+25,22,5);
   for(const oy of [16,6]){ctx.fillStyle='#111827';ctx.beginPath();ctx.ellipse(px+16,py+oy+5,11,6,0,0,6.283);ctx.fill();
    ctx.fillStyle='#374151';ctx.beginPath();ctx.ellipse(px+16,py+oy+4,10,5,0,0,6.283);ctx.fill();
    ctx.fillStyle='#0b0f17';ctx.beginPath();ctx.ellipse(px+16,py+oy+4,5,2.5,0,0,6.283);ctx.fill();}
   crackMarks(px,py,hp,'#9ca3af');},
 },
 volcano:{
  floor:(px,py,x,y)=>{rect(((x+y)&1)?'#231816':'#271a17',px,py,T,T);const h=hsh(x,y);if(h%3===0){ctx.fillStyle=`rgba(249,115,22,${.15+.1*Math.sin(clock*2+x)})`;ctx.fillRect(px+(h%20)+4,py+((h>>5)%20)+6,8,1);ctx.fillRect(px+(h%20)+11,py+((h>>5)%20)+6,1,5);}},
  wall:(px,py,x,y)=>{ // roca
   const h=hsh(x,y);rect('#5a4636',px+1,py+1,T-2,T-2);rect('#7a604a',px+3,py+2,T-10,8);rect('#7a604a',px+3,py+10,8,10);
   rect('#3a2c22',px+T-9,py+8,8,T-10);rect('#3a2c22',px+6,py+T-7,T-8,6);rect('#8d7158',px+5+(h%8),py+4,4,3);
   rect(((x+y)&1)?'#231816':'#271a17',px,py,3,3);rect(((x+y)&1)?'#231816':'#271a17',px+T-3,py+T-3,3,3);},
  crate:(px,py,x,y,hp)=>{ // caja de madera tradicional, chamuscada en las orillas
   woodCrate(px,py,hp);
   ctx.fillStyle='rgba(20,10,5,.45)';ctx.fillRect(px+2,py+2,T-4,3);ctx.fillRect(px+2,py+T-5,T-4,3);ctx.fillRect(px+2,py+2,3,T-4);ctx.fillRect(px+T-5,py+2,3,T-4);
   const w=.5+.5*Math.sin(clock*4+x*2+y);ctx.fillStyle=`rgba(251,146,60,${.45+w*.5})`;
   ctx.fillRect(px+4,py+T-5,3,2);ctx.fillRect(px+T-9,py+T-5,4,2);ctx.fillRect(px+T-5,py+9,2,3);},
 },
};
function drawPickups(){
 for(const p of pickups){
  if(p.life!==undefined&&p.life<3&&Math.floor(p.life*8)%2)continue;
  const P=PICK[p.type],x=p.tx*T+T/2,y=p.ty*T+T/2+Math.sin(p.t*4)*2;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x-9,p.ty*T+T-7,18,4);
  if(p.type==='medkit'){
   ctx.fillStyle='#f1f5f9';ctx.fillRect(x-9,y-9,18,18);ctx.fillStyle='#dc2626';ctx.fillRect(x-2,y-6,4,12);ctx.fillRect(x-6,y-2,12,4);
  }else{
   ctx.fillStyle='#0f131b';ctx.fillRect(x-11,y-9,22,18);ctx.fillStyle=P.col;ctx.fillRect(x-11,y-9,22,2);ctx.fillRect(x-11,y+7,22,2);ctx.fillRect(x-11,y-9,2,18);ctx.fillRect(x+9,y-9,2,18);
   txt(P.lbl,x,y+1,9,P.col,'center',false);
  }
 }
}
function drawFx(){
 for(const f of fx){
  const a=f.t/f.max;
  if(f.kind==='boom'){
   ctx.fillStyle=(Math.floor(f.t*30)%2)?`rgba(255,200,60,${a})`:`rgba(255,110,30,${a})`;
   ctx.fillRect(f.x*T+2,f.y*T+2,T-4,T-4);
   ctx.fillStyle=`rgba(255,255,210,${a})`;ctx.fillRect(f.x*T+9,f.y*T+9,T-18,T-18);
  }else{
   ctx.fillStyle=`rgba(255,255,255,${a*.6})`;ctx.beginPath();ctx.arc(f.px,f.py,(1-a)*4.5*T+8,0,6.283);ctx.fill();
  }
 }
}
function drawHeard(){ // fogonazos de disparos que oyes pero no ves
 for(const h of heard){
  if(canSee(h.x,h.y))continue;
  const a=h.t/h.max;
  ctx.strokeStyle=`rgba(253,224,71,${a*.7})`;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(h.x,h.y,5+(1-a)*16,0,6.283);ctx.stroke();
  ctx.fillStyle=`rgba(255,247,174,${a})`;ctx.fillRect(Math.round(h.x)-3,Math.round(h.y)-3,6,6);
  ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.fillRect(Math.round(h.x)-1,Math.round(h.y)-1,2,2);
 }
}
function drawFog(){
 ctx.fillStyle=theme.fog;
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(!vis[idx(x,y)])ctx.fillRect(x*T,y*T,T,T);
}
// ---------- SOLDADOS: los dibujos y aspectos están en skins.js ----------
function drawSoldier(e,x,y){
 const d=e.dir,face=d.dy<0?'up':d.dy>0?'down':d.dx>0?'right':'left';
 const frame=e.moving?(Math.floor((e.x+e.y)/7)%2?1:2):0;
 ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x-10,y+11,20,4);
 drawSkin(ctx,e.skin,e.color,face,frame,e.hurtT>0,GUN_OF(e.weapon),x,y+13,2);
}
function awareOf(e){ // ¿esta IA sabe dónde estoy?
 if(NET&&NET.role==='client'){const v=e.aw&&e.aw[myId];return v===undefined?null:{seen:!!v};}
 return e.ai?e.ai.known[myId]:null;
}
function drawEnt(e){
 if(!e.alive||!(canSee(e.x,e.y)||hasFlag(e)))return; // quien lleva la bandera se ve a través de la niebla
 if(e.invulnT>0&&Math.floor(e.invulnT*12)%2)ctx.globalAlpha=.4;
 const x=Math.round(e.x),y=Math.round(e.y),d=e.dir;
 drawSoldier(e,x,y);
 if(hasFlag(e))drawCarriedFlag(e,x,y);
 ctx.globalAlpha=1;
 if(e.hp<100){ctx.fillStyle='#3f1d1d';ctx.fillRect(x-11,y-33,22,3);ctx.fillStyle=e.hp>50?'#4ade80':e.hp>25?'#facc15':'#ef4444';ctx.fillRect(x-11,y-33,22*e.hp/100,3);}
 if(e.id===myId&&e.invulnT>0)txt('TÚ',x,y-38,10,'#4ade80','center');
 else if(e.isPlayer&&NET&&e.invulnT>0)txt(e.name,x,y-38,10,e.color,'center');
 if(!e.isPlayer&&e.blindT<=0&&state==='play'){const k=awareOf(e);if(k)txt(k.seen?'!':'?',x+15,y-30,13,k.seen?'#f87171':'#facc15','center');}
 if(e.blindT>0){ctx.fillStyle='#fde047';for(let k=0;k<3;k++){const an=clock*6+k*2.09;ctx.fillRect(x+Math.cos(an)*11-2,y-24+Math.sin(an)*3-2,4,4);}}
}
function drawNades(){
 for(const g of nades){
  if(!canSee(g.x,g.y))continue;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(g.x-5,g.y+4,10,3);
  ctx.fillStyle=g.type==='frag'?'#4d7c0f':'#cbd5e1';ctx.fillRect(g.x-5,g.y-5,10,10);
  ctx.fillStyle=g.type==='frag'?'#84cc16':'#f8fafc';ctx.fillRect(g.x-3,g.y-3,4,4);
  if(Math.floor(g.fuse*(g.fuse<.6?20:6))%2){ctx.fillStyle='#ef4444';ctx.fillRect(g.x-1,g.y-8,3,3);}
 }
}
function drawBullets(){
 ctx.lineWidth=3;
 for(const b of bullets){
  if(!canSee(b.x,b.y)||(b.vis&&(b.trav||0)<b.vis))continue; // todavía dentro del arma
  ctx.strokeStyle=b.color;ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(b.x-b.vx*.025,b.y-b.vy*.025);ctx.lineTo(b.x,b.y);ctx.stroke();
  ctx.globalAlpha=1;ctx.fillStyle=b.color;ctx.fillRect(b.x-2,b.y-2,4,4);
 }
}
function drawParts(){
 for(const p of parts){if(!canSee(p.x,p.y))continue;ctx.globalAlpha=Math.min(1,p.t/p.life*1.5);ctx.fillStyle=p.col;ctx.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);}
 ctx.globalAlpha=1;
}
function drawHUD(){
 const p=me();
 if(!p){ // barra del espectador: tiempo y quién va ganando
  ctx.fillStyle='#0f131b';ctx.fillRect(0,0,W,HUD);ctx.fillStyle='#1f2937';ctx.fillRect(0,HUD-2,W,2);
  txt('ESPECTADOR',10,22,14,'#facc15');
  const top=[...ents].filter(e=>!e.gone).sort(byScore).slice(0,3),val=e=>gameMode==='ctf'?(e.caps|0)+'⚑':gameMode==='lms'?(e.lives|0)+'♥':String(e.frags);
  let x=170;for(const e of top){const s=e.name+' '+val(e);ctx.fillStyle=e.color;ctx.fillRect(x,16,10,10);txt(s,x+15,22,11,'#e2e8f0','left',false);x+=ctx.measureText(s).width+34;}
  const m=Math.ceil(timeLeft);txt(`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`,W-10,22,15,'#e2e8f0','right');
  return;
 }
 ctx.fillStyle='#0f131b';ctx.fillRect(0,0,W,HUD);ctx.fillStyle='#1f2937';ctx.fillRect(0,HUD-2,W,2);
 txt('HP',8,22,12,'#94a3b8');
 ctx.fillStyle='#2a1215';ctx.fillRect(32,14,104,16);
 const hp=Math.max(0,p.hp);ctx.fillStyle=hp>50?'#4ade80':hp>25?'#facc15':'#ef4444';ctx.fillRect(34,16,hp,12);
 txt(String(Math.ceil(hp)),84,23,11,'#0b0d12','center',false);
 ORDER.forEach((k,i)=>{
  const x=148+i*58,y=6,w=54,h=32,has=p.inv[k]>0,cur=p.weapon===k;
  ctx.fillStyle=cur?'#14301f':'#151a24';ctx.fillRect(x,y,w,h);
  ctx.strokeStyle=cur?'#4ade80':'#2b3444';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2);
  const nextNade=k===(p.inv.frag>0?'frag':p.inv.flash>0?'flash':null);
  if(nextNade){ctx.strokeStyle='#facc15';ctx.strokeRect(x+1,y+1,w-2,h-2);}
  if(!isTouch)txt(i<4?'Q':'G',x+6,y+8,8,'#64748b','left',false);
  txt(WEAP[k].short,x+w/2,y+11,11,has?WEAP[k].color:'#475569','center',false);
  txt(k==='pistol'?'∞':String(p.inv[k]),x+w/2,y+24,11,has?'#e2e8f0':'#475569','center',false);
 });
 const m=Math.ceil(timeLeft);
 txt(`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`,W-10,14,15,timeLeft<30?'#f87171':'#e2e8f0','right');
 hudGoal(p);
}
function drawFeed(){
 ctx.font=`bold ${fsz(11)}px "Courier New",monospace`;
 let y=HUD+12;
 for(const f of feed.slice(-5)){
  ctx.globalAlpha=Math.min(1,f.t);
  const tw=f.parts.reduce((s,[t])=>s+ctx.measureText(t).width,0);
  let x=W-10-tw;
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x-6,y-8,tw+12,16);
  for(const [t,c] of f.parts){txt(t,x,y,11,c,'left',false);x+=ctx.measureText(t).width;}
  y+=18;
 }
 ctx.globalAlpha=1;
 if(toast){ctx.globalAlpha=Math.min(1,toast.t*2);txt(toast.text,W/2,HUD+H-22,14,toast.col,'center');ctx.globalAlpha=1;}
}
function overlay(a){ctx.fillStyle=`rgba(8,10,16,${a})`;ctx.fillRect(0,0,W,cv.height);}
function scoreboard(y0){
 const rows=[...ents].sort(byScore),extra=gameMode==='ctf'?'CAPTURAS':gameMode==='lms'?'VIDAS':null;
 txt('JUGADOR',150,y0,12,'#64748b');txt('BAJAS',480,y0,12,'#64748b','right');txt('MUERTES',560,y0,12,'#64748b','right');if(extra)txt(extra,400,y0,12,'#facc15','right');
 rows.forEach((e,i)=>{const y=y0+26+i*24;ctx.fillStyle=e.color;ctx.fillRect(132,y-6,11,11);
  txt(e.name,150,y,14,e.id===myId?'#4ade80':e.gone?'#475569':'#e2e8f0');
  const w=ctx.measureText(e.name).width;
  txt(e.id===myId?'TÚ':e.gone?'SALIÓ':e.isPlayer?'EN LÍNEA':e.style,150+w+8,y+1,10,e.id===myId?'#4ade80':e.isPlayer?e.color:'#64748b','left',false);
  txt(String(e.frags),480,y,14,'#e2e8f0','right');txt(String(e.deaths),560,y,14,'#94a3b8','right');
  if(extra)txt(gameMode==='lms'&&e.out?'FUERA':String(gameMode==='ctf'?e.caps|0:e.lives|0),400,y,14,gameMode==='lms'&&e.out?'#f87171':'#facc15','right');});
}
function drawTitle(){} // el fondo se ve completo; el menú oscurece solo el centro
