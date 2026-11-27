// Genera los íconos de la app (icon512.png, icon192.png, apple-touch-icon.png) y el favicon de index.html.
// Uso: node tools/icons.js   (dibuja con el mismo código del juego: OPERADOR en color VERDE, de frente)
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const ROOT=path.resolve(__dirname,'..');
const SKIN='operator',COLOR='VERDE';
(async()=>{
 const b=await chromium.launch(...(process.env.CHROMIUM_PATH?[{executablePath:process.env.CHROMIUM_PATH}]:[]));
 const p=await b.newPage();await p.goto('file://'+path.join(ROOT,'index.html'));await p.waitForTimeout(400);
 const out=await p.evaluate(([skin,cname])=>{
  const col=PALETTE.find(c=>c[0]===cname)[1];
  // fondo oscuro con un recuadro al centro (el recuadro deja libre la zona segura de los íconos «maskable»)
  const make=size=>{const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
   g.fillStyle='#0b0d12';g.fillRect(0,0,size,size);const m=Math.round(size*.08);g.fillStyle='#1c2030';g.fillRect(m,m,size-2*m,size-2*m);
   const sc=Math.max(1,Math.floor(size/32));drawSkin(g,skin,col,'down',0,false,null,size/2,Math.round(size*.5+10*sc),sc);
   return c.toDataURL('image/png');};
  return {i512:make(512),i192:make(192),apple:make(180),fav:make(64)};},[SKIN,COLOR]);
 const png=d=>Buffer.from(d.split(',')[1],'base64');
 fs.writeFileSync(path.join(ROOT,'icon512.png'),png(out.i512));
 fs.writeFileSync(path.join(ROOT,'icon192.png'),png(out.i192));
 fs.writeFileSync(path.join(ROOT,'apple-touch-icon.png'),png(out.apple));
 const f=path.join(ROOT,'index.html');let h=fs.readFileSync(f,'utf8');
 h=h.replace(/<link rel="icon" type="image\/png" href="data:image\/png;base64,[^"]*">/,`<link rel="icon" type="image/png" href="${out.fav}">`);
 fs.writeFileSync(f,h);
 await b.close();console.log('íconos listos');
})();
