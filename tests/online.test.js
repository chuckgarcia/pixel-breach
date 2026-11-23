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
    await t('en celular, la vista previa del soldado en la sala es pequeña',async()=>{
      const M=await page('celular',{viewport:{width:844,height:390},isMobile:true,hasTouch:true});await M.goto(URL+'#'+code);await M.waitForTimeout(300);
      await M.tap('#joinInvite');await M.waitForFunction("state==='lobby'",null,{timeout:15000});
      for(const id of ['lpv']){const b=await M.locator('#'+id).boundingBox();assert.ok(b&&b.width<80&&b.height<100,`#${id} mide ${b&&Math.round(b.width)}x${b&&Math.round(b.height)}`);}
      await M.evaluate('netLeave()');await M.context().close();});
    await t('en celular, la vista previa del soldado en el menú es pequeña',async()=>{
      const M=await page('celular menú',{viewport:{width:844,height:390},isMobile:true,hasTouch:true});await M.goto(URL);await M.waitForTimeout(300);await M.evaluate("state==='intro'&&endIntro()");
      const b=await M.locator('#pv').boundingBox();assert.ok(b&&b.width<80,`#pv mide ${b&&Math.round(b.width)}`);await M.context().close();});
    await t('la sala del invitado se actualiza cuando el anfitrión cambia opciones',async()=>{
      await A.click('#lfNext');await B.waitForFunction("document.getElementById('lsummary').textContent.includes('NIEBLA NO')",null,{timeout:5000});await A.click('#lfNext');});
    await t('el invitado elige un color libre y no uno ocupado',async()=>{
      await B.click('#lswatches button:nth-child(8)');await A.waitForFunction("[...NET.clients.values()][0].color==='#6366f1'",null,{timeout:5000});
      assert.ok(await B.isDisabled('#lswatches button:nth-child(1)'));});
    await A.evaluate("themeChoice='bunker'");await A.click('#lstart');await B.waitForFunction("state==='play'",null,{timeout:5000});await B.waitForTimeout(600);
    await A.evaluate("for(const e of ents)if(!e.isPlayer){e.alive=false;e.respawnT=1e9;}");
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
      await A.click('#again');await C.waitForFunction("state==='play'&&myId>=0",null,{timeout:5000});});
    await t('si el anfitrión deja de responder, el invitado ve el aviso',async()=>{
      await A.evaluate("window._hb=hostBroadcast;hostBroadcast=()=>{}");await B.waitForFunction("NET&&NET.hostQuiet>2.5",null,{timeout:6000});
      await A.evaluate("hostBroadcast=window._hb");await B.waitForFunction("NET.hostQuiet<1",null,{timeout:4000});});
    await t('versión incompatible muestra cómo actualizar',async()=>{
      await A.evaluate("sameMinor=()=>false;hostToLobby()");const D=await page('versión vieja');await D.goto(URL+'#'+code);await D.waitForTimeout(300);await D.click('#joinInvite');
      await D.waitForFunction("!NET",null,{timeout:12000});assert.ok((await D.innerText('#netMsg')).includes('Recarga la página'));assert.ok(await D.isVisible('#netMsg'));});
    await t('sala que ya no existe muestra un aviso visible',async()=>{
      const E=await page('sala cerrada');await E.goto(URL+'#ZZZ9');await E.waitForTimeout(300);await E.click('#joinInvite');
      await E.waitForFunction("!NET",null,{timeout:15000});const msg=await E.innerText('#netMsg');assert.ok(await E.isVisible('#netMsg'));assert.ok(msg.includes('ya no está activa'),'mensaje: '+msg);});
    assert.deepStrictEqual(errors,[],'errores en las páginas: '+errors.join(' | '));
    console.log(`${ok} pruebas OK`);
  }catch(e){console.error('✗',e.message);if(errors.length)console.error(errors);process.exitCode=1;}
  finally{await browser.close();web.close();ps.close&&ps.close();process.exit(process.exitCode||0);}
})();
