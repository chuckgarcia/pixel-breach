// Partidas en línea reales entre navegadores (Chromium) con un servidor de PeerJS local.
const assert=require('assert'),http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');const {PeerServer}=require('peer');
const ROOT=path.join(__dirname,'..');
const LIB=fs.readFileSync(require.resolve('peerjs/dist/peerjs.min.js'),'utf8');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
function serve(){return new Promise(ok=>{const s=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(0,'127.0.0.1',()=>ok(s));});}
(async()=>{
  const web=await serve(),PPORT=9000+Math.floor(Math.random()*500);
  const ps=PeerServer({port:PPORT,host:'127.0.0.1',path:'/'});
  const URL=`http://127.0.0.1:${web.address().port}/index.html?ps=127.0.0.1:${PPORT}`;
  const browser=await chromium.launch({args:['--disable-features=WebRtcHideLocalIpsWithMdns'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  const errors=[];let ok=0;
  const t=async(name,fn)=>{await fn();ok++;console.log('  ✓',name);};
  async function page(name,opts){const ctx=await browser.newContext(opts||{viewport:{width:900,height:760}});const pg=await ctx.newPage();
    pg.on('pageerror',e=>errors.push(name+': '+e.message));await pg.route('https://unpkg.com/**',r=>r.fulfill({body:LIB,contentType:'text/javascript'}));return pg;}
  console.log('Pruebas en línea');
  try{
    const A=await page('anfitrión');await A.goto(URL);await A.waitForTimeout(300);await A.evaluate("state==='intro'&&endIntro()");
    await A.fill('#pname','CARLOS');await A.click('#mkRoom');await A.waitForFunction("state==='lobby'");const code=await A.evaluate('NET.code');
    const B=await page('invitado');
    await t('el invitado entra solo con su nombre desde el enlace',async()=>{
      await B.goto(URL+'#'+code);await B.waitForTimeout(300);assert.ok(await B.isVisible('#joinInvite'));
      await B.fill('#pname','LUIS');await B.click('#joinInvite');await B.waitForFunction("state==='lobby'",null,{timeout:15000});});
    await t('en celular, la sala ocupa la pantalla y EMPEZAR/SALIR se ven sin desplazarse',async()=>{
      const M=await page('celular',{viewport:{width:844,height:390},isMobile:true,hasTouch:true});await M.goto(URL+'#'+code);await M.waitForTimeout(300);
      await M.tap('#joinInvite');await M.waitForFunction("state==='lobby'",null,{timeout:15000});
      const b=await M.locator('#lpv').boundingBox();assert.ok(!b||(b.width<80&&b.height<100),`#lpv mide ${b&&Math.round(b.width)}x${b&&Math.round(b.height)}`);
      assert.ok(!(await M.isVisible('#pad')),'la cruceta no debe verse en la sala');
      const lv=await M.locator('#lleave').boundingBox();assert.ok(lv&&lv.y+lv.height<=390,'SALIR fuera de la vista');
      await M.evaluate('netLeave()');await M.context().close();});
    for(const [w,h] of [[390,844],[844,390],[375,667]])await t(`en celular ${w}×${h}, el menú usa la pantalla y JUGAR se ve sin desplazarse`,async()=>{
      const M=await page('celular menú',{viewport:{width:w,height:h},isMobile:true,hasTouch:true});await M.goto(URL);await M.waitForTimeout(300);await M.evaluate("state==='intro'&&endIntro()");
      await M.waitForFunction("getComputedStyle(document.getElementById('menu')).display!=='none'",null,{timeout:5000});
      const b=await M.locator('#pv').boundingBox();assert.ok(b&&b.width<130,`#pv mide ${b&&Math.round(b.width)}`);
      assert.ok(!(await M.isVisible('#pad'))&&!(await M.isVisible('#btns')),'los controles no deben verse en el menú');
      for(const id of ['playAI','mkRoom','joinOpen']){const r=await M.locator('#'+id).boundingBox();assert.ok(r&&r.y>=0&&r.y+r.height<=h,`#${id} fuera de la vista`);}
      await M.close();await M.context().close();});
    await t('«¿Cómo se juega?» se abre como panel completo y se cierra',async()=>{
      const M=await page('guía',{viewport:{width:1440,height:900}});await M.goto(URL);await M.waitForTimeout(300);await M.evaluate("state==='intro'&&endIntro()");
      await M.click('#howtoBox summary');const r=await M.locator('#howtoBox').boundingBox();
      assert.ok(r&&r.x>=0&&r.x+r.width<=1440&&r.y>=0&&r.y+r.height<=900,'el panel se sale de la pantalla');
      const h=await M.locator('#howto').boundingBox();assert.ok(h.x>=r.x,'el texto se corta a la izquierda');
      await M.click('#howtoBox summary');assert.ok(!(await M.evaluate("document.getElementById('howtoBox').open")));await M.context().close();});
    for(const [w,h,mob] of [[1200,950,false],[390,844,true],[844,390,true]])await t(`la guía no tapa al soldado (${w}×${h}) y se puede saltar`,async()=>{
      const M=await page('guía partida',{viewport:{width:w,height:h},isMobile:mob,hasTouch:mob});await M.goto(URL.replace(/\?ps=[^#]*/,''));await M.waitForTimeout(300);
      await M.evaluate("document.body.classList.add('portrait-ok');localStorage.removeItem('pb_tut');state==='intro'&&endIntro();themeChoice='bunker';startMatch()");await M.waitForTimeout(400);
      // el soldado, en coordenadas de la página
      const sold=await M.evaluate("(()=>{const r=document.getElementById('c').getBoundingClientRect(),k=r.width/672,m=me();return {x:r.left+(m.x-18)*k,y:r.top+(m.y-30)*k,w:36*k,h:44*k,k,top:r.top,left:r.left};})()");
      const outside=await M.evaluate('guideOutside()');let g;
      if(outside){g=await M.locator('#guide').boundingBox();assert.ok(g,'la guía no se ve');}
      else{const b=await M.evaluate('tutBox');assert.ok(b,'no hay guía en el mapa');g={x:sold.left+b.x*sold.k,y:sold.top+b.y*sold.k,width:b.w*sold.k,height:b.h*sold.k};}
      const hit=!(g.x+g.width<sold.x||sold.x+sold.w<g.x||g.y+g.height<sold.y||sold.y+sold.h<g.y);assert.ok(!hit,'la guía tapa al soldado');
      assert.ok(await M.evaluate("JSON.stringify(ents.slice(1).map(e=>[e.x,e.y]))")===await (async()=>{await M.waitForTimeout(500);return M.evaluate("JSON.stringify(ents.slice(1).map(e=>[e.x,e.y]))");})(),'las IAs deben esperar tu primer paso');
      if(outside)await M.click('#guideSkip');else await M.keyboard.press('Escape');
      assert.ok(await M.evaluate('tut===null'),'no se saltó la guía');await M.context().close();});
    await t('en pausa se puede continuar o salir al menú (con confirmación)',async()=>{
      const M=await page('pausa');await M.goto(URL.replace(/\?ps=[^#]*/,''));await M.waitForTimeout(300);
      await M.evaluate("localStorage.setItem('pb_tut','1');state==='intro'&&endIntro();startMatch()");await M.waitForTimeout(200);
      await M.keyboard.press('KeyP');await M.waitForFunction("getComputedStyle(document.getElementById('pauseBtns')).display==='flex'");
      await M.click('#pResume');assert.strictEqual(await M.evaluate('paused'),false);
      await M.keyboard.press('KeyP');await M.click('#pQuit');assert.strictEqual(await M.evaluate('state'),'play','debe pedir confirmación');
      await M.click('#pQuit');assert.strictEqual(await M.evaluate('state'),'title');await M.context().close();});
    await t('MODO ARCADE: el nivel reemplaza a escenario y partida, sin salas, y JUGAR empieza el nivel',async()=>{
      for(const [w,h,mob] of [[1200,900,false],[375,667,true]]){
        const M=await page('arcade',{viewport:{width:w,height:h},isMobile:mob,hasTouch:mob});await M.goto(URL);await M.waitForTimeout(300);await M.evaluate("state==='intro'&&endIntro()");
        while((await M.evaluate('menuMode()'))!=='arcade')await M.click('#mnext');
        assert.ok(await M.isVisible('#levelRow'),'no se ve NIVEL');for(const id of ['themeRow','presetRow','mkRoom'])assert.ok(!(await M.isVisible('#'+id)),id+' debería ocultarse');
        assert.strictEqual(await M.innerText('#playAI'),'JUGAR NIVEL 1');
        const r=await M.locator('#playAI').boundingBox();assert.ok(r&&r.y+r.height<=h,'JUGAR fuera de la vista');
        await M.click('#playAI');assert.ok(await M.evaluate("!!ARC&&ARC.lv===0&&state==='play'"));
        await M.evaluate("localStorage.setItem('pb_settings',JSON.stringify(Object.assign(SETTINGS,{mode:'dm'})))");await M.context().close();}});
    await t('el color se cambia con ◀ ▶ y el soldado lo usa',async()=>{
      const M=await page('color');await M.goto(URL);await M.waitForTimeout(300);await M.evaluate("state==='intro'&&endIntro()");
      const c0=await M.evaluate('playerColor');await M.click('#cnext');const c1=await M.evaluate('playerColor');assert.notStrictEqual(c0,c1);
      assert.strictEqual(await M.evaluate("PALETTE.find(p=>p[1]===playerColor)[0]"),await M.innerText('#cname span'));
      await M.click('#cprev');assert.strictEqual(await M.evaluate('playerColor'),c0);
      for(let i=0;i<12;i++)await M.click('#cnext');assert.strictEqual(await M.evaluate('playerColor'),c0,'da la vuelta a la paleta');
      await M.context().close();});
    await t('la sala del invitado se actualiza cuando el anfitrión cambia opciones',async()=>{
      await A.click('#lfNext');await B.waitForFunction("document.getElementById('lsummary').textContent.includes('NIEBLA NO')",null,{timeout:5000});await A.click('#lfNext');
      const n0=await A.evaluate('NET.aiNames[0]');assert.ok((await B.innerText('#lplayers')).includes('IA · '+n0),'el invitado no ve los nombres de las IAs');});
    await t('el invitado elige un color libre y no uno ocupado',async()=>{
      const hostC=await A.evaluate('playerColor');
      for(let i=0;i<13;i++){await B.click('#lcnext');await B.waitForTimeout(60);assert.notStrictEqual(await B.evaluate('playerColor'),hostC,'eligió el color del anfitrión');}
      const mine=await B.evaluate('playerColor');await A.waitForFunction(`[...NET.clients.values()][0].color==='${mine}'`,null,{timeout:5000});});
    await t('el invitado elige su aspecto y el anfitrión lo ve',async()=>{
      const k0=await B.evaluate('playerSkin');await B.click('#lknext');const k1=await B.evaluate('playerSkin');assert.notStrictEqual(k0,k1);
      await A.waitForFunction(`[...NET.clients.values()][0].skin==='${k1}'`,null,{timeout:5000});
      assert.ok((await B.innerText('#lkname')).length>0);});
    await t('EMPEZAR espera a que el invitado esté listo y luego cuenta 3… 2… 1… para todos',async()=>{
      assert.ok(await A.isDisabled('#lstart'),'EMPEZAR debería esperar');{const tx=await A.innerText('#lstart');assert.ok(/0\/\d/.test(tx),'texto: '+tx);}
      await B.click('#lready');await A.waitForFunction("!document.getElementById('lstart').disabled",null,{timeout:5000});
      assert.ok((await A.innerText('#lplayers')).includes('LISTO'));
      await A.evaluate("themeChoice='bunker'");await A.click('#lstart');
      await B.waitForFunction("document.getElementById('countdown').style.display==='flex'",null,{timeout:3000});
      assert.strictEqual(await B.evaluate('state'),'lobby','no debe empezar antes de la cuenta');
      await B.waitForFunction("state==='play'",null,{timeout:8000});});
    await B.waitForTimeout(600);
    await A.evaluate("for(const e of ents)if(!e.isPlayer){e.alive=false;e.respawnT=1e9;}");
    await t('las IAs de la partida tienen los nombres que se vieron en la sala',async()=>{
      assert.ok(await A.evaluate("ents.filter(e=>!e.isPlayer).every((e,i)=>e.name===NET.aiNames[i])"));
      assert.strictEqual(await B.evaluate('ents[myId].skin'),await B.evaluate('playerSkin'),'el invitado no tiene su aspecto en la partida');
      assert.strictEqual(await A.evaluate('ents[1].skin'),await B.evaluate('playerSkin'));});
    await t('el invitado se mueve al instante y el anfitrión lo ve',async()=>{
      const x0=await B.evaluate('me().x');await B.keyboard.down('KeyA');await B.waitForTimeout(80);const x1=await B.evaluate('me().x');
      await B.waitForTimeout(500);await B.keyboard.up('KeyA');await B.waitForTimeout(500);
      assert.ok(Math.abs(x1-x0)>0,'no se movió al instante');
      const h=await A.evaluate('Math.round(ents[1].x)'),g=await B.evaluate('Math.round(me().x)');assert.ok(Math.abs(h-g)<8,`anfitrión ${h} vs invitado ${g}`);});
    await t('disparos y granadas del invitado llegan al anfitrión',async()=>{
      const f0=await A.evaluate('ents[1].inv.frag');await B.keyboard.press('Space');await B.keyboard.press('KeyG');await A.waitForTimeout(300);
      assert.strictEqual(await A.evaluate('ents[1].inv.frag'),f0-1);});
    const C=await page('espectador');
    await t('quien llega a media partida la ve como espectador y entra en la siguiente',async()=>{
      await C.goto(URL+'#'+code);await C.waitForTimeout(300);await C.click('#joinInvite');await C.waitForFunction("state==='play'",null,{timeout:15000});
      assert.strictEqual(await C.evaluate('myId'),-1);assert.strictEqual(await B.evaluate('state'),'play');
      await A.evaluate('timeLeft=0.05');await C.waitForFunction("state==='over'",null,{timeout:5000});
      await A.click('#again');await C.waitForFunction("state==='play'&&myId>=0",null,{timeout:9000});});
    await t('si el anfitrión deja de responder, el invitado ve el aviso',async()=>{
      await A.evaluate("window._hb=hostBroadcast;hostBroadcast=()=>{}");await B.waitForFunction("NET&&NET.hostQuiet>2.5",null,{timeout:6000});
      await A.evaluate("hostBroadcast=window._hb");await B.waitForFunction("NET.hostQuiet<1",null,{timeout:4000});});
    const readyAll=async()=>{for(const P of [B,C]){await P.waitForFunction("state==='lobby'&&!document.getElementById('lready').disabled",null,{timeout:5000});if(!(await P.evaluate('NET.ready')))await P.click('#lready');}
      await A.waitForFunction("!document.getElementById('lstart').disabled",null,{timeout:5000});await A.click('#lstart');
      for(const P of [B,C])await P.waitForFunction("state==='play'&&myId>=0",null,{timeout:9000});};
    await t('captura la bandera en línea: el invitado ve el modo, toma la bandera y anota',async()=>{
      await A.evaluate("hostToLobby();themeChoice='bunker';SETTINGS.pctf=1");await A.click('#lmNext');
      assert.strictEqual(await A.evaluate('menuMode()'),'ctf');assert.ok(await A.evaluate('NET.clients.size+1+NET.ais<=4'),'bandera admite hasta 4');
      await B.waitForFunction("document.getElementById('lsummary').textContent.includes('CAPTURA LA BANDERA · 3 CAPTURAS')",null,{timeout:5000});
      await readyAll();
      assert.strictEqual(await B.evaluate('gameMode'),'ctf');assert.ok(await B.evaluate('!!flag'),'el invitado no tiene bandera');
      // el invitado nace en su base: primero se le mueve fuera para que tomar la bandera no cuente como captura
      await A.evaluate("for(const e of ents)if(!e.isPlayer){e.alive=false;e.respawnT=1e9;}placeAt(ents[1],nearestFloor(15,11));ents[1].tp++");
      await B.waitForFunction("me().tx!==baseOf(me())[0]||me().ty!==baseOf(me())[1]",null,{timeout:4000});await B.waitForTimeout(200);
      await A.evaluate("flag.carrier=1");
      await B.waitForFunction('hasFlag(me())',null,{timeout:4000});
      await A.evaluate("placeAt(ents[1],baseOf(ents[1]));ents[1].tp++");
      await B.waitForFunction('me().caps===1&&!carrierOf()',null,{timeout:5000});
      assert.strictEqual(await B.evaluate('flagTile().join()'),'10,7','la bandera no volvió al centro');});
    await t('último en pie en línea: el invitado sin vidas mira la partida y entra en la revancha',async()=>{
      await A.evaluate("hostToLobby();SETTINGS.plms=1");await A.click('#lmNext');assert.strictEqual(await A.evaluate('menuMode()'),'lms');
      await readyAll();assert.strictEqual(await B.evaluate('lifeCount'),3);
      await A.evaluate("ents[1].lives=1;ents[1].invulnT=0;kill(ents[1],ents[0])");
      await B.waitForFunction('me().out&&!me().alive',null,{timeout:4000});await B.waitForTimeout(3000);
      assert.ok(await B.evaluate('!me().alive&&state==="play"'),'el eliminado reapareció');
      await A.evaluate('timeLeft=0.05');await B.waitForFunction("state==='over'",null,{timeout:5000});
      await A.click('#again');await B.waitForFunction("state==='play'&&me().alive&&me().lives===3",null,{timeout:9000});
      await A.evaluate("hostToLobby();SETTINGS.mode='dm'");});
    await t('versión incompatible muestra cómo actualizar',async()=>{
      await A.evaluate("sameMinor=()=>false;hostToLobby()");const D=await page('versión vieja');await D.goto(URL+'#'+code);await D.waitForTimeout(300);await D.click('#joinInvite');
      await D.waitForFunction("document.getElementById('netMsg').textContent.includes('Recarga')&&!NET",null,{timeout:12000});assert.ok((await D.innerText('#netMsg')).includes('Recarga la página'));assert.ok(await D.isVisible('#netMsg'));});
    await t('el anfitrión cambia de app (p. ej. a WhatsApp) y al volver la sala sigue aceptando jugadores',async()=>{
      const H=await page('anfitrión celular');await H.goto(URL);await H.waitForTimeout(300);await H.evaluate("state==='intro'&&endIntro()");
      await H.click('#mkRoom');await H.waitForFunction("state==='lobby'");const c2=await H.evaluate('NET.code');
      // ya hay un invitado en la sala antes de salir
      const G1=await page('invitado previo');await G1.goto(URL+'#'+c2);await G1.waitForTimeout(300);await G1.click('#joinInvite');await G1.waitForFunction("state==='lobby'",null,{timeout:15000});
      // el celular suspende la página: el servidor corta la conexión sin que el juego se entere
      await H.evaluate("(()=>{const ws=NET.peer.socket._socket;ws.onclose=null;ws.onerror=null;ws.onmessage=null;ws.close();})()");
      await H.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))");
      await H.waitForTimeout(1500);
      // vuelve a la app
      await H.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))");
      await H.waitForTimeout(2500);
      const G2=await page('invitado nuevo');await G2.goto(URL+'#'+c2);await G2.waitForTimeout(300);await G2.click('#joinInvite');
      await G2.waitForFunction("state==='lobby'||(!NET&&!document.getElementById('joinInvite').disabled)",null,{timeout:15000});
      assert.strictEqual(await G2.evaluate('state'),'lobby','el invitado nuevo no pudo entrar: '+(await G2.innerText('#netMsg')));
      assert.strictEqual(await H.evaluate('NET.clients.size'),2,'el anfitrión perdió al invitado que ya estaba');
      await H.evaluate('netLeave()');});
    await t('sala que ya no existe muestra un aviso visible',async()=>{
      const E=await page('sala cerrada');await E.goto(URL+'#ZZZ9');await E.waitForTimeout(300);await E.click('#joinInvite');
      await E.waitForFunction("document.getElementById('netMsg').textContent.includes('ya no está activa')&&!NET",null,{timeout:15000});const msg=await E.innerText('#netMsg');assert.ok(await E.isVisible('#netMsg'));assert.ok(msg.includes('ya no está activa'),'mensaje: '+msg);});
    assert.deepStrictEqual(errors,[],'errores en las páginas: '+errors.join(' | '));
    console.log(`${ok} pruebas OK`);
  }catch(e){console.error('✗',e.message);if(errors.length)console.error(errors);process.exitCode=1;}
  finally{await browser.close();web.close();ps.close&&ps.close();process.exit(process.exitCode||0);}
})();
