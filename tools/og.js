// Genera og.png (1200 × 630), la imagen que muestran WhatsApp y otras apps al compartir el enlace.
// Uso: node tools/og.js   (usa el mismo código del juego: logotipo, soldados y escenario)
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:800}});
 await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(400);
 const url=await p.evaluate(async()=>{
  state='title';setTheme('jungle');genMap();fogOn=false;ents=[];
  await new Promise(r=>setTimeout(r,200)); // deja que el juego dibuje el laberinto en el canvas
  const W=1200,H=630,o=document.createElement('canvas');o.width=W;o.height=H;const g=o.getContext('2d');g.imageSmoothingEnabled=false;
  const src=document.getElementById('c');g.drawImage(src,0,44,672,480,0,-40,W,W*480/672);
  g.fillStyle='rgba(8,10,16,.62)';g.fillRect(0,0,W,H);
  const vg=g.createRadialGradient(W/2,H/2,120,W/2,H/2,700);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  const logo=logoCanvas(8,true);g.drawImage(logo,Math.round((W-logo.width)/2),40);
  const A=[['recruitF','#4ade80','rifle'],['commandoM','#ef4444','smg'],['gas','#f472b6','shotgun']],B=[['operator','#22d3ee','rifle'],['commandoF','#facc15','smg'],['recruitM','#fb923c','pistol']];
  const ys=[420,500,580];
  A.forEach(([k,c,w],i)=>{const x=150+[0,60,25][i],y=ys[i];g.fillStyle='rgba(0,0,0,.4)';g.fillRect(x-20,y+22,40,8);drawSkin(g,k,c,'right',0,false,w,x,y+26,4);
   const t=gunTip(k,'right',w);g.fillStyle='#fff7ae';g.fillRect(x+t.dx*2-6,y+t.dy*2-6,12,12);g.fillStyle='#ffe066';g.fillRect(x+t.dx*2+80,y+t.dy*2-3,10,6);g.fillStyle='rgba(255,224,102,.45)';g.fillRect(x+t.dx*2+56,y+t.dy*2-2,22,4);});
  B.forEach(([k,c,w],i)=>{const x=W-150-[0,60,25][i],y=ys[i];g.fillStyle='rgba(0,0,0,.4)';g.fillRect(x-20,y+22,40,8);drawSkin(g,k,c,'left',0,false,w,x,y+26,4);});
  return o.toDataURL('image/png');
 });
 fs.writeFileSync(path.resolve(__dirname,'../og.png'),Buffer.from(url.split(',')[1],'base64'));
 await b.close();console.log('og.png listo');
})();
