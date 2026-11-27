'use strict';
// Pixel Breach — Modos de juego: CAPTURA LA BANDERA y ÚLTIMO EN PIE (deathmatch es el juego base)
// El anfitrión (o la partida de un jugador) decide todo aquí; los invitados reciben la bandera, capturas y vidas en cada foto.

// ---------- INICIO ----------
function applyModePreset(m){
 gameMode=MODES[m]?m:'dm';const P=MODES[gameMode].p[presetIdx(gameMode)];
 matchTime=P.t;fragLimit=gameMode==='dm'?P.f:Infinity;capLimit=P.c||3;lifeCount=P.l||3;
}
function modeStart(){ // después de crear y colocar a los soldados
 flag=null;
 ents.forEach((e,i)=>{e.caps=0;e.lives=lifeCount;e.out=false;e.base=i%4;});
 if(gameMode==='ctf')flag={x:FLAG_HOME[0]*T+T/2,y:FLAG_HOME[1]*T+T/2,carrier:-1,dropT:0};
 goalSign={text:modeGoal(),t:3.2};
}
const baseOf=e=>SPAWNS[(e.base|0)%4];
const carrierOf=()=>flag&&flag.carrier>=0?ents[flag.carrier]||null:null;
const hasFlag=e=>!!(flag&&e&&flag.carrier===e.id);
const flagTile=()=>[wx(Math.floor(flag.x/T)),Math.floor(flag.y/T)];
// orden del tablero y del ganador según el modo
function modeScore(e){
 if(gameMode==='ctf')return [e.caps|0,e.frags,-e.deaths];
 if(gameMode==='lms')return [e.out?0:1,e.lives|0,e.frags,-e.deaths];
 return [e.frags,-e.deaths];
}
function byScore(a,b){const x=modeScore(a),y=modeScore(b);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return y[i]-x[i];return 0;}

// ---------- CAPTURA LA BANDERA ----------
function flagHome(){flag.carrier=-1;flag.dropT=0;flag.x=FLAG_HOME[0]*T+T/2;flag.y=FLAG_HOME[1]*T+T/2;}
function dropFlag(e){ // te derriban o sales: la bandera se queda en tu casilla
 if(!hasFlag(e))return;
 flag.carrier=-1;flag.dropT=FLAG_RETURN;flag.x=wx(Math.floor(e.x/T))*T+T/2;flag.y=Math.floor(e.y/T)*T+T/2;
 emitEv({k:'flag',a:'drop'});
}
function updFlag(dt){
 if(!flag||state!=='play')return;
 const c=carrierOf();
 if(c){
  if(!c.alive||c.gone){dropFlag(c);return;}
  flag.x=c.x;flag.y=c.y;
  const b=baseOf(c);
  if(wx(Math.floor(c.x/T))===b[0]&&Math.floor(c.y/T)===b[1]){ // ¡captura!
   c.caps=(c.caps|0)+1;flagHome();
   emitEv({k:'flag',a:'cap',id:c.id,n:c.name,c:c.color,s:c.caps,l:capLimit});
   emitEv({k:'feed',parts:[[c.name,c.color],[` capturó la bandera ${c.caps}/${capLimit}`,'#facc15']]});
   if(c.caps>=capLimit)endMatch();
  }
  return;
 }
 if(flag.dropT>0){flag.dropT-=dt;if(flag.dropT<=0){flagHome();emitEv({k:'flag',a:'ret'});return;}}
 for(const e of ents){
  if(!e.alive||e.gone)continue;
  if(Math.abs(e.x-flag.x)<14&&Math.abs(e.y-flag.y)<14){
   flag.carrier=e.id;flag.dropT=0;if(e.st)e.st.picks++;
   emitEv({k:'flag',a:'take',id:e.id,n:e.name,c:e.color});return;
  }
 }
}
function flagEv(ev){ // avisos de la bandera (anfitrión, invitados y un jugador)
 const n=String(ev.n||'').slice(0,10),c=/^#[0-9a-f]{6}$/i.test(ev.c)?ev.c:'#facc15';
 if(ev.a==='take'){if(ev.id===myId)showToast('¡TOMASTE LA BANDERA! LLÉVALA A TU BASE','#facc15');else showToast(n+' TIENE LA BANDERA',c);sfx('pick');}
 else if(ev.a==='drop'){showToast('LA BANDERA CAYÓ','#facc15');}
 else if(ev.a==='ret'){showToast('LA BANDERA VOLVIÓ AL CENTRO','#cbd5e1');sfx('tick');}
 else if(ev.a==='cap'){announce={text:`¡CAPTURA DE ${n}! ${ev.s|0}/${ev.l|0}`,c,t:2.2};sfx(ev.id===myId?'win':'streak');}
}
// IAs: qué buscan según su estilo
function ctfGoal(e){
 if(!flag)return null;
 const P=e.p.key,c=carrierOf(),[fx,fy]=flagTile(),d=Math.abs(fx-e.tx)+Math.abs(fy-e.ty);
 if(c===e){const b=baseOf(e);return [b[0],b[1]];} // la llevo: a mi base
 if(!c){ // libre (en el centro o tirada): casi todos van por ella; el campero solo si le queda cerca
  if(P!=='campero'||d<=6)return [fx,fy];
  return null;
 }
 const ct=[wx(Math.floor(c.x/T)),Math.floor(c.y/T)],dc=Math.abs(ct[0]-e.tx)+Math.abs(ct[1]-e.ty);
 if(P==='flanqueador'&&dc>3){ // se adelanta a la ruta del portador hacia su base
  const b=baseOf(c),g=nearestFloor(Math.round((ct[0]+b[0]*2)/3),Math.round((ct[1]+b[1]*2)/3));
  if(g&&!(g[0]===e.tx&&g[1]===e.ty))return g;
 }
 if(P==='campero'&&dc>6)return null; // espera cerca del centro
 return ct; // asaltante y recolector persiguen al portador
}

// ---------- ÚLTIMO EN PIE ----------
function loseLife(e){
 if(gameMode!=='lms')return;
 e.lives=Math.max(0,(e.lives|0)-1);
 if(e.lives<=0){
  e.out=true;e.respawnT=1e9;
  const left=ents.filter(o=>!o.gone&&!o.out).length;
  emitEv({k:'feed',parts:[[e.name,e.color],[' quedó fuera','#f87171']]});
  if(left>1)emitEv({k:'out',id:e.id,left});
 }
}
function lmsCheck(){if(gameMode==='lms'&&state==='play'&&ents.filter(e=>!e.gone&&!e.out).length<=1)endMatch();}
const playersLeft=()=>ents.filter(e=>!e.gone&&!e.out).length;

// ---------- DIBUJO ----------
function drawFlagAt(g,x,y,s){ // asta y tela en pixel art; (x,y) = pie del asta
 s=s||1;const r=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x+a*s),Math.round(y+b*s),Math.round(w*s),Math.round(h*s));};
 r('rgba(0,0,0,.35)',-4,1,10,3);
 r('#0b0e14',-1,-18,4,22);r('#cbd5e1',0,-17,2,20);
 r('#0b0e14',1,-18,14,11);r('#f1f5f9',2,-17,12,9);r('#ef4444',2,-17,12,3);r('#facc15',6,-13,4,3);
}
let routeCache=null;
function myRoute(m){ // casillas de mi posición a mi base (solo cuando llevo la bandera)
 const b=baseOf(m),key=gridVer+':'+b;
 if(!routeCache||routeCache.key!==key)routeCache={key,D:distField(b[0],b[1])};
 const D=routeCache.D,out=[];let x=wx(Math.floor(m.x/T)),y=Math.floor(m.y/T);
 for(let k=0;k<60;k++){
  let best=null,bd=D[idx(x,y)];if(bd<=0)break;
  for(const d of DIRS){const nx=wx(x+d.dx),ny=y+d.dy,tt=tile(nx,ny);if(tt===WALL||tt===LAVA)continue;const v=D[idx(nx,ny)];if(v<bd){bd=v;best=[nx,ny];}}
  if(!best)break;x=best[0];y=best[1];out.push(best);
 }
 return out;
}
function drawModeMap(){ // bases y bandera (dentro del mapa, antes que los soldados)
 if(gameMode!=='ctf'||!flag)return;
 ctx.setLineDash([4,3]);ctx.lineWidth=2;
 for(const e of ents){if(e.gone)continue;const b=baseOf(e),x=b[0]*T,y=b[1]*T;
  ctx.fillStyle=e.color+'40';ctx.fillRect(x+2,y+2,T-4,T-4);ctx.strokeStyle=e.color;ctx.strokeRect(x+3,y+3,T-6,T-6);}
 ctx.setLineDash([]);
 const m=me();
 if(m&&m.alive&&hasFlag(m)){const a=.35+.25*Math.sin(clock*6);ctx.fillStyle=`rgba(250,204,21,${a})`;for(const [x,y] of myRoute(m))ctx.fillRect(x*T+T/2-3,y*T+T/2-3,6,6);}
 if(!carrierOf()&&canSee(flag.x,flag.y)){
  const bob=Math.round(Math.sin(clock*4)*1.5);drawFlagAt(ctx,flag.x-6,flag.y+10+bob,1);
  if(flag.dropT>0)txt(String(Math.ceil(flag.dropT)),flag.x+4,flag.y-18,10,'#facc15','center');
 }
}
function drawCarriedFlag(e,x,y){drawFlagAt(ctx,x+6,y-6,.8);}
function drawFlagArrow(){ // flecha amarilla en la orilla de lo que ves cuando la bandera está bajo la niebla
 const m=me();if(gameMode!=='ctf'||!flag||!m||!m.alive||carrierOf()||canSee(flag.x,flag.y))return;
 const dx=flag.x-m.x,dy=flag.y-m.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,k=Math.min(d-20,84);if(k<30)return;
 const ax=m.x+ux*k,ay=m.y+uy*k,an=Math.atan2(uy,ux),p=.7+.3*Math.sin(clock*6);
 ctx.save();ctx.translate(ax,ay);ctx.rotate(an);ctx.globalAlpha=p;
 ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-9,-11);ctx.lineTo(-4,0);ctx.lineTo(-9,11);ctx.closePath();ctx.fill();
 ctx.fillStyle='#facc15';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-7,-8);ctx.lineTo(-3,0);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();
 ctx.restore();
}
const HEART=['.XX.XX.','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...'];
function drawHearts(x,y,n,total,s){ // corazones en pixel art, alineados a la derecha en x
 s=s||2;for(let i=0;i<total;i++){const full=i<n,ox=x-(total-i)*(7*s+3);
  for(let r=0;r<HEART.length;r++)for(let c=0;c<7;c++)if(HEART[r][c]==='X'){ctx.fillStyle=full?'#ef4444':'#3f1d1d';ctx.fillRect(ox+c*s,y+r*s,s,s);}}
}
function hudGoal(p){ // segunda línea a la derecha del marcador
 if(gameMode==='ctf')txt(`BANDERA ${p.caps|0}/${capLimit}`,W-10,32,11,'#facc15','right');
 else if(gameMode==='lms'){drawHearts(W-8,26,p.lives|0,lifeCount,2);txt('VIDAS',W-14-lifeCount*17,32,11,'#f87171','right');}
 else txt(`BAJAS ${p.frags}/${fragLimit}`,W-10,32,11,'#4ade80','right');
}
function modeChip(t,col,icon){ // etiqueta arriba al centro, sobre el muro del borde; se transparenta si tu soldado pasa por debajo
 ctx.font=`bold ${fsz(11)}px "Courier New",monospace`;const w=ctx.measureText(t).width+(icon?34:16),x=W/2-w/2,m=me();
 const under=m&&m.alive&&m.y<64&&Math.abs(m.x-W/2)<w/2+20;ctx.globalAlpha=under?.3:1;
 ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x,HUD+5,w,20);if(icon)drawFlagAt(ctx,x+8,HUD+22,.55);
 txt(t,x+(icon?24:8),HUD+15,11,col,'left',false);ctx.globalAlpha=1;
}
function drawModeHud(){ // letrero de la meta al empezar y estado de la bandera / sobrevivientes
 if(state!=='play')return;
 if(gameMode==='ctf'&&flag){
  const c=carrierOf(),mine=c&&c.id===myId;
  modeChip(c?(mine?'LA LLEVAS TÚ':c.name+' LA TIENE'):flag.dropT>0?`TIRADA · VUELVE EN ${Math.ceil(flag.dropT)} s`:'EN EL CENTRO',c?c.color:'#facc15',true);
 }else if(gameMode==='lms')modeChip(`QUEDAN ${playersLeft()}`,'#f87171',false);
 if(goalSign&&goalSign.t>0&&!paused){
  const a=Math.min(1,goalSign.t*2);ctx.globalAlpha=a;
  ctx.font=`bold ${fsz(16)}px "Courier New",monospace`;const w=Math.min(W-20,ctx.measureText(goalSign.text).width+40),h=fsz(16)+22;
  const y=HUD+T*3+4; // entre las filas de las esquinas: no tapa a nadie al aparecer
  ctx.fillStyle='rgba(8,10,16,.8)';ctx.fillRect(W/2-w/2,y,w,h);ctx.strokeStyle='#facc15';ctx.lineWidth=2;ctx.strokeRect(W/2-w/2,y,w,h);
  txt(goalSign.text,W/2,y+h/2+1,16,'#facc15','center');ctx.globalAlpha=1;
 }
}
function modeTick(dt){if(goalSign){goalSign.t-=dt;if(goalSign.t<=0)goalSign=null;}}
function modeEv(ev){ // avisos que viajan con los eventos
 if(ev.k==='flag')flagEv(ev);
 else if(ev.k==='out'){announce={text:ev.id===myId?'SIN VIDAS · MIRAS LA PARTIDA':`QUEDAN ${ev.left|0}`,c:'#f87171',t:1.9};sfx('streak');}
}
function winTitle(w){ // título del fin de partida
 if(w.id!==myId)return `GANÓ ${w.name}`;
 if(gameMode==='ctf'&&(w.caps|0)>=capLimit)return `¡CAPTURASTE ${capLimit} BANDERA${capLimit>1?'S':''}!`;
 if(gameMode==='lms'&&playersLeft()<=1)return '¡ÚLTIMO EN PIE!';
 return '¡GANASTE!';
}
