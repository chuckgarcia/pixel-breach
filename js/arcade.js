'use strict';
// Pixel Breach — Modo Arcade: misiones para un jugador contra el bando de la calavera.
// Cada nivel tiene una misión; al cumplirla se abre la extracción. Puntos, combos, 3 vidas, vida extra y avance guardado.
let ARC=null; // partida de Arcade en curso (null fuera del modo)
const ARC_MULT={1:.5,2:.75,3:1,4:1.5}; // la dificultad multiplica los puntos
const ARC_FIRST_LIFE=10000,ARC_NEXT_LIFE=25000;
// ---------- AVANCE GUARDADO (en este navegador) ----------
const arcSave={open:1,stars:[]};
try{const j=JSON.parse(localStorage.getItem('pb_arc')||'null');if(j&&typeof j==='object'){
 arcSave.open=Math.max(1,Math.min(ARC_LEVELS.length,j.open|0));arcSave.stars=Array.isArray(j.stars)?j.stars.slice(0,ARC_TOTAL).map(n=>Math.max(0,Math.min(3,n|0))):[];}}catch(e){}
function arcStore(){try{localStorage.setItem('pb_arc',JSON.stringify(arcSave));}catch(e){}}
let arcSel=Math.min(arcSave.open,ARC_LEVELS.length)-1; // nivel elegido en el menú
const arcStars=i=>arcSave.stars[i]|0;
function arcLevelLabel(i){const L=ARC_LEVELS[i],s=arcStars(i);return `${String(i+1).padStart(2,'0')} · ${L.name} ${'★'.repeat(s)}${'☆'.repeat(3-s)}`;}

// ---------- INICIO Y CARGA DE NIVEL ----------
function startArcade(i){
 i=Math.max(0,Math.min(arcSave.open-1,ARC_LEVELS.length-1,i|0));
 ARC={lv:i,score:0,lives:3,nextLife:ARC_FIRST_LIFE,cont:0,inv:null,lostHere:false};
 arcLoad();
}
function arcEnemy(k,id){
 const D=ENEMY[k],base=PERS.find(p=>p.key===D.style)||PERS[0];
 const p=Object.assign({},base,{react:base.react*(D.react||1),speed:base.speed*(D.speed||1)});
 const e=makeEnt(false,p,id,D.n);
 Object.assign(e,{color:VCOL,skin:D.skin,enemy:true,etype:k,maxHp:D.hp,hp:D.hp,weapon:D.w,caps:0,lives:0,out:false,tp:0,
  inv:{pistol:Infinity,smg:D.w==='smg'?Infinity:0,shotgun:D.w==='shotgun'?Infinity:0,rifle:D.w==='rifle'?Infinity:0,frag:0,flash:0}});
 return e;
}
function arcPlace(e,x,y){placeAt(e,[x,y]);e.home=[x,y];e.invulnT=0;e.alive=true;}
function arcLoad(){
 const L=ARC_LEVELS[ARC.lv];
 gameMode='arcade';flag=null;goalSign=null;
 setTheme(L.theme);
 grid=new Uint8Array(COLS*ROWS);crateHP=new Uint8Array(COLS*ROWS);vis=new Uint8Array(COLS*ROWS).fill(1);
 bullets=[];nades=[];pickups=[];parts=[];fx=[];feed=[];heard=[];toast=null;netEvents=[];gridVer++;
 const P=makeEnt(true,null,0,displayName());P.color=playerColor==='#9f1239'?'#f1f5f9':playerColor; /* VINO se confunde con el uniforme enemigo */
 P.skin=playerSkin;P.tp=0;P.caps=0;P.lives=0;P.out=false;P.st={shots:0,hits:0,kw:{},nades:0,picks:0,best:0};
 ents=[P];myId=0;
 Object.assign(ARC,{t:0,killPts:0,kills:0,combo:0,comboT:0,bestCombo:0,startScore:ARC.score,exitOpen:false,exit:null,bombs:[],spawns:[],
  waves:(L.waves||[]).slice(),waveI:0,waveT:2,hostage:null,freed:false,trail:[],bombT:L.limit||0,cardT:3,deadT:0,downMsg:'',result:null,tally:null,waitT:0});
 L.map.forEach((row,y)=>[...row].forEach((c,x)=>{
  const i=idx(x,y);grid[i]=c==='#'?WALL:c==='+'?CRATE:c==='~'?LAVA:FLOOR;if(c==='+')crateHP[i]=3;
  if(c==='P')placeAt(P,[x,y]);
  else if(c==='E')ARC.exit=[x,y];
  else if(c==='W')ARC.spawns.push([x,y]);
  else if(c==='B')ARC.bombs.push({x,y,prog:0,done:false});
  else if(c==='H'){const h=makeEnt(false,{key:'rehen',name:'REHÉN',color:'#e2e8f0',react:1,dodge:0,speed:PLAYER_SPEED},ents.length,'REHÉN');
   Object.assign(h,{hostage:true,color:'#e2e8f0',skin:'recruitM',speed:PLAYER_SPEED*1.08,caps:0,lives:0,out:false,tp:0});arcPlace(h,x,y);ents.push(h);ARC.hostage=h;}
  else if(ENEMY[c]){const e=arcEnemy(c,ents.length);arcPlace(e,x,y);ents.push(e);}
 }));
 // armas: pasan de un nivel al siguiente; al perder una vida vuelves con pistola y 1 granada
 resetInv(P);if(ARC.inv){P.inv=Object.assign({},ARC.inv,{pistol:Infinity});P.weapon=ARC.weapon&&P.inv[ARC.weapon]>0?ARC.weapon:'pistol';}
 P.invulnT=1.5;P.dir=RIGHT;
 matchTime=Infinity;timeLeft=Infinity;fragLimit=Infinity;pickupT=Infinity;firstBlood=true;announce=null;
 state='play';paused=false;shake=0;flashA=0;winner=null;
 tut=null;if(ARC.lv===0)tutStart();
}
const arcPlayer=()=>ents[0];
const arcAlive=()=>ents.filter(e=>e.enemy&&e.alive);
function arcAddScore(n){
 n=Math.round(n);ARC.score+=n;
 while(ARC.score>=ARC.nextLife){ARC.lives++;ARC.nextLife+=ARC_NEXT_LIFE;announce={text:'¡VIDA EXTRA!',c:'#4ade80',t:1.9};sfx('win');}
}

// ---------- REGLAS QUE SE LLAMAN DESDE EL RESTO DEL JUEGO ----------
function arcOnKill(e,src){ // antes de que el soldado quede fuera
 if(e.enemy){
  e.out=true;ARC.kills++;
  if(src&&src.id===0){ // tus bajas: puntos por tipo × combo × dificultad
   ARC.combo=ARC.comboT>0?Math.min(4,ARC.combo+1):1;ARC.comboT=2;ARC.bestCombo=Math.max(ARC.bestCombo,ARC.combo);
   const pts=ENEMY[e.etype].pts*ARC.combo*ARC_MULT[diff];ARC.killPts+=Math.round(pts);arcAddScore(pts);
   fx.push({kind:'pts',px:e.x,py:e.y-20,t:.9,max:.9,s:'+'+Math.round(pts)});
   if(ARC.combo>=2){announce={text:'COMBO ×'+ARC.combo,c:'#facc15',t:1.4};sfx('streak');}
  }
 }else if(e.isPlayer){e.out=true;arcDown('¡CAÍSTE!');}
 else if(e.hostage){e.out=true;arcDown('¡EL REHÉN CAYÓ!');}
}
function arcDown(msg){ // se pierde una vida; el nivel se reinicia en unos segundos
 if(ARC.deadT>0)return;
 ARC.lives--;ARC.lostHere=true;ARC.deadT=2.4;ARC.downMsg=msg;sfx('die');
}
function arcMissionDone(){ // la misión está cumplida: se abre la extracción
 if(ARC.exitOpen)return;ARC.exitOpen=true;announce={text:'¡EXTRACCIÓN ABIERTA!',c:'#facc15',t:2};sfx('go');
}
// ---------- CICLO ----------
// Devuelve true mientras el juego deba estar detenido (tarjeta de misión).
function arcGate(dt){
 if(ARC.cardT>0){ARC.cardT-=dt;if(ARC.cardT<2.4&&(keys.Space||keys.Enter||keys.KeyJ))ARC.cardT=0;tickFx(dt);return true;}
 return false;
}
function arcTick(dt){
 const L=ARC_LEVELS[ARC.lv],P=arcPlayer();
 if(ARC.deadT>0){ARC.deadT-=dt;if(ARC.deadT<=0){if(ARC.lives>0){ARC.score=ARC.startScore;ARC.inv=null;arcLoad();ARC.lostHere=true;}else arcGameOver();}return;}
 ARC.t+=dt;if(ARC.comboT>0)ARC.comboT-=dt;
 // rastro de tus pasos (el rehén lo sigue)
 if(P.alive){const k=[wx(Math.floor(P.x/T)),Math.floor(P.y/T)],l=ARC.trail[ARC.trail.length-1];if(!l||l[0]!==k[0]||l[1]!==k[1]){ARC.trail.push(k);if(ARC.trail.length>40)ARC.trail.shift();}}
 if(L.goal==='kill'){if(!arcAlive().length)arcMissionDone();}
 else if(L.goal==='waves'){
  if(!arcAlive().length){
   if(ARC.waveI<ARC.waves.length){ARC.waveT-=dt;if(ARC.waveT<=0)arcWave();}
   else arcMissionDone();
  }
 }else if(L.goal==='bombs'&&!ARC.exitOpen){
  ARC.bombT-=dt;
  for(const b of ARC.bombs){if(b.done)continue;
   if(P.alive&&wx(Math.floor(P.x/T))===b.x&&Math.floor(P.y/T)===b.y){b.prog+=dt;if(b.prog>=2){b.done=true;sfx('pick');const n=ARC.bombs.filter(o=>o.done).length;
    showToast(`BOMBA DESACTIVADA ${n}/${ARC.bombs.length}`,'#4ade80');}}}
  if(ARC.bombs.every(b=>b.done))arcMissionDone();
  else if(ARC.bombT<=0){for(const b of ARC.bombs)if(!b.done){fx.push({kind:'boom',x:b.x,y:b.y,t:.6,max:.6});sparksLocal(b.x*T+16,b.y*T+16,'#f97316',20,180);}
   sfx('boom');shake=12;ARC.bombT=0;if(P.alive){P.invulnT=0;P.hp=0;kill(P,null,'frag');}ARC.downMsg='¡LAS BOMBAS EXPLOTARON!';}
 }
 // llegar a la extracción
 if(ARC.exitOpen&&P.alive&&ARC.exit&&wx(Math.floor(P.x/T))===ARC.exit[0]&&Math.floor(P.y/T)===ARC.exit[1]){
  const h=ARC.hostage;
  if(h&&(!h.alive||Math.abs(h.tx-ARC.exit[0])+Math.abs(h.ty-ARC.exit[1])>3)){ARC.waitT-=dt;if(ARC.waitT<=0){showToast('ESPERA AL REHÉN','#facc15');ARC.waitT=2;}}
  else arcComplete();
 }
}
function arcWave(){
 const w=ARC.waves[ARC.waveI],S=ARC.spawns;ARC.waveI++;ARC.waveT=2.5;
 [...w].forEach((c,i)=>{const s=S[(i+ARC.waveI)%S.length],e=arcEnemy(c,ents.length);
  const f=nearestFloor(s[0],s[1])||s;arcPlace(e,f[0],f[1]);e.invulnT=.8;ents.push(e);reveal(e.ai,arcPlayer(),false);});
 announce={text:`OLEADA ${ARC.waveI}/${ARC.waves.length}`,c:'#f87171',t:1.8};sfx('streak');
}
// rehén: se libera al tocarlo y luego camina dos casillas detrás de ti
function updHostage(h,dt){
 const P=arcPlayer();
 if(!ARC.freed){
  if(P.alive&&Math.abs(P.x-h.x)<T*1.3&&Math.abs(P.y-h.y)<T*1.3){ARC.freed=true;showToast('¡REHÉN LIBERADO! TE SIGUE','#4ade80');sfx('pick');arcMissionDone();}
  return;
 }
 const tr=ARC.trail,goal=tr.length>=3?tr[tr.length-3]:null;
 if(!h.moving){if(!goal||(goal[0]===h.tx&&goal[1]===h.ty))return;const s=nextStep(h,goal);stepMove(h,s,dt,false);}
 else stepMove(h,null,dt,false);
}
function arcComplete(){
 const L=ARC_LEVELS[ARC.lv],m=ARC_MULT[diff],P=arcPlayer();
 const time=Math.max(0,Math.round(L.par-ARC.t))*100*m,mission=1000*m,clean=ARC.lostHere?0:1500*m;
 const stars=1+(ARC.t<=L.par?1:0)+(ARC.lostHere?0:1);
 arcAddScore(time+mission+clean);
 ARC.tally={kills:ARC.killPts,n:ARC.kills,combo:ARC.bestCombo,t:ARC.t,par:L.par,time:Math.round(time),mission:Math.round(mission),clean:Math.round(clean),stars};
 arcSave.stars[ARC.lv]=Math.max(arcStars(ARC.lv),stars);arcSave.open=Math.max(arcSave.open,Math.min(ARC_LEVELS.length,ARC.lv+2));arcStore();
 ARC.inv=Object.assign({},P.inv);ARC.weapon=P.weapon;
 ARC.result='win';state='over';sfx('win');
}
function arcGameOver(){ARC.result='lose';state='over';sfx('die');}
const arcHasNext=()=>ARC&&ARC.lv+1<ARC_LEVELS.length;
function arcAgain(){ // botón principal del fin: siguiente nivel o continuar
 if(!ARC)return;
 if(ARC.result==='win'){if(!arcHasNext())return;ARC.lv++;ARC.lostHere=false;arcSel=ARC.lv;arcLoad();}
 else if(ARC.result==='lose'){ARC.lives=3;ARC.score=0;ARC.nextLife=ARC_FIRST_LIFE;ARC.cont++;ARC.inv=null;ARC.lostHere=false;arcLoad();}
}

// ---------- DIBUJO ----------
const fmtPts=n=>String(Math.max(0,Math.round(n))).padStart(6,'0');
const fmtT=s=>{s=Math.max(0,Math.ceil(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
function arcObjective(){
 const L=ARC_LEVELS[ARC.lv];
 if(ARC.exitOpen)return ['EXTRACCIÓN ▸','#facc15'];
 if(L.goal==='kill'){const n=ents.filter(e=>e.enemy).length;return [`ENEMIGOS ${n-arcAlive().length}/${n}`,'#f87171'];}
 if(L.goal==='waves')return [`OLEADA ${Math.max(1,ARC.waveI)}/${ARC.waves.length}`,'#f87171'];
 if(L.goal==='rescue')return ['BUSCA AL REHÉN','#e2e8f0'];
 if(L.goal==='bombs')return [`BOMBAS ${ARC.bombs.filter(b=>b.done).length}/${ARC.bombs.length}`,ARC.bombT<20?'#f87171':'#facc15']; // la cuenta va en la etiqueta de arriba
 return ['',''];
}
function arcHud(){ // derecha del marcador: puntos y misión
 txt(fmtPts(ARC.score),W-10,14,15,'#e2e8f0','right');
 const [o,c]=arcObjective();txt(o,W-10,32,11,c,'right');
}
function drawArcMap(){ // extracción, bombas y la etiqueta del rehén (dentro del mapa)
 if(ARC.exit){const [ex,ey]=ARC.exit,px=ex*T,py=ey*T,on=ARC.exitOpen,blink=on&&Math.floor(clock*4)%2;
  for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#0b0d12':on?(blink?'#fde047':'#facc15'):'#4b5563';ctx.fillRect(px+2+i*7,py+2,7,T-4);}
  ctx.strokeStyle=on?'#facc15':'#4b5563';ctx.lineWidth=2;ctx.strokeRect(px+2,py+2,T-4,T-4);
  if(on){ctx.strokeStyle=`rgba(250,204,21,${.3+.3*Math.sin(clock*6)})`;ctx.strokeRect(px-2,py-2,T+4,T+4);}}
 for(const b of ARC.bombs){const x=b.x*T+16,y=b.y*T+16;if(!canSee(x,y))continue;
  ctx.fillStyle='#0b0e14';ctx.fillRect(x-11,y-8,22,17);ctx.fillStyle='#111827';ctx.fillRect(x-10,y-7,20,15);
  ctx.fillStyle=b.done?'#4ade80':(Math.floor(clock*(ARC.bombT<20?8:3))%2?'#ef4444':'#7f1d1d');ctx.fillRect(x-7,y-4,14,5);
  ctx.fillStyle='#facc15';ctx.fillRect(x-1,y-13,2,6);
  if(b.prog>0&&!b.done){ctx.strokeStyle='#4ade80';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,19,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,b.prog/2));ctx.stroke();}
  txt(b.done?'✓':fmtT(ARC.bombT),x,y-19,9,b.done?'#4ade80':'#f87171','center',false);}
 const h=ARC.hostage;if(h&&h.alive&&canSee(h.x,h.y))txt(ARC.freed?'REHÉN':'¡AYUDA!',h.x,h.y-38,9,ARC.freed?'#e2e8f0':'#facc15','center');
 const P=arcPlayer();
 for(const f of fx)if(f.kind==='pts'){ctx.globalAlpha=Math.min(1,f.t/f.max*1.5);txt(f.s,f.px,f.py-(1-f.t/f.max)*16,11,'#facc15','center');ctx.globalAlpha=1;}
}
function drawArcHud(){ // etiqueta arriba: nivel y vidas; tarjeta de misión; caída
 if(state!=='play')return;
 const bombs=ARC_LEVELS[ARC.lv].goal==='bombs'&&!ARC.exitOpen,t=`NIVEL ${ARC.lv+1}`+(bombs?` · ${fmtT(ARC.bombT)}`:'');ctx.font=`bold ${fsz(11)}px "Courier New",monospace`;const tw=ctx.measureText(t).width,hw=Math.min(5,ARC.lives)*13,w=tw+hw+24,x=W/2-w/2,m=arcPlayer();
 const under=m&&m.alive&&m.y<64&&Math.abs(m.x-W/2)<w/2+20;ctx.globalAlpha=under?.3:1;
 ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x,HUD+5,w,20);txt(t,x+8,HUD+15,11,bombs&&ARC.bombT<20?'#f87171':'#e2e8f0','left',false);
 drawHearts(x+w-6,HUD+10,Math.min(5,ARC.lives),Math.min(5,ARC.lives),1.5);ctx.globalAlpha=1;
 if(ARC.deadT>0){overlay(Math.min(.55,(2.4-ARC.deadT)*.6));txt(ARC.downMsg,W/2,HUD+H/2-14,26,'#ef4444','center');
  txt(ARC.lives>0?`Te quedan ${ARC.lives} ${ARC.lives===1?'vida':'vidas'} · el nivel se reinicia`:'Sin vidas',W/2,HUD+H/2+18,13,'#e2e8f0','center');}
}
function drawArcCard(){
 const L=ARC_LEVELS[ARC.lv];overlay(.88);
 txt(`NIVEL ${ARC.lv+1}`,W/2,HUD+92,32,'#facc15','center');txt(L.name,W/2,HUD+136,24,'#e2e8f0','center');txt(THEMES[L.theme].name,W/2,HUD+164,12,'#64748b','center');
 ctx.strokeStyle='#facc15';ctx.lineWidth=2;ctx.strokeRect(96,HUD+186,W-192,78);
 txt(L.text[0],W/2,HUD+212,14,'#facc15','center');txt(L.text[1],W/2,HUD+238,14,'#facc15','center');
 if(L.nw){const D=ENEMY[L.nw];drawSkin(ctx,D.skin,VCOL,'down',0,false,D.w,W/2-130,HUD+340,2);txt('NUEVO: '+D.n,W/2-100,HUD+316,12,'#cbd5e1','left');
  txt({r:'pistola · poca vida',a:'subfusil · va directo por ti',s:'escopeta · espera en las esquinas'}[L.nw]||'',W/2-100,HUD+334,11,'#64748b','left',false);}
 txt(`VIDAS ${ARC.lives}   ·   ${fmtPts(ARC.score)}`,W/2,HUD+390,14,'#f87171','center');
 if(ARC.cardT<2.4&&Math.floor(clock*2)%2)txt(isTouch?'Toca FUEGO para empezar':'ESPACIO para empezar',W/2,HUD+430,11,'#94a3b8','center',false);
}
function drawArcOver(){
 overlay(.86);const L=ARC_LEVELS[ARC.lv];
 if(ARC.result==='win'){
  const T_=ARC.tally;txt(`¡NIVEL ${ARC.lv+1} COMPLETO!`,W/2,92,26,'#facc15','center');
  ctx.font=`bold ${fsz(30)}px "Courier New",monospace`;const sw=ctx.measureText('★★★').width;let sx=W/2-sw/2;
  for(let i=0;i<3;i++){txt('★',sx,136,30,i<T_.stars?'#facc15':'#475569','left');sx+=sw/3;}
  const rows=[[`BAJAS ${T_.n}`,T_.kills],[`MEJOR COMBO ×${Math.max(1,T_.combo)}`,null],[`TIEMPO ${fmtT(T_.t)} (meta ${fmtT(T_.par)})`,T_.time],['MISIÓN CUMPLIDA',T_.mission],['SIN PERDER VIDA',T_.clean]];
  rows.forEach(([a,b],i)=>{const y=180+i*26;txt(a,150,y,13,'#e2e8f0');if(b!==null)txt(b?b.toLocaleString('en-US'):'—',W-150,y,13,b?'#4ade80':'#64748b','right');});
  ctx.fillStyle='#334155';ctx.fillRect(150,312,W-300,2);txt('TOTAL',150,334,16,'#e2e8f0');txt(ARC.score.toLocaleString('en-US'),W-150,334,16,'#facc15','right');
  if(!arcHasNext())txt(ARC_LEVELS.length<ARC_TOTAL?`¡Superaste los ${ARC_LEVELS.length} niveles disponibles! Los niveles ${ARC_LEVELS.length+1} a ${ARC_TOTAL} llegan pronto.`:'¡MISIÓN CUMPLIDA!',W/2,374,11,'#4ade80','center');
  else if(!isTouch)txt('ENTER: siguiente nivel   ·   ESC: menú',W/2,374,11,'#94a3b8','center');
 }else{
  txt('GAME OVER',W/2,120,34,'#ef4444','center');txt(`NIVEL ${ARC.lv+1} · ${L.name}`,W/2,170,15,'#e2e8f0','center');
  txt(`PUNTOS ${ARC.score.toLocaleString('en-US')}`,W/2,206,18,'#facc15','center');
  txt('CONTINUAR: repites este nivel con 3 vidas,',W/2,262,12,'#cbd5e1','center');txt('pero tus puntos vuelven a 0.',W/2,282,12,'#cbd5e1','center');
  if(!isTouch)txt('ENTER: continuar   ·   ESC: menú',W/2,330,11,'#94a3b8','center');
 }
}
function drawArcPause(){txt(`NIVEL ${ARC.lv+1} · ${ARC_LEVELS[ARC.lv].name}`,W/2,176,16,'#e2e8f0','center');
 const [o,c]=arcObjective();txt(o,W/2,206,13,c,'center');txt(`PUNTOS ${ARC.score.toLocaleString('en-US')}   ·   VIDAS ${ARC.lives}`,W/2,236,13,'#cbd5e1','center');}
