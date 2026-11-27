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
  assert.strictEqual(r.length,8); // 7 aspectos de v0.12 y el CLÁSICO
  // todos miden lo mismo: 18 renglones del casco (o la boina, o la capucha) a las botas, de frente y de lado
  const alto=run(`SKINS.flatMap(s=>['down','right'].map(v=>{const g=SKIN_GRID[s.k][v],f=g.map((x,i)=>/[^.]/.test(x)?i:-1).filter(i=>i>=0);return s.k+'/'+v+':'+(f[f.length-1]-f[0]+1);}))`);
  for(const a of alto)assert.ok(a.endsWith(':18'),'altura distinta: '+a);for(const s of r){assert.ok(s.v.every(Boolean),s.k+': tamaño incorrecto');assert.ok(s.h,s.k+': falta la mano');assert.ok(s.p,s.k+': falta la paleta');}
  // todos los aspectos, en todas las vistas, cuadros y armas, generan su dibujo sin letras desconocidas
  const bad=run(`(()=>{const out=[];for(const s of SKINS)for(const f of ['down','up','right'])for(const fr of [0,1,2])for(const w of ['pistol','smg','shotgun','rifle']){
    const pal=Object.assign({},SKIN_BASE,SKIN_PAL[s.p],GUN_PAL,{T:1,t:1,u:1});const c=skinCells(s.k,f,fr,w);
    c.forEach(r=>r.forEach(x=>{if(x&&!(x.ch in pal))out.push(s.k+f+x.ch);}));}return out;})()`);
  assert.strictEqual(bad.length,0,'letras sin color: '+[...bad].slice(0,5).join(', '));
});
t('la punta del arma queda sobre el carril de la bala en las 4 vistas, todos los aspectos y 4 armas',()=>{
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
  const r=run(`ARC_LEVELS.map((L,i)=>{const m=L.map;let P=null;const want=[];m.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='P')P=[x,y];if(/[EHBWXR$]/.test(c)||ENEMY[c])want.push([x,y]);}));
    const seen=new Set([P+'']),q=[P];while(q.length){const [x,y]=q.shift();for(const d of DIRS){const nx=THEMES[L.theme].wrap?(x+d.dx+21)%21:x+d.dx,ny=y+d.dy,c=(m[ny]||'')[nx];if(!c||c==='#'||c==='~')continue;const k=[nx,ny]+'';if(!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}
    return {i,size:m.length===15&&m.every(r=>r.length===21),border:m[0]==='#'.repeat(21)&&m[14]==='#'.repeat(21)&&m.every((r,y)=>(r[0]==='#'&&r[20]==='#')||(THEMES[L.theme].wrap&&r[0]!=='#'&&r[20]!=='#')),
      P:!!P,E:m.join('').split('E').length===2,lost:want.filter(w=>!seen.has(w+'')).length,goal:['kill','waves','rescue','bombs','boss','coins','escape','intel','case'].includes(L.goal),txt:L.text.length===2};})`);
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
t('arcade: al caer reapareces en el mismo lugar y el nivel sigue; sin vidas, CONTINUE? 9… y luego GAME OVER',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';diff=3;dirStack=[];for(const k in keys)keys[k]=false;startArcade(0);tut=null;ARC.cardT=0;let P=arcPlayer();
    const E=ents.filter(e=>e.enemy);E[0].invulnT=0;kill(E[0],P,'pistol');const sc=ARC.score;
    placeAt(P,[5,9]);P.inv.smg=40;P.invulnT=0;kill(P,E[1],'pistol');const lives=ARC.lives;for(let i=0;i<60;i++)update(1/30);
    P=arcPlayer();const o={lives,alive:P.alive,at:P.tx+','+P.ty,score:ARC.score===sc,smg:P.inv.smg,frag:P.inv.frag,inv:P.invulnT>0,dead0:!E[0].alive,same:arcPlayer()===P&&ents.length===7};
    ARC.lives=1;P.invulnT=0;kill(P,E[1],'pistol');for(let i=0;i<60;i++)update(1/30);o.res=ARC.result;o.n=Math.floor(ARC.contT);
    arcContTick(4);o.n2=Math.floor(ARC.contT);arcAgain();P=arcPlayer();
    o.cont=[state,ARC.lives,ARC.score,ARC.cont,P.alive,!E[0].alive].join();
    ARC.lives=1;P.invulnT=0;kill(P,E[1],'pistol');for(let i=0;i<60;i++)update(1/30);arcContTick(11);o.over=ARC.result;
    arcAgain();o.retry=[state,ARC.end&&ARC.end.phase].join();
    SETTINGS.mode='dm';return o;})()`);
  assert.strictEqual(r.lives,2);assert.ok(r.alive,'no reapareció');{const [x,y]=r.at.split(',').map(Number);assert.ok(Math.abs(x-5)+Math.abs(y-9)<=1,'no reapareció donde cayó: '+r.at);} // o en la casilla de al lado si un enemigo la ocupa
  assert.ok(r.score,'perdió los puntos al caer');assert.strictEqual(r.smg,0,'debe volver con pistola');assert.strictEqual(r.frag,1);assert.ok(r.inv,'sin invencibilidad al reaparecer');
  assert.ok(r.dead0&&r.same,'el nivel se reinició al caer');
  assert.strictEqual(r.res,'cont');assert.strictEqual(r.n,9,'la cuenta debe empezar en 9');assert.strictEqual(r.n2,5);
  assert.strictEqual(r.cont,'play,3,0,1,true,true','CONTINUAR debe seguir donde ibas con 3 vidas y 0 puntos');
  assert.strictEqual(r.over,'lose','al llegar a 0 debe ser GAME OVER');assert.ok(/^over,(ini|board)$/.test(r.retry),'tras el GAME OVER no se reintenta: '+r.retry);
});
t('arcade: botiquines según la dificultad y solo para ti',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';dirStack=[];for(const k in keys)keys[k]=false;const o={};
    for(const d of [1,3,4]){diff=d;startArcade(0);tut=null;ARC.cardT=0;const P=arcPlayer();P.invulnT=1e9;for(const e of ents.filter(e=>e.enemy)){e.alive=false;e.out=true;}
      placeAt(P,[1,13]);let n=0;for(let i=0;i<30*60;i++){update(1/30);n=Math.max(n,pickups.filter(p=>p.type==='medkit').length);}o[d]=n;}
    diff=3;startArcade(0);tut=null;ARC.cardT=0;const e=ents.find(e=>e.enemy);e.hp=20;pickups.push({tx:e.tx,ty:e.ty,type:'medkit',amt:40,t:0});updPickups(1/30);o.enemy=e.hp;
    SETTINGS.mode='dm';return o;})()`);
  assert.ok(r[1]>=3,'muy fácil: pocos botiquines '+r[1]);assert.strictEqual(r[3],1);assert.strictEqual(r[4],1,'difícil: máximo 1');
  assert.strictEqual(r.enemy,20,'un enemigo se curó con un botiquín');
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
t('arcade: la tarjeta de misión espera a que confirmes y no la salta una tecla que ya venía presionada',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';diff=3;dirStack=[];for(const k in keys)keys[k]=false;keys.Enter=true; // ENTER del nivel anterior, todavía presionado
    startArcade(0);tut=null;for(let i=0;i<30*15;i++)update(1/30);const held=ARC.cardT>0&&ARC.t===0;
    keys.Enter=false;update(1/30);keys.Space=true;update(1/30);const go=ARC.cardT===0;keys.Space=false;
    for(let i=0;i<30;i++)update(1/30);const o={held,go,t:ARC.t>0};SETTINGS.mode='dm';return o;})()`);
  assert.ok(r.held,'la tarjeta se quitó sola o con la tecla que venía presionada');assert.ok(r.go,'ESPACIO no confirmó');assert.ok(r.t,'el nivel no empezó');
});
t('IAs: nunca dos soldados en la misma casilla, buscan posición de tiro y no se te pegan',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';diff=3;dirStack=[];for(const k in keys)keys[k]=false;arcSave.open=4;
    startArcade(1);tut=null;ARC.cardT=0;const P=arcPlayer();let stack=0,near=0,far=0,shots=0;
    for(let i=0;i<30*40;i++){P.invulnT=0;P.hp=100;update(1/30);if(ARC.deadT>0){ARC.deadT=0;}
      const E=arcAlive(),m={};for(const e of E){const k=e.tx+','+e.ty;m[k]=(m[k]||0)+1;if(!e.moving&&Object.keys(e.ai.known).length){const d=Math.abs(e.tx-P.tx)+Math.abs(e.ty-P.ty);if(d<=1)near++;else far++;}}
      for(const k in m)if(m[k]>1)stack++;if(E.some(e=>e.tx===P.tx&&e.ty===P.ty))stack+=100;}
    shots=ents.filter(e=>e.enemy).reduce((a,e)=>a+(e.st?e.st.shots:0),0);
    SETTINGS.mode='dm';themeChoice='bunker';startMatch();tut=null;let dm=0;
    for(let i=0;i<30*60&&state==='play';i++){update(1/30);const n={};for(const e of ents)if(e.alive){const k=e.tx+','+e.ty;n[k]=(n[k]||0)+1;}for(const k in n)if(n[k]>1)dm++;}
    return {stack,near,far,shots,dm,frags:ents.reduce((a,e)=>a+e.frags,0),arc:ARC===null};})()`);
  assert.strictEqual(r.stack,0,'hubo soldados encimados en Arcade');assert.strictEqual(r.dm,0,'hubo soldados encimados en deathmatch');
  assert.ok(r.far>r.near*2,`demasiado tiempo pegados a ti: ${r.near} cerca contra ${r.far} a distancia`);
  assert.ok(r.frags>=3,'las IAs de deathmatch dejaron de pelear');assert.ok(r.arc,'el Arcade siguió activo en una partida normal');
});
t('arcade: la presión sube por nivel; en Cargas custodian las bombas y desactivar da la alarma; flanquean por otro lado',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';diff=3;dirStack=[];for(const k in keys)keys[k]=false;arcSave.open=4;const o={};
    o.react=[0,3].map(l=>arcPress(l).react);o.alert=[0,3].map(l=>arcPress(l).alert);
    startArcade(3);tut=null;ARC.cardT=0;const P=arcPlayer();P.invulnT=1e9;const E=ents.filter(e=>e.enemy);
    o.guard=E.every(e=>ARC.bombs.some(b=>b.x===e.home[0]&&b.y===e.home[1]));
    for(const e of E)e.ai.known={};const b=ARC.bombs[2];placeAt(P,[b.x,b.y]);update(1/30);o.alarm=E.every(e=>!!e.ai.known[0]);
    // flanqueo: si un compañero ya cubre un lado, el siguiente elige otro
    startArcade(1);tut=null;ARC.cardT=0;const Q=arcPlayer();placeAt(Q,[10,5]);const a=arcEnemy('a',ents.length);ents.push(a);arcPlace(a,10,9);
    const c=arcEnemy('a',ents.length);ents.push(c);arcPlace(c,10,10);
    const fa=firePos(a,10,5,2,3);a.ai.fpos=fa;const fc=firePos(c,10,5,2,3);
    o.sides=[Math.sign(fa[0]-10)+','+Math.sign(fa[1]-5),Math.sign(fc[0]-10)+','+Math.sign(fc[1]-5)];
    SETTINGS.mode='dm';return o;})()`);
  assert.ok(r.react[1]<r.react[0],'no reaccionan más rápido en niveles altos');assert.ok(r.alert[1]>r.alert[0]);
  assert.ok(r.guard,'en Cargas no custodian las bombas');assert.ok(r.alarm,'desactivar no dio la alarma');
  assert.notStrictEqual(r.sides[0],r.sides[1],'los dos eligieron el mismo lado: '+r.sides.join(' / '));
});
t('arcade: al liberar al rehén suena la alarma, emboscan la extracción y llegan refuerzos; la pantalla final muestra la dificultad',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';diff=4;dirStack=[];for(const k in keys)keys[k]=false;arcSave.open=4;
    startArcade(2);tut=null;ARC.cardT=0;const P=arcPlayer();P.invulnT=1e9;const n0=ents.filter(e=>e.enemy).length;const h=ARC.hostage;
    placeAt(P,[h.tx-1,h.ty]);update(1/30);const E=arcAlive(),X=ARC.exit;
    const o={more:ents.filter(e=>e.enemy).length-n0,ambush:E.filter(e=>e.home&&e.home[0]===X[0]&&e.home[1]===X[1]).length,hunt:E.filter(e=>e.ai.known[0]).length,label:arcDiffLabel()};
    SETTINGS.mode='dm';diff=3;return o;})()`);
  assert.strictEqual(r.more,2,'no llegaron refuerzos');assert.ok(r.ambush>=3,'nadie embosca la extracción');assert.ok(r.hunt>=1,'nadie te persigue tras la alarma');
  assert.strictEqual(r.label,'DIFICULTAD DIFÍCIL · PUNTOS ×1.5');
});
t('arcade: nivel 1 se reagrupan a la mitad; nivel 2 entran por la puerta más lejana, la última oleada por todas y crece con la dificultad',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';dirStack=[];for(const k in keys)keys[k]=false;arcSave.open=4;const o={};
    diff=3;startArcade(0);tut=null;ARC.cardT=0;let P=arcPlayer();P.invulnT=1e9;const E=ents.filter(e=>e.enemy);for(const e of E)e.ai.known={};
    for(let i=0;i<2;i++){E[i].invulnT=0;kill(E[i],P,'pistol');}update(1/30);o.before=!ARC.regroup;E[2].invulnT=0;kill(E[2],P,'pistol');update(1/30);
    o.regroup=ARC.regroup&&arcAlive().every(e=>!!e.ai.known[0]);
    for(const d of [2,3,4]){diff=d;startArcade(1);tut=null;ARC.cardT=0;o['last'+d]=ARC.waves[2].length;}
    diff=3;startArcade(1);tut=null;ARC.cardT=0;P=arcPlayer();P.invulnT=1e9;placeAt(P,[2,2]);ARC.waveT=0;update(1/30);
    const far=ARC.spawns.slice().sort((a,b)=>(Math.abs(b[0]-2)+Math.abs(b[1]-2))-(Math.abs(a[0]-2)+Math.abs(a[1]-2)))[0];
    o.far=arcAlive().every(e=>Math.abs(e.tx-far[0])+Math.abs(e.ty-far[1])<=3);
    for(const e of arcAlive()){e.alive=false;e.out=true;}ARC.waveI=2;ARC.waveT=0;update(1/30);
    o.doors=new Set(arcAlive().map(e=>ARC.spawns.findIndex(s=>Math.abs(s[0]-e.tx)+Math.abs(s[1]-e.ty)<=3))).size;
    SETTINGS.mode='dm';return o;})()`);
  assert.ok(r.before&&r.regroup,'no se reagruparon al caer la mitad');
  assert.strictEqual(r.last2,4);assert.strictEqual(r.last3,5);assert.strictEqual(r.last4,6);
  assert.ok(r.far,'la oleada no entró por la puerta más lejana');assert.strictEqual(r.doors,3,'la última oleada no entró por las 3 puertas');
});
t('arcade 5–10: escudo, armadura, granada en arco, láser, fichas, ALERTA ROJA, lava, planos, maletín y fases del jefe',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';dirStack=[];for(const k in keys)keys[k]=false;arcSave.open=10;diff=3;const o={};
    const lv=i=>{startArcade(i);tut=null;ARC.cardT=0;const P=arcPlayer();P.invulnT=1e9;return P;};
    // escudo: de frente no le pasa nada, por la espalda sí
    let P=lv(8);const k=ents.find(e=>e.etype==='k');k.invulnT=0;placeAt(k,[10,9]);k.dir=DIRS[3];const h0=k.hp;
    const shot=(vx)=>{bullets.push({x:k.x+(vx>0?-14:14),y:k.y,vx,vy:0,owner:P,dmg:25,range:300,trav:0,crate:1,color:'#fff',checked:{},w:'pistol'});for(let i=0;i<8;i++)updBullets(1/60);};
    shot(300);o.front=k.hp===h0;shot(-300);o.back=k.hp<h0; // mira a la izquierda: la bala que viene de la izquierda le pega al escudo
    // armadura del Comandante: de frente 1/4, por la espalda 1.5×
    P=lv(9);const C=ARC.boss;C.invulnT=0;C.dir=DIRS[2];placeAt(P,[C.tx,C.ty+3]);const c0=C.hp;damage(C,40,P,'rifle');o.armorF=c0-C.hp;placeAt(P,[C.tx,C.ty-1]);const c1=C.hp;damage(C,40,P,'rifle');o.armorB=c1-C.hp;
    o.scale=C.scale===1.5&&C.rad>11;
    // fases
    C.hp=C.maxHp*.6;update(1/30);o.p2=ARC.phase;C.hp=C.maxHp*.3;update(1/30);o.p3=ARC.phase===3&&C.armorWeak;
    for(let i=0;i<30*2;i++)update(1/30);o.reinf=arcAlive().filter(e=>e.etype==='r').length;
    C.hp=1;C.invulnT=0;damage(C,50,P,'rifle');update(1/30);o.bossDown=ARC.exitOpen;
    // granada en arco: pasa por encima del muro
    P=lv(6);const g=ents.find(e=>e.etype==='g');for(const e of arcAlive())if(e!==g){e.alive=false;e.out=true;}
    placeAt(g,[5,5]);placeAt(P,[5,3]);reveal(g.ai,P,true);g.lobT=0;g.blindT=0;arcTickExtra(1/30,ARC_LEVELS[6],P);o.lob=nades.some(n=>n.lob);
    // lava: avanza, mata y la salida está abierta desde el inicio
    o.escOpen=ARC.exitOpen;ARC.lavaT=0;arcTickExtra(1/30,ARC_LEVELS[6],P);o.lava=tile(1,1)===LAVA&&ARC.lavaX===1;
    // fichas y ALERTA ROJA
    P=lv(5);const L6=ARC_LEVELS[5];const coin=[...ARC.coins][0];placeAt(P,[coin%COLS,(coin/COLS)|0]);arcTickExtra(1/30,L6,P);o.coin=ARC.coinsGot===1;
    const R=ARC.reds[0];placeAt(P,[R.x,R.y]);arcTickExtra(1/30,L6,P);o.red=ARC.redT>5;const e6=arcAlive()[0];e6.invulnT=0;const h6=e6.hp;damage(e6,10,P,'pistol');o.triple=h6-e6.hp===30;
    o.flee=JSON.stringify(aiGoal(e6))===JSON.stringify(arcFlee(e6));ARC.coinsGot=39;const c2=[...ARC.coins][0];placeAt(P,[c2%COLS,(c2/COLS)|0]);arcTickExtra(1/30,L6,P);o.coinsOpen=ARC.exitOpen;
    // planos: bono si no te vieron
    P=lv(7);for(const e of arcAlive())e.ai.known={};placeAt(P,[ARC.item.x,ARC.item.y]);arcTickExtra(1/30,ARC_LEVELS[7],P);o.intel=ARC.item.taken&&ARC.exitOpen&&!ARC.spotted;
    placeAt(P,ARC.exit);update(1/30);o.stealth=ARC.tally&&ARC.tally.stealth>0;
    // maletín: alarma y refuerzos
    P=lv(8);const n0=ents.length;for(const e of arcAlive())e.ai.known={};placeAt(P,[ARC.item.x,ARC.item.y]);arcTickExtra(1/30,ARC_LEVELS[8],P);
    o.caseReinf=ents.length-n0;o.caseAlarm=arcAlive().every(e=>!!e.ai.known[0]);
    // tirador: apunta al menos 0.65 s con el láser
    P=lv(4);const t=ents.find(e=>e.etype==='t');placeAt(t,[1,12]);placeAt(P,[1,8]);t.dir=DIRS[0];t.ai.seeId=-1;for(const e of arcAlive())if(e!==t){e.alive=false;e.out=true;}
    P.invulnT=0;updAI(t,1/30);o.laser=t.ai.seeId===0&&t.ai.reaction>=.6;
    SETTINGS.mode='dm';return o;})()`);
  assert.ok(r.front,'el escudo no detuvo la bala de frente');assert.ok(r.back,'por la espalda debe recibir daño');
  assert.strictEqual(r.armorF,10,'de frente debe recibir 1/4');assert.strictEqual(r.armorB,60,'por la espalda debe recibir 1.5×');assert.ok(r.scale);
  assert.strictEqual(r.p2,2);assert.ok(r.p3,'no llegó a la fase 3');assert.ok(r.reinf>=2,'no llegaron refuerzos en la fase 2');assert.ok(r.bossDown,'vencer al jefe no abrió la extracción');
  assert.ok(r.lob,'el granadero no lanzó en arco');assert.ok(r.escOpen,'en la huida la salida debe estar abierta');assert.ok(r.lava,'la lava no avanzó');
  assert.ok(r.coin&&r.red&&r.triple&&r.flee,'fichas o ALERTA ROJA: '+JSON.stringify(r));assert.ok(r.coinsOpen,'40 fichas no abrieron la extracción');
  assert.ok(r.intel&&r.stealth,'planos o bono sin ser visto');assert.strictEqual(r.caseReinf,3,'el maletín no trajo refuerzos');assert.ok(r.caseAlarm);
  assert.ok(r.laser,'el tirador disparó sin apuntar');
});
t('arcade: el GAME OVER registra el mejor crédito y el nivel máximo; iniciales, tabla y de vuelta al inicio',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';dirStack=[];for(const k in keys)keys[k]=false;arcSave.open=10;diff=3;const o={};
    arcSave.best=[{i:'AAA',s:20000,lv:2,d:3,t:1},{i:'BBB',s:5000,lv:6,d:3,t:2}];arcSave.recent=[];arcSave.ini='CGR';
    startArcade(4);tut=null;ARC.cardT=0;ARC.score=18450;ARC.lives=0;arcGameOver();arcAgain(); // continúa: los puntos vuelven a 0
    o.zero=ARC.score;ARC.lv=5;arcLoad();ARC.score=6200;ARC.lives=0;arcGameOver();arcContTick(11);
    o.res=ARC.result;o.sum=ARC.end.phase+':'+ARC.end.s+':'+ARC.end.lv+':'+ARC.end.c;
    arcEndTick(2.1);o.ini=ARC.end.phase+':'+ARC.hs.ch.join('');
    arcEndKey('ArrowUp');arcEndKey('Space');arcEndKey('KeyX');arcEndKey('Space');o.rank=arcRankOf({s:18450,lv:6,t:1e15});
    o.board=ARC.end.phase;o.best=arcSave.best.map(b=>b.i+b.s+'/'+b.lv+'/'+(b.c===undefined?'-':b.c)).join(' ');o.rec=arcSave.recent.map(b=>b.i+b.s+'#'+b.rank).join(' ');o.ini2=arcSave.ini;
    arcEndKey('Enter');o.locked=state;arcEndTick(15);o.home=state;
    // empate: el que llegó más lejos va primero
    startArcade(0);ARC.score=5000;ARC.runLv=7;arcAskRecord();arcSaveRecord('TIE');o.tie=arcSave.best.map(b=>b.i).join(',');
    // no entra al top 10: va a RECIENTES con las últimas iniciales y la tabla abre en RECIENTES
    arcSave.best=Array.from({length:10},(_,k)=>({i:'ZZZ',s:90000-k,lv:9,d:3,t:k}));startArcade(0);ARC.score=10;ARC.lives=0;arcGameOver();arcContTick(11);arcEndTick(2.1);
    o.noTop=ARC.end.phase+':'+ARC.end.tab+':'+arcSave.recent[0].i+arcSave.recent[0].s+'#'+arcSave.recent[0].rank;
    // a los 30 s se guardan solas
    arcSave.best=[];startArcade(0);ARC.score=700;ARC.lives=0;arcGameOver();arcContTick(11);arcEndTick(2.1);arcEndTick(31);o.auto=ARC.end.phase+':'+arcSave.best[0].i+arcSave.best[0].s;
    // salir al menú durante el CONTINUE registra la partida
    arcSave.best=[];startArcade(0);ARC.score=900;ARC.lives=0;arcGameOver();toTitle();o.leave=arcSave.best.length?arcSave.best[0].i+arcSave.best[0].s:'nada';o.leaveState=state;
    SETTINGS.mode='dm';return o;})()`);
  assert.strictEqual(r.zero,0);assert.strictEqual(r.res,'lose');
  assert.strictEqual(r.sum,'sum:18450:6:1','se debe registrar el mejor crédito (18,450), el nivel máximo y los continues');
  assert.strictEqual(r.ini,'ini:CGR','las iniciales empiezan con las últimas usadas');
  assert.strictEqual(r.board,'board');assert.strictEqual(r.ini2,'DXR','▲ cambia la letra y escribir también funciona');
  assert.strictEqual(r.best,'AAA20000/2/- DXR18450/6/1 BBB5000/6/-');assert.strictEqual(r.rec,'DXR18450#1');
  assert.strictEqual(r.locked,'over','un FUEGO de más no debe saltar la tabla');assert.strictEqual(r.home,'title','a los 15 s vuelve al inicio');
  assert.ok(r.tie.startsWith('AAA,DXR,TIE,BBB'),'en empate va primero el que llegó más lejos: '+r.tie);
  assert.strictEqual(r.noTop,'board:recent:TIE10#-1');assert.strictEqual(r.auto,'board:TIE700');
  assert.strictEqual(r.leave,'TIE900');assert.strictEqual(r.leaveState,'title');
});
t('arcade: prisioneros, rehén en DIFÍCIL, refuerzos de bombas, récords y premios',()=>{
  const r=run(`(()=>{SETTINGS.mode='arcade';dirStack=[];for(const k in keys)keys[k]=false;arcSave.open=10;diff=3;const o={};
    startArcade(0);tut=null;ARC.cardT=0;let P=arcPlayer();P.invulnT=1e9;const w=ARC.pows[0];placeAt(P,[w.x,w.y]);arcTickExtra(1/30,ARC_LEVELS[0],P);
    o.pow=ARC.powsN===1&&pickups.length>=1;P.invulnT=0;kill(P,ents[1],'pistol');for(let i=0;i<60;i++)update(1/30);o.keep=ARC.powsN===1;
    ARC.lives=1;P=arcPlayer();P.invulnT=0;kill(P,ents[1],'pistol');for(let i=0;i<60;i++)update(1/30);arcAgain();o.lost=ARC.powsN===0;
    diff=4;startArcade(2);tut=null;ARC.cardT=0;ARC.freed=true;o.hunt=arcHuntHostage();diff=3;startArcade(2);ARC.freed=true;o.noHunt=!arcHuntHostage();
    startArcade(3);tut=null;ARC.cardT=0;P=arcPlayer();P.invulnT=1e9;const n0=ents.length;ARC.bombT=29;arcTickExtra(1/30,ARC_LEVELS[3],P);o.bombReinf=ents.length-n0;
    arcSave.best=[];ARC.score=5000;arcAskRecord();o.ask=!!(ARC.hs&&ARC.hs.pending);arcSaveRecord('cgr');o.rec=arcSave.best[0].i+':'+arcSave.best[0].s;
    arcSave.cmd=false;arcSave.gold=false;arcSave.stars=[3,3,3,3,3,3,3,3,3,2];startArcade(9);tut=null;ARC.cardT=0;P=arcPlayer();ARC.exitOpen=true;placeAt(P,ARC.exit);update(1/30);
    o.rewards=(ARC.rewards||[]).join('|');o.skins=mySkins().includes('commander');
    SETTINGS.mode='dm';return o;})()`);
  assert.ok(r.pow,'el prisionero no dio objeto');assert.ok(r.keep,'al caer no debe perder los prisioneros');assert.ok(r.lost,'al continuar debe perderlos');
  assert.ok(r.hunt&&r.noHunt,'el rehén solo es blanco en DIFÍCIL');assert.strictEqual(r.bombReinf,2,'no llegaron refuerzos a la bomba');
  assert.ok(r.ask);assert.strictEqual(r.rec,'CGR:5000');
  assert.ok(r.rewards.includes('ASPECTO COMANDANTE')&&r.rewards.includes('COLOR DORADO'),'premios: '+r.rewards);assert.ok(r.skins,'COMANDANTE no aparece entre tus aspectos');
});
console.log(`${ok} pruebas OK`);
