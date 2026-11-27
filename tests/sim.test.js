// Simula partidas completas de un jugador en todos los escenarios y revisa reglas básicas.
const assert=require('assert'),fs=require('fs'),path=require('path');
const {makeContext,ROOT}=require('./load');
const {run}=makeContext();
let ok=0;const t=(name,fn)=>{fn();ok++;console.log('  ✓',name);};
console.log('Simulación de partidas');
t('versión del juego y del service worker coinciden',()=>{
  const v=run('VERSION');assert.match(v,/^\d+\.\d+\.\d+$/);
  const sw=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');assert.ok(sw.includes(`const VERSION='${v}'`),'sw.js tiene otra versión');
  const cl=fs.readFileSync(path.join(ROOT,'CHANGELOG.md'),'utf8');assert.ok(cl.includes(`## [${v}]`),'falta la versión en CHANGELOG.md');
});
for(const k of run('THEME_KEYS')){
  t(`escenario ${k}: la partida termina sin errores y nadie pisa lava`,()=>{
    const r=run(`(()=>{themeChoice='${k}';diff=3;SETTINGS.preset=1;startMatch();let onLava=0,wraps=0;const prev=ents.map(e=>e.tx);
      for(let i=0;i<60*180&&state==='play';i++){
        if(i%30===0){dirStack=[['KeyW','KeyA','KeyS','KeyD'][Math.floor(Math.random()*4)]];keys.Space=Math.random()<.5;}
        update(1/60);if(i%15===0)render();
        ents.forEach((e,j)=>{if(Math.abs(e.tx-prev[j])>=COLS-2)wraps++;prev[j]=e.tx;if(e.alive&&grid[idx(wx(Math.floor(e.x/T)),Math.floor(e.y/T))]===LAVA)onLava++;});
      }
      return {state,onLava,wraps,frags:ents.reduce((a,e)=>a+e.frags,0),wrap:WRAP};})()`);
    assert.strictEqual(r.state,'over');assert.strictEqual(r.onLava,0);assert.ok(r.frags>0,'nadie hizo bajas');
    if(r.wrap)assert.ok(r.wraps>0,'nadie usó los túneles del arcade');
  });
}
t('el mapa siempre queda conectado',()=>{assert.ok(run(`(()=>{for(let i=0;i<50;i++){setTheme(THEME_KEYS[i%THEME_KEYS.length]);genMap();if(!connected())return false;}return true;})()`));});
t('rachas y estadísticas',()=>{
  const r=run(`(()=>{themeChoice='bunker';startMatch();const m=ents[0];for(let i=1;i<=3;i++){ents[i].invulnT=0;kill(ents[i],m,'rifle');}return {s:m.streak,a:announce&&announce.text,st:statRow(m)};})()`);
  assert.strictEqual(r.s,3);assert.ok(/TRIPLE/.test(r.a));assert.strictEqual(r.st[2],3); // arma favorita = rifle
});
t('cada aspecto tiene frente y lado de 16 × 20, mano para el arma y nombre',()=>{
  const r=run(`SKINS.map(s=>({k:s.k,n:s.n,v:['down','right'].map(v=>{const g=SKIN_GRID[s.k][v];return g.length===20&&g.every(x=>x.length===16);}),h:!!(SKIN_HAND[s.k]&&SKIN_HAND[s.k].down&&SKIN_HAND[s.k].right),p:!!SKIN_PAL[s.p]}))`);
  assert.strictEqual(r.length,7);
  // todos miden lo mismo: 18 renglones del casco (o la boina, o la capucha) a las botas, de frente y de lado
  const alto=run(`SKINS.flatMap(s=>['down','right'].map(v=>{const g=SKIN_GRID[s.k][v],f=g.map((x,i)=>/[^.]/.test(x)?i:-1).filter(i=>i>=0);return s.k+'/'+v+':'+(f[f.length-1]-f[0]+1);}))`);
  for(const a of alto)assert.ok(a.endsWith(':18'),'altura distinta: '+a);for(const s of r){assert.ok(s.v.every(Boolean),s.k+': tamaño incorrecto');assert.ok(s.h,s.k+': falta la mano');assert.ok(s.p,s.k+': falta la paleta');}
  // todos los aspectos, en todas las vistas, cuadros y armas, generan su dibujo sin letras desconocidas
  const bad=run(`(()=>{const out=[];for(const s of SKINS)for(const f of ['down','up','right'])for(const fr of [0,1,2])for(const w of ['pistol','smg','shotgun','rifle']){
    const pal=Object.assign({},SKIN_BASE,SKIN_PAL[s.p],GUN_PAL,{T:1,t:1,u:1});const c=skinCells(s.k,f,fr,w);
    c.forEach(r=>r.forEach(x=>{if(x&&!(x.ch in pal))out.push(s.k+f+x.ch);}));}return out;})()`);
  assert.strictEqual(bad.length,0,'letras sin color: '+[...bad].slice(0,5).join(', '));
});
t('la punta del arma queda sobre el carril de la bala en las 4 vistas, 7 aspectos y 4 armas',()=>{
  const bad=run(`(()=>{const out=[];for(const s of SKINS)for(const f of ['down','up','right','left'])for(const w of ['pistol','smg','shotgun','rifle']){
    const t=gunTip(s.k,f,w);const lateral=(f==='down'||f==='up')?t.dx:t.dy,ahead=f==='down'?t.dy:f==='up'?-t.dy:f==='right'?t.dx:-t.dx;
    if(lateral!==0||ahead<12)out.push(s.k+'/'+f+'/'+w+':'+lateral+','+ahead);
    // y en esa punta hay un píxel del arma
    const ff=f==='left'?'right':f,c=skinCells(s.k,ff,0,w),gp=gunPlace(s.k,ff,w),cell=c[gp.tip[1]+SK_TOP][gp.tip[0]];if(!cell||!cell.gun)out.push(s.k+'/'+f+'/'+w+': punta vacía');}
    return out;})()`);
  assert.strictEqual(bad.length,0,[...bad].slice(0,6).join(' | '));
});
t('las IAs y el jugador llevan un aspecto válido',()=>{
  const r=run(`(()=>{themeChoice='bunker';startMatch();return ents.map(e=>SKIN_KEYS.includes(e.skin));})()`);
  assert.ok(r.every(Boolean));
});
t('MODO: PARTIDA tiene opciones propias por modo y se recuerdan',()=>{
  const r=run(`(()=>{SETTINGS.mode='ctf';SETTINGS.pctf=2;const a=presetLabel(presetIdx());SETTINGS.mode='lms';SETTINGS.plms=0;const b=presetLabel(presetIdx());SETTINGS.mode='dm';const c=presetLabel(presetIdx());SETTINGS.mode='ctf';const d=presetIdx();SETTINGS.mode='dm';return {a,b,c,d};})()`);
  assert.strictEqual(r.a,'5 CAPTURAS · 8 MIN');assert.strictEqual(r.b,'1 VIDA · 4 MIN');assert.strictEqual(r.c,'NORMAL · 3 MIN · 10 BAJAS');assert.strictEqual(r.d,2);
});
for(const k of run('THEME_KEYS')){
  t(`último en pie (${k}): termina con un solo sobreviviente o por tiempo, y los eliminados no reaparecen`,()=>{
    const r=run(`(()=>{themeChoice='${k}';diff=3;SETTINGS.mode='lms';SETTINGS.plms=0;startMatch();let back=0;
      for(let i=0;i<30*260&&state==='play';i++){
        if(i%15===0){dirStack=[['KeyW','KeyA','KeyS','KeyD'][Math.floor(Math.random()*4)]];keys.Space=Math.random()<.5;}
        update(1/30);if(i%30===0)render();if(ents.some(e=>e.out&&e.alive))back++;
      }
      const r={state,left:playersLeft(),tl:timeLeft,back,lives:ents.map(e=>e.lives),w:winner&&winner.id,top:[...ents].sort(byScore)[0].id};SETTINGS.mode='dm';return r;})()`);
    assert.strictEqual(r.state,'over');assert.strictEqual(r.back,0,'un eliminado reapareció');
    assert.ok(r.left<=1||r.tl<=0,`terminó con ${r.left} vivos y ${r.tl}s`);assert.strictEqual(r.w,r.top,'el ganador no es el primero del tablero');
    assert.ok(r.lives.every(l=>l>=0&&l<=1));
  });
}
t('bandera: se toma al pasar, cae donde muere el portador, vuelve sola a los 20 s y al capturar vuelve al centro',()=>{
  const r=run(`(()=>{themeChoice='bunker';SETTINGS.mode='ctf';SETTINGS.pctf=1;startMatch();tut=null;const out={};
    out.n=ents.length;out.bases=ents.every((e,i)=>e.tx===SPAWNS[i][0]&&e.ty===SPAWNS[i][1]);
    for(const e of ents.slice(1)){e.alive=false;e.respawnT=1e9;}
    const m=ents[0];placeAt(m,FLAG_HOME);updFlag(.016);out.took=flag.carrier===0;
    out.slow=(()=>{const s=m.x;placeAt(m,[9,7]);m.x=9*T+T/2;const x0=m.x;stepMove(m,DIRS[1],.1,true);return Math.round((m.x-x0)/(PLAYER_SPEED*T*.1)*100);})();
    placeAt(m,[3,1]);updFlag(.016);m.invulnT=0;kill(m,null);out.drop=[flag.carrier,flagTile()[0],flagTile()[1],flag.dropT];
    updFlag(FLAG_RETURN-1);out.still=flagTile().join(',');updFlag(1.1);out.ret=flagTile().join(',');
    spawn(m,SPAWNS[0]);placeAt(m,FLAG_HOME);updFlag(.016);placeAt(m,SPAWNS[0]);updFlag(.016);out.cap=[m.caps,flag.carrier,flagTile().join(',')];
    SETTINGS.mode='dm';return out;})()`);
  assert.strictEqual(r.n,4,'bandera es de hasta 4 combatientes');assert.ok(r.bases,'cada quien nace en su esquina');
  assert.ok(r.took,'no tomó la bandera');assert.strictEqual(r.slow,85,'el portador debe ir al 85 %');
  assert.strictEqual(r.drop.slice(0,3).join(','),'-1,3,1','la bandera debe quedar donde cayó');assert.strictEqual(r.drop[3],20);
  assert.strictEqual(r.still,'3,1','volvió antes de tiempo');assert.strictEqual(r.ret,'10,7','no volvió al centro a los 20 s');
  assert.strictEqual(r.cap.join('|'),'1|-1|10,7');
});
t('bandera: las IAs anotan en partidas simuladas y quien llega a las capturas gana',()=>{
  const r=run(`(()=>{const res=[];for(const k of ['bunker','jungle','arcade']){themeChoice=k;SETTINGS.mode='ctf';SETTINGS.pctf=1;startMatch();tut=null;
    for(let i=0;i<30*300&&state==='play';i++)update(1/30);
    res.push({caps:ents.reduce((a,e)=>a+e.caps,0),w:winner.caps,st:state});}SETTINGS.mode='dm';return res;})()`);
  assert.ok(r.every(x=>x.st==='over'));assert.ok(r.some(x=>x.w===3),'nadie llegó a 3 capturas: '+JSON.stringify(r));
});
t('bandera: al reaparecer vuelves a tu base y la IA que la lleva corre a la suya',()=>{
  const r=run(`(()=>{themeChoice='bunker';SETTINGS.mode='ctf';startMatch();tut=null;const a=ents[2];
    a.invulnT=0;kill(a,null);for(let i=0;i<200&&!a.alive;i++)update(1/30);const back=[a.tx,a.ty].join(',')===SPAWNS[2].join(',');
    placeAt(a,FLAG_HOME);updFlag(.016);const g=aiGoal(a);SETTINGS.mode='dm';return {back,g:g.join(','),b:SPAWNS[2].join(',')};})()`);
  assert.ok(r.back,'no reapareció en su base');assert.strictEqual(r.g,r.b);
});
t('arcade: los mapas miden 21 × 15, tienen borde, tú, extracción y todo es alcanzable',()=>{
  const r=run(`ARC_LEVELS.map((L,i)=>{const m=L.map;let P=null;const want=[];m.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='P')P=[x,y];if(/[EHBW]/.test(c)||ENEMY[c])want.push([x,y]);}));
    const seen=new Set([P+'']),q=[P];while(q.length){const [x,y]=q.shift();for(const d of DIRS){const nx=x+d.dx,ny=y+d.dy,c=(m[ny]||'')[nx];if(!c||c==='#'||c==='~')continue;const k=[nx,ny]+'';if(!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}
    return {i,size:m.length===15&&m.every(r=>r.length===21),border:m[0]==='#'.repeat(21)&&m[14]==='#'.repeat(21)&&m.every(r=>r[0]==='#'&&r[20]==='#'),
      P:!!P,E:m.join('').split('E').length===2,lost:want.filter(w=>!seen.has(w+'')).length,goal:['kill','waves','rescue','bombs'].includes(L.goal),txt:L.text.length===2};})`);
  for(const l of r){assert.ok(l.size&&l.border&&l.P&&l.E&&l.goal&&l.txt,'nivel '+(l.i+1)+': '+JSON.stringify(l));assert.strictEqual(l.lost,0,'nivel '+(l.i+1)+': hay cosas fuera de alcance');}
});
t('arcade: los aspectos del bando enemigo se dibujan completos y miden lo mismo',()=>{
  const r=run(`VSKINS.map(s=>{const pal=Object.assign({},SKIN_BASE,SKIN_PAL[s.p],GUN_PAL,{T:1,t:1,u:1});let bad=0;for(const f of ['down','up','right'])for(const w of ['pistol','smg','shotgun','rifle'])skinCells(s.k,f,0,w).forEach(r=>r.forEach(x=>{if(x&&!(x.ch in pal))bad++;}));
    const h=['down','right'].map(v=>{const g=SKIN_GRID[s.k][v],f=g.map((x,i)=>/[^.]/.test(x)?i:-1).filter(i=>i>=0);return f[f.length-1]-f[0]+1;});return {k:s.k,bad,h:h.join(),pl:SKIN_KEYS.includes(s.k)};})`);
  for(const v of r){assert.strictEqual(v.bad,0,v.k+': letras sin color');assert.strictEqual(v.h,'18,18',v.k+': altura distinta');assert.ok(!v.pl,v.k+' no debe poder elegirse');}
});
t('arcade: acabar con todos abre la extracción; al llegar suma bonos, estrellas y desbloquea el siguiente',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';diff=3;arcSave.open=1;arcSave.stars=[];startArcade(0);tut=null;ARC.cardT=0;const P=arcPlayer();
    const closed=!ARC.exitOpen;for(const e of ents.filter(e=>e.enemy)){e.invulnT=0;kill(e,P,'pistol');}update(1/30);
    const open=ARC.exitOpen,pts=ARC.score;placeAt(P,ARC.exit);update(1/30);
    const o={closed,open,pts,state,res:ARC.result,stars:ARC.tally.stars,score:ARC.score,openNext:arcSave.open,saved:arcSave.stars[0]};
    arcAgain();o.lv=ARC.lv;o.inv=P.inv===arcPlayer().inv;o.next=ARC.startScore===o.score;SETTINGS.mode='dm';return o;})()`);
  assert.ok(r.closed&&r.open,'la extracción no se abrió al acabar con todos');
  assert.ok(r.pts>=600,'puntos por las 6 bajas: '+r.pts);
  assert.strictEqual(r.state,'over');assert.strictEqual(r.res,'win');assert.strictEqual(r.stars,3);
  assert.ok(r.score>r.pts+2500,'faltan los bonos');assert.strictEqual(r.openNext,2);assert.strictEqual(r.saved,3);
  assert.strictEqual(r.lv,1,'no pasó al nivel 2');assert.ok(r.next,'los puntos no pasan al siguiente nivel');
});
t('arcade: combo por bajas seguidas, vida extra a los 10,000 y los enemigos no se hacen daño entre sí',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';diff=3;startArcade(0);tut=null;ARC.cardT=0;const P=arcPlayer(),E=ents.filter(e=>e.enemy);
    for(let i=0;i<3;i++){E[i].invulnT=0;kill(E[i],P,'pistol');}const combo=ARC.combo,pts=ARC.score;
    const l0=ARC.lives;arcAddScore(10000);const l1=ARC.lives,nl=ARC.nextLife;
    const a=E[3],b=E[4];b.invulnT=0;const hp=b.hp;bullets.push({x:b.x-12,y:b.y,vx:300,vy:0,owner:a,dmg:25,range:200,trav:0,crate:1,color:'#fff',checked:{},w:'pistol'});
    for(let i=0;i<6;i++)updBullets(1/60);SETTINGS.mode='dm';return {combo,pts,l0,l1,nl,hp,hp2:b.hp};})()`);
  assert.strictEqual(r.combo,3);assert.strictEqual(r.pts,100+200+300,'puntos con combo');
  assert.strictEqual(r.l1,r.l0+1,'no dio vida extra');assert.strictEqual(r.nl,35000);
  assert.strictEqual(r.hp2,r.hp,'un enemigo le hizo daño a otro');
});
t('arcade: al caer pierdes una vida y el nivel se reinicia; sin vidas, CONTINUAR deja los puntos en 0',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';diff=3;startArcade(0);tut=null;ARC.cardT=0;ARC.score=1234;ARC.startScore=1234;let P=arcPlayer();
    P.inv.smg=40;P.invulnT=0;kill(P,ents[1],'pistol');const lives=ARC.lives;for(let i=0;i<100;i++)update(1/30);
    P=arcPlayer();const o={lives,alive:P.alive,score:ARC.score,smg:P.inv.smg,enemies:ents.filter(e=>e.enemy&&e.alive).length};
    ARC.lives=1;ARC.cardT=0;P.invulnT=0;kill(P,ents[1],'pistol');for(let i=0;i<100;i++)update(1/30);o.state=state;o.res=ARC.result;
    arcAgain();o.after=[ARC.lives,ARC.score,ARC.cont,state].join();SETTINGS.mode='dm';return o;})()`);
  assert.strictEqual(r.lives,2);assert.ok(r.alive,'no reapareció');assert.strictEqual(r.score,1234);assert.strictEqual(r.smg,0,'debe volver con pistola');
  assert.strictEqual(r.enemies,6,'los enemigos no volvieron');assert.strictEqual(r.state,'over');assert.strictEqual(r.res,'lose');
  assert.strictEqual(r.after,'3,0,1,play');
});
t('arcade: oleadas, rehén y bombas',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';diff=3;const o={};arcSave.open=4;dirStack=[];for(const k in keys)keys[k]=false;
    startArcade(1);tut=null;ARC.cardT=0;const P=arcPlayer();P.invulnT=1e9;let waves=0;
    for(let k=0;k<20&&!ARC.exitOpen;k++){for(let i=0;i<120;i++)update(1/30);const E=ents.filter(e=>e.enemy&&e.alive);if(E.length)waves=Math.max(waves,ARC.waveI);for(const e of E){e.invulnT=0;kill(e,P,'pistol');}}
    o.waves=waves;o.open2=ARC.exitOpen;
    startArcade(2);tut=null;ARC.cardT=0;const P3=arcPlayer();P3.invulnT=1e9;for(const e of ents.filter(e=>e.enemy)){e.alive=false;e.out=true;}
    const h=ARC.hostage;o.closed3=!ARC.exitOpen;placeAt(P3,[h.tx-1,h.ty]);update(1/30);o.freed=ARC.freed&&ARC.exitOpen;
    placeAt(P3,ARC.exit);update(1/30);o.wait=state==='play'; // el rehén está lejos: hay que esperarlo
    placeAt(h,[ARC.exit[0],ARC.exit[1]-1]);update(1/30);o.done3=state==='over'&&ARC.result==='win';
    startArcade(3);tut=null;ARC.cardT=0;const P4=arcPlayer();P4.invulnT=1e9;for(const e of ents.filter(e=>e.enemy)){e.alive=false;e.out=true;}
    const b=ARC.bombs[0];placeAt(P4,[b.x,b.y]);for(let i=0;i<70;i++)update(1/30);o.def=b.done;o.open4=ARC.exitOpen;
    ARC.bombT=.01;P4.invulnT=0;for(let i=0;i<5;i++)update(1/30);o.boom=ARC.deadT>0&&ARC.lives===2;
    SETTINGS.mode='dm';return o;})()`);
  assert.strictEqual(r.waves,3,'no llegaron las 3 oleadas');assert.ok(r.open2,'la extracción no se abrió tras las oleadas');
  assert.ok(r.closed3&&r.freed,'el rehén no se liberó');assert.ok(r.wait,'terminó sin el rehén');assert.ok(r.done3,'no terminó con el rehén');
  assert.ok(r.def,'la bomba no se desactivó en 2 s');assert.ok(!r.open4,'se abrió con bombas activas');assert.ok(r.boom,'las bombas no explotaron al acabarse el tiempo');
});
t('arcade: en el menú, MODO ofrece ARCADE pero la sala en línea no',()=>{
  const r=run(`(()=>{SETTINGS.mode='lms';stepMode(1);const a=menuMode();SETTINGS.mode='lms';stepMode(1,2);const b=menuMode();SETTINGS.mode='dm';return a+','+b;})()`);
  assert.strictEqual(r,'arcade,dm');
});
console.log(`${ok} pruebas OK`);
