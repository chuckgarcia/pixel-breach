'use strict';
// Pixel Breach — Modo Arcade: misiones para un jugador contra el bando de la calavera.
// Cada nivel tiene una misión; al cumplirla se abre la extracción. Puntos, combos, 3 vidas, vida extra y avance guardado.
let ARC=null; // partida de Arcade en curso (null fuera del modo)
const ARC_MULT={1:.5,2:.75,3:1,4:1.5}; // la dificultad multiplica los puntos
const ARC_FIRST_LIFE=10000,ARC_NEXT_LIFE=25000;
// Botiquines según la dificultad: cada cuántos segundos aparece uno, cuántos puede haber a la vez y
// la probabilidad de que un enemigo suelte uno al caer.
const ARC_MED={1:{every:15,max:3,drop:.3},2:{every:22,max:2,drop:.2},3:{every:35,max:1,drop:.1},4:{every:55,max:1,drop:.05}};
// Presión por nivel: los enemigos reaccionan más rápido, se avisan desde más lejos y se reparten para flanquearte.
const arcPress=lv=>({react:Math.max(.72,1.1-.08*lv),alert:Math.round(4+lv*1.5),flank:lv<1?0:3+lv});
const arcMed=()=>ARC_MED[diff]||ARC_MED[3];
const ARC_CONT=10; // CONTINUE? 9… 8… … 0
const DIFF_COL={1:'#4ade80',2:'#a3e635',3:'#facc15',4:'#f87171'};
const arcDiffLabel=()=>`DIFICULTAD ${DIFF[diff].name} · PUNTOS ×${ARC_MULT[diff]}`;
// ---------- AVANCE GUARDADO (en este navegador) ----------
const arcSave={open:1,stars:[],best:[],recent:[],ini:'',cmd:false,gold:false};
try{const j=JSON.parse(localStorage.getItem('pb_arc')||'null');if(j&&typeof j==='object'){
 arcSave.open=Math.max(1,Math.min(ARC_LEVELS.length,j.open|0));arcSave.cmd=!!j.cmd;arcSave.gold=!!j.gold;
 arcSave.best=Array.isArray(j.best)?j.best.filter(r=>r&&typeof r.i==='string').slice(0,10).map(r=>Object.assign({i:r.i.replace(/[^A-ZÑ0-9]/g,'').slice(0,3)||'???',s:Math.max(0,r.s|0),lv:Math.max(1,Math.min(ARC_TOTAL,r.lv|0)),d:DIFF[r.d]?r.d:3,t:+r.t||0},r.c===undefined?{}:{c:Math.max(0,r.c|0)})):[]; /* los récords viejos no tienen continues */arcSave.recent=Array.isArray(j.recent)?j.recent.filter(r=>r&&typeof r.i==='string').slice(0,5).map(r=>({i:r.i.replace(/[^A-ZÑ0-9]/g,'').slice(0,3)||'???',s:Math.max(0,r.s|0),lv:Math.max(1,Math.min(ARC_TOTAL,r.lv|0)),d:DIFF[r.d]?r.d:3,c:Math.max(0,r.c|0),t:+r.t||0,rank:r.rank|0})):[];arcSave.ini=typeof j.ini==='string'?j.ini.slice(0,3):'';arcSave.stars=Array.isArray(j.stars)?j.stars.slice(0,ARC_TOTAL).map(n=>Math.max(0,Math.min(3,n|0))):[];}}catch(e){}
function arcStore(){try{localStorage.setItem('pb_arc',JSON.stringify(arcSave));}catch(e){}}
let arcSel=Math.min(arcSave.open,ARC_LEVELS.length)-1; // nivel elegido en el menú
const arcStars=i=>arcSave.stars[i]|0;
function arcLevelLabel(i){const L=ARC_LEVELS[i],s=arcStars(i);return `${String(i+1).padStart(2,'0')} · ${L.name} ${'★'.repeat(s)}${'☆'.repeat(3-s)}`;}

// ---------- INICIO Y CARGA DE NIVEL ----------
function startArcade(i){
 i=Math.max(0,Math.min(arcSave.open-1,ARC_LEVELS.length-1,i|0));
 ARC={lv:i,score:0,lives:3,nextLife:ARC_FIRST_LIFE,cont:0,inv:null,lostHere:false,runBest:0,runLv:i+1,end:null};
 arcLoad();
}
function arcEnemy(k,id){
 const D=ENEMY[k],base=PERS.find(p=>p.key===D.style)||PERS[0];
 const p=Object.assign({},base,{react:base.react*(D.react||1)*arcPress(ARC?ARC.lv:0).react,speed:base.speed*(D.speed||1)});
 const e=makeEnt(false,p,id,D.n);
 Object.assign(e,{color:VCOL,skin:D.skin,enemy:true,etype:k,maxHp:D.hp,hp:D.hp,weapon:D.w,caps:0,lives:0,out:false,tp:0,
  inv:{pistol:Infinity,smg:D.w==='smg'?Infinity:0,shotgun:D.w==='shotgun'?Infinity:0,rifle:D.w==='rifle'?Infinity:0,frag:0,flash:0},
  scale:D.scale||1,rad:D.scale?16:11,shield:!!D.shield,armor:!!D.armor,laser:!!D.laser,hold:!!D.hold,crest:!!D.crest,bossK:!!D.boss,lobT:D.lob?D.lob*.6:0});
 return e;
}
function arcPlace(e,x,y){placeAt(e,[x,y]);e.home=[x,y];e.invulnT=0;e.alive=true;}
function arcLoad(){
 const L=ARC_LEVELS[ARC.lv];ARC.runLv=Math.max(ARC.runLv||1,ARC.lv+1);
 gameMode='arcade';flag=null;goalSign=null;
 setTheme(L.theme);
 grid=new Uint8Array(COLS*ROWS);crateHP=new Uint8Array(COLS*ROWS);vis=new Uint8Array(COLS*ROWS).fill(1);
 bullets=[];nades=[];pickups=[];parts=[];fx=[];feed=[];heard=[];toast=null;netEvents=[];gridVer++;
 const P=makeEnt(true,null,0,displayName());P.color=playerColor==='#9f1239'?'#f1f5f9':playerColor; /* VINO se confunde con el uniforme enemigo */
 P.skin=playerSkin;P.tp=0;P.caps=0;P.lives=0;P.out=false;P.st={shots:0,hits:0,kw:{},nades:0,picks:0,best:0};
 ents=[P];myId=0;
 Object.assign(ARC,{t:0,killPts:0,kills:0,combo:0,comboT:0,bestCombo:0,startScore:ARC.score,exitOpen:false,exit:null,bombs:[],spawns:[],
  waves:(L.waves||[]).slice(),waveI:0,waveT:3,hostage:null,freed:false,trail:[],bombT:L.limit||0,cardT:1,cardAge:0,cardArmed:false,deadT:0,downMsg:'',fail:false,result:null,tally:null,waitT:0,contT:0,medT:arcMed().every*.5,
  pows:[],powsN:0,coins:new Set(),coinsGot:0,reds:[],redT:0,item:null,spotted:false,lavaX:0,lavaT:4,boss:null,phase:1,reinfT:0,bombReinf:false,dark:L.dark||0});
 L.map.forEach((row,y)=>[...row].forEach((c,x)=>{
  const i=idx(x,y);grid[i]=c==='#'?WALL:c==='+'?CRATE:c==='~'?LAVA:FLOOR;if(c==='+')crateHP[i]=3;
  if(c==='P')placeAt(P,[x,y]);
  else if(c==='E')ARC.exit=[x,y];
  else if(c==='W')ARC.spawns.push([x,y]);
  else if(c==='B')ARC.bombs.push({x,y,prog:0,done:false});
  else if(c==='X')ARC.pows.push({x,y,freed:false});
  else if(c==='o')ARC.coins.add(idx(x,y));
  else if(c==='R')ARC.reds.push({x,y,got:false});
  else if(c==='$')ARC.item={x,y,taken:false};
  else if(c==='H'){const h=makeEnt(false,{key:'rehen',name:'REHÉN',color:'#e2e8f0',react:1,dodge:0,speed:PLAYER_SPEED},ents.length,'REHÉN');
   Object.assign(h,{hostage:true,color:'#e2e8f0',skin:'recruitM',speed:PLAYER_SPEED*1.08,caps:0,lives:0,out:false,tp:0});arcPlace(h,x,y);ents.push(h);ARC.hostage=h;}
  else if(ENEMY[c]){const e=arcEnemy(c,ents.length);arcPlace(e,x,y);ents.push(e);}
 }));
 ARC.boss=ents.find(e=>e.bossK)||null;if(L.goal==='escape')ARC.exitOpen=true; // en la huida la salida está abierta desde el inicio
 ARC.alertT=0;ARC.flank=arcPress(ARC.lv).flank;ARC.regroup=false;ARC.total=ents.filter(e=>e.enemy).length;
 if(ARC.waves.length){const n=ARC.waves.length-1;ARC.waves[n]+=({3:'r',4:'ra'})[diff]||'';} // la última oleada crece con la dificultad: 4, 5 en NORMAL, 6 en DIFÍCIL
 if(L.goal==='bombs')for(const e of ents.filter(e=>e.enemy)){ // cada enemigo custodia la bomba más cercana
  let best=null,bd=1e9;for(const b of ARC.bombs){const d=Math.abs(b.x-e.tx)+Math.abs(b.y-e.ty);if(d<bd){bd=d;best=b;}}
  if(best)e.home=[best.x,best.y];}
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
 }else if(e.isPlayer){e.out=true;arcDown('¡CAÍSTE!',false);} // reapareces donde caíste
 else if(e.hostage){e.out=true;arcDown('¡EL REHÉN CAYÓ!',true);} // misión fallida: el nivel se reinicia
}
// Se pierde una vida. Si caíste, reapareces en el mismo lugar (como Metal Slug) y el nivel sigue como iba;
// si la misión falló (el rehén cayó, las bombas explotaron), el nivel se reinicia.
function arcDown(msg,fail){
 if(ARC.deadT>0)return;
 ARC.lives--;ARC.lostHere=true;ARC.fail=!!fail;ARC.deadT=fail?2.4:1.6;ARC.downMsg=msg;sfx('die');
}
function arcMissionDone(){ // la misión está cumplida: se abre la extracción
 if(ARC.exitOpen)return;ARC.exitOpen=true;announce={text:'¡EXTRACCIÓN ABIERTA!',c:'#facc15',t:2};sfx('go');
}
// ---------- CICLO ----------
// Devuelve true mientras el juego deba estar detenido (tarjeta de misión).
function arcGate(dt){
 if(ARC.cardT>0){ // la tarjeta espera a que confirmes: ¡LISTO!, ESPACIO, ENTER o FUEGO
  ARC.cardAge+=dt;const k=keys.Space||keys.Enter||keys.NumpadEnter||keys.KeyJ;
  if(!k&&ARC.cardAge>.4)ARC.cardArmed=true; // una tecla que venía presionada (disparo, ENTER del nivel anterior) no cuenta
  else if(k&&ARC.cardArmed)arcReady();
  tickFx(dt);return true;}
 return false;
}
function arcReady(){if(ARC&&ARC.cardT>0){ARC.cardT=0;sfx('go');}}
function arcTick(dt){
 const L=ARC_LEVELS[ARC.lv],P=arcPlayer();
 if(ARC.deadT>0){ARC.deadT-=dt;if(ARC.deadT<=0){
   if(ARC.lives<=0)arcGameOver(); // CONTINUE? 9…
   else if(ARC.fail){ARC.score=ARC.startScore;ARC.inv=null;arcLoad();ARC.lostHere=true;}
   else arcRespawn();}
  if(ARC.fail)return;} // al caer, el resto del nivel sigue moviéndose mientras reapareces
 // botiquines periódicos según la dificultad
 ARC.medT-=dt;if(ARC.medT<=0){ARC.medT=arcMed().every;if(pickups.filter(p=>p.type==='medkit').length<arcMed().max)arcSpawnMed();}
 if(ARC.deadT>0)return;
 ARC.t+=dt;if(ARC.comboT>0)ARC.comboT-=dt;
 // se avisan entre ellos: quien te ve alerta a los compañeros cercanos (más lejos en niveles altos)
 ARC.alertT-=dt;if(ARC.alertT<=0&&P.alive){ARC.alertT=.5;const R=arcPress(ARC.lv).alert,E=arcAlive(),see=E.filter(e=>e.ai.known[0]&&e.ai.known[0].seen);
  for(const e of E)if(!e.ai.known[0]&&see.some(s=>Math.abs(s.tx-e.tx)+Math.abs(s.ty-e.ty)<=R))reveal(e.ai,P,false);}
 // rastro de tus pasos (el rehén lo sigue)
 if(P.alive){const k=[wx(Math.floor(P.x/T)),Math.floor(P.y/T)],l=ARC.trail[ARC.trail.length-1];if(!l||l[0]!==k[0]||l[1]!==k[1]){ARC.trail.push(k);if(ARC.trail.length>40)ARC.trail.shift();}}
 if(L.goal==='kill'){
  const left=arcAlive();
  if(!ARC.regroup&&left.length&&left.length<=ARC.total/2){ // cae la mitad: los que quedan se reagrupan y van por ti
   ARC.regroup=true;for(const e of left){reveal(e.ai,P,false);e.home=null;}announce={text:'¡SE REAGRUPAN!',c:'#f87171',t:1.8};sfx('streak');}
  if(!left.length)arcMissionDone();}
 else if(L.goal==='waves'){
  if(!arcAlive().length){
   if(ARC.waveI<ARC.waves.length){ARC.waveT-=dt;if(ARC.waveT<=0)arcWave();}
   else arcMissionDone();
  }
 }else if(L.goal==='bombs'&&!ARC.exitOpen){
  ARC.bombT-=dt;
  for(const b of ARC.bombs){if(b.done)continue;
   if(P.alive&&wx(Math.floor(P.x/T))===b.x&&Math.floor(P.y/T)===b.y){
    if(!b.alarm){b.alarm=true;for(const e of arcAlive())reveal(e.ai,P,false);showToast('¡ALARMA! TE VIENEN A DETENER','#f87171');sfx('streak');} // desactivar delata tu posición
    b.prog+=dt;if(b.prog>=2){b.done=true;sfx('pick');const n=ARC.bombs.filter(o=>o.done).length;
    showToast(`BOMBA DESACTIVADA ${n}/${ARC.bombs.length}`,'#4ade80');}}}
  if(ARC.bombs.every(b=>b.done))arcMissionDone();
  else if(ARC.bombT<=0){for(const b of ARC.bombs)if(!b.done){fx.push({kind:'boom',x:b.x,y:b.y,t:.6,max:.6});sparksLocal(b.x*T+16,b.y*T+16,'#f97316',20,180);}
   sfx('boom');shake=12;ARC.bombT=0;arcDown('¡LAS BOMBAS EXPLOTARON!',true);if(P.alive){P.invulnT=0;P.hp=0;kill(P,null,'frag');}}
 }
 arcTickExtra(dt,L,P);
 // llegar a la extracción
 if(ARC.exitOpen&&P.alive&&ARC.exit&&wx(Math.floor(P.x/T))===ARC.exit[0]&&Math.floor(P.y/T)===ARC.exit[1]){
  const h=ARC.hostage;
  if(h&&(!h.alive||Math.abs(h.tx-ARC.exit[0])+Math.abs(h.ty-ARC.exit[1])>3)){ARC.waitT-=dt;if(ARC.waitT<=0){showToast('ESPERA AL REHÉN','#facc15');ARC.waitT=2;}}
  else arcComplete();
 }
}
// Cada oleada entra por la puerta más lejana a ti; la última, por todas las puertas a la vez.
function arcWave(){
 const w=ARC.waves[ARC.waveI],P=arcPlayer(),last=ARC.waveI===ARC.waves.length-1;ARC.waveI++;ARC.waveT=5;
 const S=ARC.spawns.slice().sort((a,b)=>(Math.abs(b[0]-P.tx)+Math.abs(b[1]-P.ty))-(Math.abs(a[0]-P.tx)+Math.abs(a[1]-P.ty)));
 [...w].forEach((c,i)=>{const s=last?S[i%S.length]:S[0],e=arcEnemy(c,ents.length);
  const f=freeNear(s[0],s[1],e);arcPlace(e,f[0],f[1]);e.invulnT=.8;ents.push(e);reveal(e.ai,arcPlayer(),false);});
 announce={text:last?`¡ÚLTIMA OLEADA! POR TODAS LAS PUERTAS`:`OLEADA ${ARC.waveI}/${ARC.waves.length}`,c:'#f87171',t:1.8};sfx('streak');
}
// rehén: se libera al tocarlo y luego camina dos casillas detrás de ti
function updHostage(h,dt){
 const P=arcPlayer();
 if(!ARC.freed){
  if(P.alive&&Math.abs(P.x-h.x)<T*1.3&&Math.abs(P.y-h.y)<T*1.3){ARC.freed=true;showToast('¡REHÉN LIBERADO! TE SIGUE','#4ade80');sfx('pick');arcMissionDone();arcRescueAlarm();
   pickups.push({tx:h.tx,ty:h.ty,type:'medkit',amt:PICK.medkit.amt,t:0});} // como los prisioneros de Metal Slug: te da algo
  return;
 }
 const tr=ARC.trail,goal=tr.length>=3?tr[tr.length-3]:null;
 if(!h.moving){if(!goal||(goal[0]===h.tx&&goal[1]===h.ty))return;const s=nextStep(h,goal);stepMove(h,s,dt,false);}
 else stepMove(h,null,dt,false);
}
// Al liberar al rehén: suena la alarma, la mitad de los enemigos (los más cercanos a la extracción) se queda
// emboscada ahí y llegan refuerzos por el lado de la extracción para cortarte el paso.
function arcRescueAlarm(){
 const P=arcPlayer(),X=ARC.exit,E=arcAlive().sort((a,b)=>(Math.abs(a.tx-X[0])+Math.abs(a.ty-X[1]))-(Math.abs(b.tx-X[0])+Math.abs(b.ty-X[1])));
 const ambush=E.slice(0,Math.ceil(E.length/2));
 for(const e of E){if(ambush.includes(e)){e.home=X.slice();e.ai.known={};e.ai.patrol=null;}else reveal(e.ai,P,false);}
 const extra=ARC.lv>=2?['a','r']:['r'];
 for(const k of extra){
  let s=null;for(let t=0;t<80&&!s;t++){const x=ri(1,COLS-2),y=ri(1,ROWS-2),dx=Math.abs(x-X[0])+Math.abs(y-X[1]),dp=Math.abs(x-P.tx)+Math.abs(y-P.ty);
   if(walkable(x,y)&&dx>=2&&dx<=6&&dp>=7&&!tileTaken(null,x,y))s=[x,y];}
  if(!s){ // el azar no encontró lugar: la casilla libre más cercana a la extracción que quede lejos de ti
   let best=null;for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){const dx=Math.abs(x-X[0])+Math.abs(y-X[1]),dp=Math.abs(x-P.tx)+Math.abs(y-P.ty);
    if(!walkable(x,y)||tileTaken(null,x,y)||dx<1||dp<4)continue;const sc=Math.abs(dx-3)*2+Math.max(0,7-dp);if(!best||sc<best[0])best=[sc,x,y];}
   if(best)s=[best[1],best[2]];}
  if(!s)continue;const e=arcEnemy(k,ents.length);arcPlace(e,s[0],s[1]);e.home=X.slice();e.invulnT=.8;ents.push(e);
 }
 announce={text:'¡ALARMA! TE ESPERAN EN LA EXTRACCIÓN',c:'#f87171',t:2.2};sfx('streak');
}
function arcComplete(){
 const L=ARC_LEVELS[ARC.lv],m=ARC_MULT[diff],P=arcPlayer();
 const time=Math.max(0,Math.round(L.par-ARC.t))*100*m,mission=1000*m,clean=ARC.lostHere?0:1500*m;
 const pows=ARC.powsN*1000*m,stealth=L.goal==='intel'&&!ARC.spotted?3000*m:0;
 const stars=1+(ARC.t<=L.par?1:0)+(ARC.lostHere?0:1);
 arcAddScore(time+mission+clean+pows+stealth);
 ARC.tally={kills:ARC.killPts,n:ARC.kills,combo:ARC.bestCombo,t:ARC.t,par:L.par,time:Math.round(time),mission:Math.round(mission),clean:Math.round(clean),
  powsN:ARC.powsN,pows:Math.round(pows),stealth:L.goal==='intel'?Math.round(stealth):null,stars};
 arcSave.stars[ARC.lv]=Math.max(arcStars(ARC.lv),stars);arcSave.open=Math.max(arcSave.open,Math.min(ARC_LEVELS.length,ARC.lv+2));
 ARC.rewards=[]; // premios: aspecto COMANDANTE al terminar el nivel 10, color DORADO con 30 estrellas
 if(ARC.lv===ARC_TOTAL-1&&!arcSave.cmd){arcSave.cmd=true;ARC.rewards.push('ASPECTO COMANDANTE');}
 if(!arcSave.gold&&arcStarsTotal()>=30){arcSave.gold=true;ARC.rewards.push('COLOR DORADO');}
 arcStore();
 ARC.inv=Object.assign({},P.inv);ARC.weapon=P.weapon;
 ARC.result='win';state='over';sfx('win');
}
const arcStarsTotal=()=>arcSave.stars.reduce((a,b)=>a+(b|0),0);
function arcGameOver(){ARC.result='cont';ARC.contT=ARC_CONT-.01;state='over';sfx('die');} // primero CONTINUE? con cuenta regresiva
function arcContTick(dt){ // corre en la pantalla de CONTINUE?; al llegar a 0 es GAME OVER
 const before=Math.floor(ARC.contT);ARC.contT-=dt;
 if(ARC.contT<0){arcEndRun('lose');}else if(Math.floor(ARC.contT)!==before)sfx('tick');
}
function arcRespawn(){ // reapareces donde caíste, con pistola, 1 granada y 2.5 s de invencibilidad
 const P=arcPlayer(),s=freeNear(wx(Math.floor(P.x/T)),Math.floor(P.y/T),P);
 placeAt(P,s);resetInv(P);Object.assign(P,{alive:true,out:false,hp:100,invulnT:2.5,hurtT:0,blindT:0});
 showToast('¡DE VUELTA!','#4ade80');
}
function arcSpawnMed(){ // botiquín en una casilla libre, lejos de ti y de la extracción
 const P=arcPlayer();
 for(let k=0;k<60;k++){const x=ri(1,COLS-2),y=ri(1,ROWS-2),d=Math.abs(x-P.tx)+Math.abs(y-P.ty);
  if(!walkable(x,y)||d<4||d>14||tileTaken(null,x,y)||pickups.some(p=>p.tx===x&&p.ty===y)||(ARC.exit&&ARC.exit[0]===x&&ARC.exit[1]===y))continue;
  pickups.push({tx:x,ty:y,type:'medkit',amt:PICK.medkit.amt,t:0});return true;}
 return false;
}
const arcHasNext=()=>ARC&&ARC.lv+1<ARC_LEVELS.length;
function arcAgain(){ // botón principal del fin: siguiente nivel o continuar (tras el GAME OVER ya no hay reintento)
 if(!ARC)return;if(ARC.end){arcEndKey('Enter');return;}
 if(ARC.result==='win'){if(!arcHasNext()){arcEndRun('final');return;}ARC.lv++;ARC.lostHere=false;arcSel=ARC.lv;arcLoad();}
 else if(ARC.result==='cont'){ // CONTINUAR: 3 vidas y puntos en 0; sigues donde ibas (o se reinicia si la misión falló)
  arcBank(); // lo que llevabas cuenta para el récord de la partida
  Object.assign(ARC,{lives:3,score:0,startScore:0,nextLife:ARC_FIRST_LIFE,result:null,powsN:0});ARC.cont++; // al continuar se pierden los prisioneros del nivel
  if(ARC.fail){ARC.inv=null;arcLoad();ARC.lostHere=true;}else{state='play';arcRespawn();}}
}

// ---------- DIBUJO ----------
const fmtPts=n=>String(Math.max(0,Math.round(n))).padStart(6,'0');
const fmtT=s=>{s=Math.max(0,Math.ceil(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
function arcObjective(){
 const L=ARC_LEVELS[ARC.lv];
 if(ARC.exitOpen)return [L.goal==='escape'?'¡CORRE! ▸':'EXTRACCIÓN ▸',L.goal==='escape'?'#fb923c':'#facc15'];
 if(L.goal==='kill'){const n=ents.filter(e=>e.enemy).length;return [`ENEMIGOS ${n-arcAlive().length}/${n}`,'#f87171'];}
 if(L.goal==='waves')return [`OLEADA ${Math.max(1,ARC.waveI)}/${ARC.waves.length}`,'#f87171'];
 if(L.goal==='rescue')return ['BUSCA AL REHÉN','#e2e8f0'];
 if(L.goal==='bombs')return [`BOMBAS ${ARC.bombs.filter(b=>b.done).length}/${ARC.bombs.length}`,ARC.bombT<20?'#f87171':'#facc15']; // la cuenta va en la etiqueta de arriba
 if(L.goal==='boss')return [ARC.boss&&ARC.boss.etype==='C'?'VENCE AL JEFE':'VENCE AL SARGENTO','#f87171'];
 if(L.goal==='coins')return [`FICHAS ${ARC.coinsGot}/${L.need}`,'#fde68a'];
 if(L.goal==='intel')return [ARC.spotted?'¡TE VIERON!':'BUSCA LOS PLANOS',ARC.spotted?'#f87171':'#93c5fd'];
 if(L.goal==='case')return ['TOMA EL MALETÍN','#facc15'];
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
 drawArcExtras();
 const h=ARC.hostage;if(h&&h.alive&&canSee(h.x,h.y))txt(ARC.freed?'REHÉN':'¡AYUDA!',h.x,h.y-38,9,ARC.freed?'#e2e8f0':'#facc15','center');
 const P=arcPlayer();
 if(state==='play')for(const f of fx)if(f.kind==='pts'){ctx.globalAlpha=Math.min(1,f.t/f.max*1.5);txt(f.s,f.px,f.py-(1-f.t/f.max)*16,11,'#facc15','center');ctx.globalAlpha=1;}
}
function drawArcHud(){ // etiqueta arriba: nivel y vidas; tarjeta de misión; caída
 if(state!=='play')return;
 if(ARC.redT>0){ctx.fillStyle=`rgba(239,68,68,${.07+.05*Math.sin(clock*12)})`;ctx.fillRect(0,HUD,W,H);txt(`ALERTA ROJA ${Math.ceil(ARC.redT)}`,W/2,HUD+38,12,'#fca5a5','center');}
 drawArcBoss();
 const bombs=ARC_LEVELS[ARC.lv].goal==='bombs'&&!ARC.exitOpen,t=`NIVEL ${ARC.lv+1}`+(bombs?` · ${fmtT(ARC.bombT)}`:'');ctx.font=`bold ${fsz(11)}px "Courier New",monospace`;const tw=ctx.measureText(t).width,hw=Math.min(5,ARC.lives)*13,w=tw+hw+24,x=W/2-w/2,m=arcPlayer();
 const under=m&&m.alive&&m.y<64&&Math.abs(m.x-W/2)<w/2+20;ctx.globalAlpha=under?.3:1;
 ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x,HUD+5,w,20);txt(t,x+8,HUD+15,11,bombs&&ARC.bombT<20?'#f87171':'#e2e8f0','left',false);
 drawHearts(x+w-6,HUD+10,Math.min(5,ARC.lives),Math.min(5,ARC.lives),1.5);ctx.globalAlpha=1;
 {const L=ARC_LEVELS[ARC.lv]; // entre oleadas: OLEADA 2 EN 3… 2… 1…
  if(L.goal==='waves'&&ARC.cardT<=0&&ARC.deadT<=0&&ARC.waveI<ARC.waves.length&&!arcAlive().length&&ARC.waveT<=3.5){
   const n=Math.max(1,Math.ceil(ARC.waveT));txt(`OLEADA ${ARC.waveI+1} EN ${n}…`,W/2,HUD+96,22,ARC.waveI+1===ARC.waves.length?'#f87171':'#facc15','center');}}
 if(ARC.deadT>0){overlay(Math.min(ARC.fail?.55:.35,(2.4-ARC.deadT)*.6));txt(ARC.downMsg,W/2,HUD+H/2-14,26,'#ef4444','center');
  txt(ARC.lives>0?`Te quedan ${ARC.lives} ${ARC.lives===1?'vida':'vidas'} · `+(ARC.fail?'el nivel se reinicia':'reapareces aquí'):'Sin vidas',W/2,HUD+H/2+18,13,'#e2e8f0','center');}
}
function drawArcCard(){
 const L=ARC_LEVELS[ARC.lv];overlay(.88);
 txt(`NIVEL ${ARC.lv+1}`,W/2,HUD+92,32,'#facc15','center');txt(L.name,W/2,HUD+136,24,'#e2e8f0','center');txt(THEMES[L.theme].name,W/2,HUD+164,12,'#64748b','center');
 ctx.strokeStyle='#facc15';ctx.lineWidth=2;ctx.strokeRect(96,HUD+186,W-192,78);
 txt(L.text[0],W/2,HUD+212,14,'#facc15','center');txt(L.text[1],W/2,HUD+238,14,'#facc15','center');
 if(L.nw){const D=ENEMY[L.nw];drawSkin(ctx,D.skin,VCOL,'down',0,false,D.w,W/2-130,HUD+318,2);txt('NUEVO: '+D.n,W/2-100,HUD+296,12,'#cbd5e1','left');
  txt({r:'pistola · poca vida',a:'subfusil · va directo por ti',s:'escopeta · espera en las esquinas',t:'rifle · su láser avisa antes del disparo',g:'lanza granadas por encima de los muros',k:'escudo al frente · flanquéalo o usa granada',C:'1.5× más grande · tres fases · rodéalo'}[L.nw]||'',W/2-100,HUD+314,11,'#64748b','left',false);}
 txt(`VIDAS ${ARC.lives}   ·   ${fmtPts(ARC.score)}`,W/2,HUD+350,14,'#f87171','center');
 if(!isTouch)txt('Cuando estés listo: ESPACIO o ENTER',W/2,HUD+376,11,'#94a3b8','center',false);
}
function drawArcOver(){
 if(ARC.end){drawArcEnd();return;}
 overlay(.86);const L=ARC_LEVELS[ARC.lv];
 if(ARC.result==='win'){
  const T_=ARC.tally;txt(`¡NIVEL ${ARC.lv+1} COMPLETO!`,W/2,82,26,'#facc15','center');
  ctx.font=`bold ${fsz(30)}px "Courier New",monospace`;const sw=ctx.measureText('★★★').width;let sx=W/2-sw/2;
  for(let i=0;i<3;i++){txt('★',sx,122,30,i<T_.stars?'#facc15':'#475569','left');sx+=sw/3;}
  txt(arcDiffLabel(),W/2,150,12,DIFF_COL[diff]||'#cbd5e1','center'); // con qué dificultad se ganaron las estrellas
  const rows=[[`BAJAS ${T_.n}`,T_.kills],[`MEJOR COMBO ×${Math.max(1,T_.combo)}`,null],[`TIEMPO ${fmtT(T_.t)} (meta ${fmtT(T_.par)})`,T_.time],['MISIÓN CUMPLIDA',T_.mission],
   [`PRISIONEROS ${T_.powsN|0} × 1,000`,T_.pows|0]];
  if(T_.stealth!==null&&T_.stealth!==undefined)rows.push(['SIN QUE TE VIERAN',T_.stealth]);
  rows.push(['SIN PERDER VIDA',T_.clean]);
  rows.forEach(([a,b],i)=>{const y=176+i*22;txt(a,150,y,13,'#e2e8f0');if(b!==null)txt(b?b.toLocaleString('en-US'):'—',W-150,y,13,b?'#4ade80':'#64748b','right');});
  const ly=176+rows.length*22-4;ctx.fillStyle='#334155';ctx.fillRect(150,ly,W-300,2);txt('TOTAL',150,ly+22,16,'#e2e8f0');txt(ARC.score.toLocaleString('en-US'),W-150,ly+22,16,'#facc15','right');
  const my=ly+54;
  if(ARC.rewards&&ARC.rewards.length)txt('¡DESBLOQUEASTE: '+ARC.rewards.join(' Y ')+'!',W/2,my,12,'#4ade80','center');
  else if(!arcHasNext())txt(ARC.lv===ARC_TOTAL-1?'¡VENCISTE AL COMANDANTE!':`¡Superaste los ${ARC_LEVELS.length} niveles disponibles!`,W/2,my,12,'#4ade80','center');
  else if(!isTouch)txt('ENTER: siguiente nivel   ·   ESC: menú',W/2,my,11,'#94a3b8','center');
 }else if(ARC.result==='cont'){ // CONTINUE? 9… 8…
  const n=Math.max(0,Math.floor(ARC.contT)),pulse=1+.12*Math.max(0,(ARC.contT%1)-.6)*5;
  txt('CONTINUE?',W/2,110,30,'#facc15','center');
  txt(String(n),W/2,200,Math.round(70*pulse),n<=3?'#ef4444':'#e2e8f0','center');
  txt(`NIVEL ${ARC.lv+1} · ${L.name}   ·   PUNTOS ${ARC.score.toLocaleString('en-US')}`,W/2,272,13,'#cbd5e1','center');
  txt(ARC.fail?'Sigues con 3 vidas: el nivel se reinicia y tus puntos vuelven a 0.':'Sigues donde caíste con 3 vidas; tus puntos y prisioneros vuelven a 0.',W/2,298,12,'#94a3b8','center');
  if(!isTouch)txt('ENTER: continuar   ·   ESC: terminar la partida',W/2,330,11,'#94a3b8','center');
 }
}
function drawArcPause(){txt(`NIVEL ${ARC.lv+1} · ${ARC_LEVELS[ARC.lv].name}`,W/2,176,16,'#e2e8f0','center');
 const [o,c]=arcObjective();txt(o,W/2,206,13,c,'center');txt(`PUNTOS ${ARC.score.toLocaleString('en-US')}   ·   VIDAS ${ARC.lives}`,W/2,236,13,'#cbd5e1','center');}

// =====================================================================
// MISIONES DE LOS NIVELES 5 A 10, PRISIONEROS Y ENEMIGOS ESPECIALES
// =====================================================================
const POW_ITEMS=[['medkit',45],['frag',20],['smg',20],['shotgun',15]]; // lo que te da un prisionero al liberarlo
const LAVA_EVERY={1:3.4,2:3,3:2.6,4:2.2}; // segundos que tarda la lava en avanzar una columna
const arcHuntHostage=()=>!!(ARC&&diff===4&&ARC.freed); // en DIFÍCIL también le disparan al rehén
function arcFlee(e){ // ALERTA ROJA: van a la esquina más lejana de ti
 const P=arcPlayer(),C=[[1,1],[COLS-2,1],[1,ROWS-2],[COLS-2,ROWS-2]];
 C.sort((a,b)=>(Math.abs(b[0]-P.tx)+Math.abs(b[1]-P.ty))-(Math.abs(a[0]-P.tx)+Math.abs(a[1]-P.ty)));
 return nearestFloor(C[0][0],C[0][1])||C[0];
}
function arcDamage(e,d,src,w){
 if(ARC.redT>0&&src&&src.id===0&&e.enemy)d*=3; // ALERTA ROJA: tu daño es triple
 if(e.armor&&src&&src!==e&&w!=='frag'){ // armadura del Comandante: de frente aguanta, por la espalda es débil
  const dx=src.x-e.x,dy=src.y-e.y,l=Math.hypot(dx,dy)||1,dot=(dx*e.dir.dx+dy*e.dir.dy)/l;
  if(dot>.3)d*=e.armorWeak?.5:.25;else if(dot<-.3)d*=e.armorWeak?2:1.5;
  if(dot>.3)sparks(e.x+e.dir.dx*10,e.y+e.dir.dy*10,'#fde047',3);
 }
 return d;
}
function arcSpawnAt(k,near,minP){ // un enemigo en una casilla libre cerca de 'near' y lejos de ti
 const P=arcPlayer();let s=null;
 for(let t=0;t<120&&!s;t++){const x=near[0]+ri(-4,4),y=near[1]+ri(-4,4);
  if(x<1||y<1||x>COLS-2||y>ROWS-2||!walkable(x,y)||tileTaken(null,x,y))continue;if(Math.abs(x-P.tx)+Math.abs(y-P.ty)<(minP||5))continue;s=[x,y];}
 if(!s){ // el azar no encontró lugar (mapa apretado): busca casilla por casilla, de la más cercana a 'near' hacia afuera
  const c=[];for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){const dn=Math.abs(x-near[0])+Math.abs(y-near[1]);
   if(dn<=8&&walkable(x,y)&&!tileTaken(null,x,y)&&Math.abs(x-P.tx)+Math.abs(y-P.ty)>=Math.min(3,minP||5))c.push([dn,x,y]);}
  c.sort((a,b)=>a[0]-b[0]);if(c.length)s=[c[0][1],c[0][2]];}
 if(!s)return null;const e=arcEnemy(k,ents.length);arcPlace(e,s[0],s[1]);e.invulnT=.8;ents.push(e);return e;
}
function arcFarDoors(){const P=arcPlayer();return ARC.spawns.slice().sort((a,b)=>(Math.abs(b[0]-P.tx)+Math.abs(b[1]-P.ty))-(Math.abs(a[0]-P.tx)+Math.abs(a[1]-P.ty)));}
function arcAlarm(text){const P=arcPlayer();for(const e of arcAlive())reveal(e.ai,P,false);announce={text,c:'#f87171',t:2};sfx('streak');}
function arcTickExtra(dt,L,P){
 const ptx=wx(Math.floor(P.x/T)),pty=Math.floor(P.y/T),m=ARC_MULT[diff];
 // prisioneros: al tocarlos te dan un objeto y suman al bono del nivel (solo se pierden si usas CONTINUE)
 if(P.alive)for(const w of ARC.pows)if(!w.freed&&Math.abs(w.x-ptx)+Math.abs(w.y-pty)<=1){
  w.freed=true;ARC.powsN++;let r=Math.random()*100,type='medkit';for(const [k,p] of POW_ITEMS){r-=p;if(r<=0){type=k;break;}}
  pickups.push({tx:w.x,ty:w.y,type,amt:PICK[type].amt,t:0});showToast(`¡PRISIONERO LIBERADO! (${ARC.powsN})`,'#4ade80');sfx('pick');
  fx.push({kind:'pts',px:w.x*T+16,py:w.y*T,t:1,max:1,s:'¡GRACIAS!'});
 }
 // granadas en arco (granadero y Comandante desde la fase 2)
 for(const e of arcAlive()){if(!(ENEMY[e.etype].lob))continue;if(e.etype==='C'&&ARC.phase<2)continue;
  e.lobT-=dt;const k=e.ai.known[0];
  if(k&&e.lobT<=0&&e.blindT<=0){const d=Math.abs(k.tx-e.tx)+Math.abs(k.ty-e.ty);
   if(d>=2&&d<=6){e.lobT=ENEMY[e.etype].lob*rnd(.8,1.2)*(diff>=4?.75:diff<=2?1.4:1);
    nades.push({x:e.x,y:e.y,vx:0,vy:0,owner:e,type:'frag',fuse:1.6,lob:{sx:e.x,sy:e.y,ex:k.tx*T+16,ey:k.ty*T+16,t:0,d:.9}});snd('throw',e.x,e.y);}}}
 if(ARC.redT>0)ARC.redT-=dt;
 if(L.goal==='coins'){ // LABERINTO: fichas y ALERTA ROJA
  const i=idx(ptx,pty);if(P.alive&&ARC.coins.has(i)){ARC.coins.delete(i);ARC.coinsGot++;arcAddScore(10*m);if(ARC.coinsGot%10===0)sfx('tick');if(ARC.coinsGot>=L.need)arcMissionDone();}
  for(const r of ARC.reds)if(!r.got&&P.alive&&r.x===ptx&&r.y===pty){r.got=true;ARC.redT=6;arcAddScore(50*m);announce={text:'¡ALERTA ROJA!',c:'#ef4444',t:1.6};sfx('streak');
   for(const e of arcAlive())e.ai.patrol=null;}
 }else if(L.goal==='escape'){ // HUIDA: la lava avanza una columna a la vez
  ARC.lavaT-=dt;if(ARC.lavaT<=0&&ARC.lavaX<COLS-3){ARC.lavaT=LAVA_EVERY[diff]||2.6;ARC.lavaX++;const x=ARC.lavaX;
   for(let y=1;y<ROWS-1;y++){const j=idx(x,y);if(grid[j]!==WALL){grid[j]=LAVA;crateHP[j]=0;}}gridVer++;pickups=pickups.filter(p=>p.tx!==x);sfx('boom');shake=Math.max(shake,3);
   for(const e of ents)if(e.alive&&(wx(Math.floor(e.x/T))<=x||e.tx<=x)){e.invulnT=0;if(e.isPlayer){kill(e,null,'frag');ARC.downMsg='¡TE ALCANZÓ LA LAVA!';}else kill(e,null,'frag');}}
 }else if(L.goal==='intel'||L.goal==='case'){ // APAGÓN y ASALTO: tomar los planos o el maletín
  const it=ARC.item;
  if(L.goal==='intel'&&!ARC.spotted&&arcAlive().some(e=>e.ai.known[0]&&e.ai.known[0].seen)){ARC.spotted=true;arcAlarm('¡TE VIERON!');}
  if(it&&!it.taken&&P.alive&&it.x===ptx&&it.y===pty){it.taken=true;arcMissionDone();sfx('pick');
   if(L.goal==='case'){arcAlarm('¡TODOS VAN POR TI!');const D=arcFarDoors();[...(L.reinf||'')].forEach((k,n)=>{const e=arcSpawnAt(k,D[n%D.length],6);if(e)reveal(e.ai,P,false);});}
   else showToast('¡TIENES LOS PLANOS! A LA EXTRACCIÓN','#4ade80');}
 }else if(L.goal==='boss'){
  const B=ARC.boss;
  if(B&&!B.alive){arcMissionDone();}
  else if(B){const f=B.hp/B.maxHp;
   if(B.etype==='K'&&ARC.phase<2&&f<=.5){ARC.phase=2;arcAlarm('¡CUBRAN AL SARGENTO!');}
   if(B.etype==='C'){
    if(ARC.phase<2&&f<=.66){ARC.phase=2;ARC.reinfT=1;announce={text:'FASE 2: ¡REFUERZOS!',c:'#f87171',t:2};sfx('streak');}
    if(ARC.phase<3&&f<=.33){ARC.phase=3;B.armorWeak=true;B.speed*=1.3;announce={text:'FASE 3: ¡SIN ARMADURA!',c:'#facc15',t:2};sfx('streak');}
    if(ARC.phase>=2){ARC.reinfT-=dt;if(ARC.reinfT<=0){ARC.reinfT=diff>=4?10:diff<=2?16:12;const D=arcFarDoors();
     for(let n=0;n<2&&arcAlive().length<7;n++){const e=arcSpawnAt('r',D[n%D.length],6);if(e)reveal(e.ai,P,false);}}}
   }}
 }else if(L.goal==='bombs'&&!ARC.exitOpen&&!ARC.bombReinf&&ARC.bombT<=30){ // CARGAS: a 30 s llegan refuerzos a la última bomba
  const left=ARC.bombs.filter(b=>!b.done);
  if(left.length){ARC.bombReinf=true;left.sort((a,b)=>(Math.abs(b.x-ptx)+Math.abs(b.y-pty))-(Math.abs(a.x-ptx)+Math.abs(a.y-pty)));const b=left[0];
   for(const k of ['a','s']){const e=arcSpawnAt(k,[b.x,b.y],4);if(e)e.home=[b.x,b.y];}showToast('¡REFUERZOS A LA BOMBA MÁS LEJANA!','#f87171');sfx('streak');}
 }
}
// ---------- DIBUJO DE LO NUEVO ----------
function shieldOverlay(g,x,y,face,sc){ // escudo balístico al frente (no se ve de espaldas)
 const r=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x+a*sc),Math.round(y+b*sc),Math.round(w*sc),Math.round(h*sc));};
 if(face==='down'){r('#0b0e14',-8,-9,16,15);r('#52525b',-7,-8,14,13);r('#71717a',-7,-8,14,2);r('#0a0a0a',-4,-6,8,2);r('#ef4444',-3,-2,2,2);r('#ef4444',1,-2,2,2);}
 else if(face==='right'||face==='left'){const d=face==='right'?1:-1,bx=d>0?5:-8;r('#0b0e14',bx,-12,3,18);r('#52525b',bx+(d>0?0:1),-11,2,16);r('#71717a',bx+(d>0?0:1),-11,1,16);}
}
function capeOverlay(g,x,feet,sc){ // capa del Comandante, de espaldas
 const R=[[-5,5],[-5,5],[-6,6],[-6,6],[-7,7],[-7,7],[-7,7],[-8,8],[-8,8],[-8,8]],top=feet-12*sc;
 R.forEach(([l,r],i)=>{g.fillStyle='#0b0e14';g.fillRect(x+(l-1)*sc,top+i*sc,(r-l+2)*sc,sc);});
 R.forEach(([l,r],i)=>{g.fillStyle='#7f1d1d';g.fillRect(x+l*sc,top+i*sc,(r-l)*sc,sc);g.fillStyle='#5f1515';for(const k of [-4,0,4])g.fillRect(x+k*sc,top+i*sc,sc,sc);});
 g.fillStyle='#facc15';g.fillRect(x-5*sc,top,10*sc,sc);
}
function arcSoldierExtras(e,x,feet,face,sc){
 if(e.shield&&face!=='up')shieldOverlay(ctx,x,feet-6*sc,face,sc);
 if(e.crest){ctx.fillStyle='#0b0e14';ctx.fillRect(x-4*sc,feet-22*sc,8*sc,2*sc);ctx.fillStyle='#ef4444';ctx.fillRect(x-3*sc,feet-21.5*sc,6*sc,1.2*sc);} // cresta roja del Sargento
 if(e.armor&&face==='up'&&!e.armorWeak)capeOverlay(ctx,x,feet,sc);
}
function drawArcExtras(){
 const L=ARC_LEVELS[ARC.lv];
 // lava a punto de avanzar
 if(L.goal==='escape'&&ARC.lavaX<COLS-3){const x=(ARC.lavaX+1)*T,a=.12+.12*Math.sin(clock*10)*(ARC.lavaT<1?1:.3);ctx.fillStyle=`rgba(249,115,22,${a})`;ctx.fillRect(x,T,T,(ROWS-2)*T);}
 // fichas y ALERTA ROJA
 if(L.goal==='coins'){ctx.fillStyle='#fde68a';for(const i of ARC.coins){const x=(i%COLS)*T+14,y=((i/COLS)|0)*T+14;if(canSee(x,y))ctx.fillRect(x,y,4,4);}
  for(const r of ARC.reds)if(!r.got&&canSee(r.x*T+16,r.y*T+16)){const p=5+Math.sin(clock*8)*2;ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(r.x*T+16,r.y*T+16,p+2,0,7);ctx.fill();ctx.fillStyle='#fecaca';ctx.fillRect(r.x*T+14,r.y*T+14,3,3);}}
 // planos o maletín
 const it=ARC.item;if(it&&!it.taken&&canSee(it.x*T+16,it.y*T+16)){const x=it.x*T+16,y=it.y*T+16+Math.round(Math.sin(clock*4)*1.5);
  if(L.goal==='case'){ctx.fillStyle='#0b0e14';ctx.fillRect(x-10,y-6,20,14);ctx.fillStyle='#7a5230';ctx.fillRect(x-9,y-5,18,12);ctx.fillStyle='#facc15';ctx.fillRect(x-3,y-9,6,3);ctx.fillRect(x-1,y,2,3);}
  else{ctx.fillStyle='#0b0e14';ctx.fillRect(x-9,y-8,18,16);ctx.fillStyle='#60a5fa';ctx.fillRect(x-8,y-7,16,14);ctx.fillStyle='#dbeafe';for(let k=0;k<3;k++)ctx.fillRect(x-6,y-4+k*4,12,1);}
  txt(L.goal==='case'?'MALETÍN':'PLANOS',x,y-16,9,'#facc15','center',false);}
 // prisioneros amarrados
 for(const w of ARC.pows){if(w.freed)continue;const x=w.x*T+16,y=w.y*T+16;if(!canSee(x,y))continue;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x-10,y+11,20,4);drawSkin(ctx,'recruitM','#cbd5e1','down',0,false,'none',x,y+13,2);
  ctx.fillStyle='#a16207';ctx.fillRect(x-11,y-2,22,3);ctx.fillRect(x-11,y+5,22,2);
  if(Math.floor(clock*2)%2)txt('¡AYUDA!',x,y-36,9,'#4ade80','center');}
 // mira láser del tirador
 for(const e of arcAlive()){if(!e.laser||!(e.ai.seeId>=0)||!(e.ai.reaction>0))continue;
  const tp=gunTip(e.skin,e.dir.dy<0?'up':e.dir.dy>0?'down':e.dir.dx>0?'right':'left','rifle'),x0=e.x+tp.dx,y0=e.y+tp.dy;let x1=x0,y1=y0;
  for(let k=0;k<13*T;k+=4){const nx=x0+e.dir.dx*k,ny=y0+e.dir.dy*k;if(blocks(tile(Math.floor(nx/T),Math.floor(ny/T))))break;x1=nx;y1=ny;}
  ctx.strokeStyle=`rgba(239,68,68,${.45+.4*Math.sin(clock*30)})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
}
function drawArcBoss(){ // barra de vida del jefe
 const B=ARC.boss;if(!B||!B.alive||state!=='play')return;
 const w=300,x=W/2-w/2,y=HUD+H-26,f=Math.max(0,B.hp/B.maxHp),m=arcPlayer(); // abajo, sobre el muro del borde
 ctx.globalAlpha=m&&m.alive&&m.y>H-70&&Math.abs(m.x-W/2)<w/2+20?.35:1;
 ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(x-6,y,w+12,22);txt(B.name+(B.etype==='C'?` · FASE ${ARC.phase}`:''),W/2,y+7,9,'#f87171','center',false);
 ctx.fillStyle='#3f1d1d';ctx.fillRect(x,y+13,w,6);ctx.fillStyle=B.armorWeak?'#facc15':'#ef4444';ctx.fillRect(x,y+13,w*f,6);ctx.globalAlpha=1;
}

// ---------- FIN DE LA PARTIDA Y RÉCORDS (se guardan en este navegador) ----------
// Al terminar la cuenta del CONTINUE (o al vencer al Comandante) la partida acaba: GAME OVER con el resumen,
// iniciales estilo arcade si entras al top 10, la tabla MEJORES ⇄ RECIENTES y de vuelta al inicio. No hay reintento.
// Se registra el MEJOR crédito de la partida (los puntos vuelven a 0 al continuar), el nivel más alto y los continues.
const HS_CHARS='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789';
const HS_INI_T=30,HS_BOARD_T=15,HS_FLIP_T=6; // segundos: para elegir iniciales, para volver al inicio, para cambiar de tabla
const arcIni=()=>{const s=String(arcSave.ini||'').toUpperCase().replace(/[^A-ZÑ0-9]/g,'').slice(0,3);return s.length===3?s:(s+'JUG').slice(0,3);};
const arcRankCmp=(a,b)=>(b.s-a.s)||(b.lv-a.lv)||((a.t||0)-(b.t||0)); // empate: llegó más lejos; luego el más antiguo
function arcBank(){if(ARC){ARC.runBest=Math.max(ARC.runBest||0,ARC.score);ARC.runLv=Math.max(ARC.runLv||1,ARC.lv+1);}} // guarda lo mejor antes de que los puntos vuelvan a 0
function arcRun(){arcBank();return {s:ARC.runBest,lv:ARC.runLv,c:ARC.cont|0,d:diff};}
const arcQualifies=s=>s>0&&(arcSave.best.length<10||arcRankCmp({s,lv:99,t:1e15},arcSave.best[arcSave.best.length-1])<0);
function arcRankOf(r){return arcSave.best.filter(b=>arcRankCmp(b,r)<0).length+1;}
function arcEndRun(kind){ // 'lose' (se acabó el CONTINUE) o 'final' (venciste el último nivel)
 if(!ARC||ARC.end)return;
 ARC.result=kind;state='over';toast=null;ARC.end=Object.assign(arcRun(),{phase:'sum',t:kind==='final'?3.5:2,saved:false,tab:'best',flip:HS_FLIP_T,last:ARC.score});
 if(kind==='lose')sfx('die');
}
function arcAskRecord(){ // después del resumen: iniciales si entras al top 10; si no, directo a la tabla
 if(!ARC)return;if(!ARC.end)ARC.end=Object.assign(arcRun(),{phase:'sum',t:0,saved:false,tab:'best',flip:HS_FLIP_T,last:ARC.score});
 const E=ARC.end;if(E.saved)return;
 if(arcQualifies(E.s)){E.phase='ini';ARC.hs={pending:true,rank:-1,ch:arcIni().split(''),pos:0,t:HS_INI_T};}
 else arcCommit(arcIni());
}
function arcCommit(ini){ // guarda la partida: en MEJORES si alcanza y siempre en RECIENTES
 const E=ARC&&ARC.end;if(!E||E.saved)return;
 ini=String(ini||'').toUpperCase().replace(/[^A-ZÑ0-9]/g,'').slice(0,3)||arcIni();
 const r={i:ini,s:E.s,lv:E.lv,d:E.d,c:E.c,t:Date.now()};let rank=-1;
 if(arcQualifies(r.s)){arcSave.best.push(r);arcSave.best.sort(arcRankCmp);arcSave.best=arcSave.best.slice(0,10);rank=arcSave.best.indexOf(r);}
 arcSave.recent.unshift(Object.assign({},r,{rank}));arcSave.recent=arcSave.recent.slice(0,5);arcSave.ini=ini;arcStore();
 Object.assign(E,{saved:true,rank,phase:'board',t:HS_BOARD_T,tab:rank>=0?'best':'recent',flip:HS_FLIP_T,lock:1.2}); // lock: un FUEGO de más al poner las iniciales no salta la tabla
 ARC.hs={pending:false,rank,ch:ini.split(''),pos:0,t:0};if(rank>=0)sfx('win');
}
function arcSaveRecord(ini){if(!ARC||!ARC.hs||!ARC.hs.pending)return;arcCommit(ini===undefined?ARC.hs.ch.join(''):ini);}
function arcLeaveSave(){ // salir al menú en el CONTINUE, el resumen o las iniciales: la partida se registra igual
 if(!ARC)return;
 if(ARC.result==='cont'&&!ARC.end)arcEndRun('lose');
 if(ARC.end&&!ARC.end.saved){if(ARC.hs&&ARC.hs.pending)arcSaveRecord();else arcCommit(arcIni());}
}
function arcEndTick(dt){
 const E=ARC.end;if(!E)return;
 if(E.phase==='sum'){E.t-=dt;if(E.t<=0)arcAskRecord();}
 else if(E.phase==='ini'){ARC.hs.t-=dt;if(ARC.hs.t<=0)arcSaveRecord();}
 else if(E.phase==='board'){E.t-=dt;E.flip-=dt;E.lock=Math.max(0,(E.lock||0)-dt);if(E.flip<=0){E.flip=HS_FLIP_T;E.tab=E.tab==='best'?'recent':'best';}if(E.t<=0)toTitle();}
}
function arcEndKey(c){ // teclas en el fin de la partida; true si la usó
 const E=ARC&&ARC.end;if(!E)return false;
 if(E.phase==='sum'){if(c==='Enter'||c==='Space'){E.t=0;arcAskRecord();}return true;}
 if(E.phase==='board'){if(E.lock>0)return true;
  if(c==='ArrowLeft'||c==='ArrowRight'||c==='KeyA'||c==='KeyD'){E.tab=E.tab==='best'?'recent':'best';E.flip=HS_FLIP_T;E.t=Math.max(E.t,8);sfx('tick');}
  else if(c==='Enter'||c==='Space'||c==='Escape')toTitle();
  return true;}
 const h=ARC.hs;if(!h||!h.pending)return true;
 const N=HS_CHARS.length,cur=()=>HS_CHARS.indexOf(h.ch[h.pos]);
 if(c==='ArrowUp'){h.ch[h.pos]=HS_CHARS[(cur()+1)%N];sfx('tick');}
 else if(c==='ArrowDown'){h.ch[h.pos]=HS_CHARS[(cur()-1+N)%N];sfx('tick');}
 else if(c==='ArrowLeft'||c==='Backspace')h.pos=Math.max(0,h.pos-1);
 else if(c==='ArrowRight')h.pos=Math.min(2,h.pos+1);
 else if(c==='Space'){if(h.pos<2){h.pos++;sfx('tick');}else arcSaveRecord();}
 else if(c==='Enter')arcSaveRecord();
 else{const m=/^Key([A-Z])$/.exec(c)||/^Digit([0-9])$/.exec(c)||(c==='Semicolon'?[0,'Ñ']:null); // en computadora también se escriben
  if(m){h.ch[h.pos]=m[1];h.pos=Math.min(2,h.pos+1);sfx('tick');}}
 return true;
}
function drawArcEnd(){
 const E=ARC.end,L=ARC_LEVELS[ARC.lv],fin=ARC.result==='final';overlay(.9);
 if(E.phase==='sum'){
  txt(fin?'¡MISIÓN CUMPLIDA!':'GAME OVER',W/2,96,fin?30:38,fin?'#facc15':'#ef4444','center');
  txt(fin?'VENCISTE AL COMANDANTE':`NIVEL ${ARC.lv+1} · ${L.name}`,W/2,136,15,'#e2e8f0','center');
  txt(`DIFICULTAD ${DIFF[E.d].name}`,W/2,158,11,DIFF_COL[E.d]||'#cbd5e1','center');
  [['MEJOR PUNTAJE',E.s.toLocaleString('en-US')],['NIVEL MÁXIMO',String(E.lv)],['CONTINUES',String(E.c)]].forEach(([a,b],i)=>{const x=W/2+(i-1)*190;
   txt(a,x,212,11,'#94a3b8','center');txt(b,x,246,26,'#facc15','center');});
  if(E.c&&E.last!==E.s)txt(`Tu mejor crédito hizo ${E.s.toLocaleString('en-US')} puntos; el último, ${E.last.toLocaleString('en-US')}.`,W/2,300,12,'#94a3b8','center');
  else if(!E.c)txt('¡Sin usar continues!',W/2,300,12,'#4ade80','center');
  return;}
 if(E.phase==='ini'){const h=ARC.hs;
  txt(String(Math.max(0,Math.ceil(h.t))),W-40,HUD+40,22,'#f87171','center');
  txt('¡NUEVO RÉCORD!',W/2,104,30,'#facc15','center');
  txt(`PUESTO ${arcRankOf({s:E.s,lv:E.lv,t:1e15})} DE 10   ·   ${E.s.toLocaleString('en-US')} PUNTOS   ·   NIVEL ${E.lv}`,W/2,138,13,'#e2e8f0','center');
  for(let i=0;i<3;i++){const x=W/2+(i-1)*72,y=210,on=i===h.pos;
   ctx.fillStyle='#0b0d12';ctx.fillRect(x-26,y-34,52,64);ctx.strokeStyle=on?'#facc15':'#475569';ctx.lineWidth=3;ctx.strokeRect(x-26,y-34,52,64);
   txt(h.ch[i],x,y,40,on?(Math.floor(clock*3)%2?'#fde68a':'#facc15'):(i<h.pos?'#e2e8f0':'#94a3b8'),'center');
   if(on){txt('▲',x,y-50,14,'#facc15','center');txt('▼',x,y+50,14,'#facc15','center');}}
  txt('▲ ▼ cambia la letra   ·   ◀ ▶ mueve   ·   FUEGO acepta',W/2,300,12,'#cbd5e1','center');
  if(!isTouch)txt('También puedes escribirlas · ENTER guarda',W/2,322,11,'#64748b','center');
  return;}
 // tabla
 txt('RÉCORDS',W/2,84,24,'#facc15','center');
 const tabs=[['best','MEJORES'],['recent','RECIENTES']];tabs.forEach(([k,n],i)=>{const x=W/2+(i?70:-70),on=E.tab===k;
  ctx.strokeStyle=on?'#facc15':'#334155';ctx.lineWidth=2;ctx.strokeRect(x-60,104,120,24);txt(n,x,117,12,on?'#facc15':'#64748b','center');});
 drawBoard(E.tab,E.tab==='best'?E.rank:0,150,true);
 txt(`Al inicio en ${Math.max(0,Math.ceil(E.t))}…`+(isTouch?'':'   ·   ◀ ▶ cambia de tabla   ·   ENTER: inicio'),W/2,398,11,'#94a3b8','center');
}
function drawBoard(tab,hi,y0,blink){ // MEJORES (10) o RECIENTES (5); hi: renglón que parpadea en verde
 const best=tab==='best',L=best?arcSave.best:arcSave.recent;
 const cx=best?[150,180,330,350,440]:[150,300,320,410,520];
 const head=best?['#','INI','PUNTOS','NIVEL','DIFICULTAD']:['INI','PUNTOS','NIVEL','DIFICULTAD','PUESTO'];
 head.forEach((h,i)=>txt(h,cx[i],y0,10,'#64748b',(best?[0,2]:[1,4]).includes(i)?'right':'left'));
 if(!L.length){txt(best?'Todavía no hay récords':'Todavía no hay partidas',W/2,y0+40,12,'#64748b','center');return;}
 L.forEach((r,i)=>{const y=y0+24+i*21,me=i===hi&&(best?hi>=0:true),c=me?(blink&&Math.floor(clock*2.5)%2?'#bbf7d0':'#4ade80'):'#e2e8f0';
  const lv=`${r.lv}`+(r.c!==undefined?` · ${r.c}C`:''),dc=me?c:(DIFF_COL[r.d]||'#cbd5e1');
  if(best){txt(`${i+1}`,cx[0],y,13,c,'right');txt(r.i,cx[1],y,13,c);txt(r.s.toLocaleString('en-US'),cx[2],y,13,c,'right');txt(lv,cx[3],y,13,me?c:'#cbd5e1');txt(DIFF[r.d].name,cx[4],y,12,dc);}
  else{txt(r.i,cx[0],y,13,c);txt(r.s.toLocaleString('en-US'),cx[1],y,13,c,'right');txt(lv,cx[2],y,13,me?c:'#cbd5e1');txt(DIFF[r.d].name,cx[3],y,12,dc);
   txt(r.rank>=0&&arcSave.best.some(b=>b.t===r.t&&b.s===r.s)?`#${arcSave.best.findIndex(b=>b.t===r.t&&b.s===r.s)+1}`:'—',cx[4],y,13,me?c:'#94a3b8','right');}});
}
// tabla desde el menú (renglón RÉCORD): se dibuja encima del fondo del menú
let recView=null; // {tab}
function openRecView(){recView={tab:arcSave.best.length||!arcSave.recent.length?'best':'recent'};syncRecView();}
function closeRecView(){recView=null;syncRecView();}
function syncRecView(){const m=document.getElementById('menu'),b=document.getElementById('recClose');if(m&&state==='title')m.style.display=recView?'none':'flex';if(b)b.style.display=recView?'flex':'none';}
function recViewKey(c){if(c==='ArrowLeft'||c==='ArrowRight'||c==='KeyA'||c==='KeyD')recView.tab=recView.tab==='best'?'recent':'best';else closeRecView();}
function drawRecView(){overlay(.9);txt('RÉCORDS',W/2,84,24,'#facc15','center');
 [['best','MEJORES'],['recent','RECIENTES']].forEach(([k,n],i)=>{const x=W/2+(i?70:-70),on=recView.tab===k;ctx.strokeStyle=on?'#facc15':'#334155';ctx.lineWidth=2;ctx.strokeRect(x-60,104,120,24);txt(n,x,117,12,on?'#facc15':'#64748b','center');});
 drawBoard(recView.tab,-1,150,false);
 txt(isTouch?'Toca las pestañas para cambiar de tabla':'◀ ▶ cambia de tabla   ·   cualquier otra tecla: cerrar',W/2,398,11,'#94a3b8','center');}
