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
  assert.strictEqual(r.length,7);for(const s of r){assert.ok(s.v.every(Boolean),s.k+': tamaño incorrecto');assert.ok(s.h,s.k+': falta la mano');assert.ok(s.p,s.k+': falta la paleta');}
  // todos los aspectos, en todas las vistas, cuadros y armas, generan su dibujo sin letras desconocidas
  const bad=run(`(()=>{const out=[];for(const s of SKINS)for(const f of ['down','up','right'])for(const fr of [0,1,2])for(const w of ['pistol','smg','shotgun','rifle']){
    const pal=Object.assign({},SKIN_BASE,SKIN_PAL[s.p],GUN_PAL,{T:1,t:1,u:1});const c=skinCells(s.k,f,fr,w);
    c.forEach(r=>r.forEach(x=>{if(x&&!(x.ch in pal))out.push(s.k+f+x.ch);}));}return out;})()`);
  assert.strictEqual(bad.length,0,'letras sin color: '+[...bad].slice(0,5).join(', '));
});
t('las IAs y el jugador llevan un aspecto válido',()=>{
  const r=run(`(()=>{themeChoice='bunker';startMatch();return ents.map(e=>SKIN_KEYS.includes(e.skin));})()`);
  assert.ok(r.every(Boolean));
});
console.log(`${ok} pruebas OK`);
