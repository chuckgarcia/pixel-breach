'use strict';
// Pixel Breach — Aspectos de los soldados: dibujos de 16 × 20 en texto, contorno automático y armas.
// Letras: T/t/u = color del jugador (base, luz, sombra); el resto, por aspecto (SKIN_PAL) o comunes (SKIN_BASE).
const SKINS=[{k:'recruitF',n:'RECLUTA ♀',p:'recruit'},{k:'recruitM',n:'RECLUTA ♂',p:'recruit'},{k:'commandoF',n:'COMANDO ♀',p:'commando'},{k:'commandoM',n:'COMANDO ♂',p:'commando'},
 {k:'operator',n:'OPERADOR',p:'operator'},{k:'gas',n:'ANTIGÁS',p:'gas'},{k:'ghillie',n:'GHILLIE',p:'ghillie'}];
const SKIN_KEYS=SKINS.map(s=>s.k);
const skinOf=k=>SKINS.find(s=>s.k===k)||SKINS[1];
const SKIN_BASE={S:'#f2c18d',s:'#cf8f5d',E:'#1b1b22',W:'#ffffff',A:'#6b3a1f',a:'#4a2814',P:'#3a4250',p:'#2a303b',K:'#1d2129',L:'#7a5230',l:'#a87443'};
const SKIN_PAL={
 recruit:{H:'#5b6f3c',h:'#7e9455',d:'#3d4c27'},
 commando:{B:'#7f1d1d',b:'#b43a3a',c:'#4a6b2a'},
 operator:{H:'#454d5f',h:'#6c7890',d:'#2e3442',G:'#f59e0b',g:'#fde68a',M:'#2f3542',m:'#1f242e',V:'#22262f',v:'#3a404d'},
 gas:{H:'#39435a',h:'#56627d',d:'#262d3d',M:'#7b8597',m:'#555e70',R:'#ef4444',r:'#fca5a5',C:'#3f4654'},
 ghillie:{X:'#4d6b2e',Y:'#6f8f3c',Z:'#33481f',c:'#4a6b2a'}
};
// De espaldas: lo que en la cara se ve de frente pasa a pelo, capucha o correas (solo arriba del torso)
const SKIN_BACK={recruitF:{S:'A',s:'a',E:'A',W:'A'},recruitM:{S:'a',E:'a',W:'a'},commandoF:{S:'A',s:'a',E:'A',W:'A',c:'A'},commandoM:{S:'a',E:'a',W:'a',c:'a'},
 operator:{G:'m',g:'m'},gas:{R:'M',r:'M',C:'m'},ghillie:{S:'X',s:'Z',E:'X',c:'X'}};
// Mano que sostiene el arma (columna, renglón) en cada vista
const SKIN_HAND={recruitF:{down:[13,14],right:[13,13]},recruitM:{down:[13,14],right:[13,13]},commandoF:{down:[13,15],right:[13,12]},commandoM:{down:[13,15],right:[13,12]},
 operator:{down:[13,15],right:[13,12]},gas:{down:[13,14],right:[13,12]},ghillie:{down:[13,14],right:[13,12]}};
const SKIN_GRID={
 recruitF:{down:["................", ".....HHHHHH.....", "....HhhHHHHH....", "...HhHHHHHHHH...", "...HHHHHHHHHd...", "..HHHHHHHHHHdd..", "..AddddddddddA..", "..ASSSSSSSSSSA..", "..ASEESSSSEESA..", ".AASWESSSSWESAA.", ".AASSSSssSSSSAA.", ".AA.sSSSSSSs.AA.", "..A.uTTTTTTu.A..", "...tTTtTTtTTu...", "..STTTuTTuTTTS..", "..sTTTLLlLTTTs..", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK....", "................"],
  right:["................", "......HHHHH.....", ".....HHHHhhH....", "....HHHHHHHhH...", "....HHHHHHHHH...", "...dHHHHHHHHHHH.", "...AAddddddddd..", "...AAASSSSSSSS..", "...AAASSSSSWES..", "...AAAASSSSSSS..", "...AAAAsSSSSs...", "....AAA.sSSs....", ".....AAuTTTTu...", ".......TTTTTTS..", "......tTTuTTTs..", "......TTLLlLT...", ".......PPPPP....", ".......PP.PPP...", "......KKK..KKK..", "................"]},
 recruitM:{down:["................", ".....HHHHHH.....", "....HhhHHHHH....", "...HhHHHHHHHH...", "...HHHHHHHHHd...", "..HHHHHHHHHHdd..", "..dddddddddddd..", "..aSSSSSSSSSSa..", "..aSEESSSSEESa..", "...SWESSSSWES...", "...SSSSssSSSS...", "....sSSSSSSs....", "....uTTTTTTu....", "...tTTtTTtTTu...", "..STTTuTTuTTTS..", "..sTTTLLlLTTTs..", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK....", "................"],
  right:["................", "......HHHHH.....", ".....HHHHhhH....", "....HHHHHHHhH...", "....HHHHHHHHH...", "...dHHHHHHHHHHH.", "....dddddddddd..", "....aSSSSSSSSS..", "....aSSSSSSWES..", ".....SSSSSSSSS..", ".....SSsSSSSs...", "......sSSSSs....", "......uTTTTu....", ".......TTTTTTS..", "......tTTuTTTs..", "......TTLLlLT...", ".......PPPPP....", ".......PP.PPP...", "......KKK..KKK..", "................"]},
 commandoF:{down:["................", "................", "....BBBBBBBb....", "...BbbBBBBBBB...", "..BBBBBBBBBBBBB.", "...AAAAAAAAAA...", "..AASSSSSSSSAA..", "..ASSSSSSSSSSAA.", "..ASEESSSSEESAA.", "..AcWESSSSWEcAAA", "..ASSSSssSSSSAAA", "...ScSSSSSScS.AA", "....sSSSSSSs..A.", "....uTTTTTTu....", "...tTTtTTtTTu...", "..STTTuTTuTTTS..", "..sTTTLLlLTTTs..", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK...."],
  right:["................", "................", "......BBBBBb....", ".....BbbBBBBB...", "....BBBBBBBBBBB.", "...AAAAAAAAAA...", "..AAASSSSSSSS...", "..AAASSSSSSWES..", ".AA.ASSSScSSS...", ".A..ASSsSSSSs...", "....AAsSSSSs....", ".....AuTTTTu....", ".......TTTTTTS..", "......tTTuTTTs..", "......TTLLlLT...", ".......PPPPP....", ".......PP.PPP...", "......KKK..KKK..", "................", "................"]},
 commandoM:{down:["................", "................", "....BBBBBBBb....", "...BbbBBBBBBB...", "..BBBBBBBBBBBBB.", "...aaaaaaaaaa...", "...SSSSSSSSSS...", "..aSSSSSSSSSSa..", "..aSEESSSSEESa..", "...cWESSSSWEc...", "...SSSSssSSSS...", "...ScSsSSsScS...", "....saaaaaas....", "....uTTTTTTu....", "...tTTtTTtTTu...", "..STTTuTTuTTTS..", "..sTTTLLlLTTTs..", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK...."],
  right:["................", "................", "......BBBBBb....", ".....BbbBBBBB...", "....BBBBBBBBBBB.", ".....aaaaaaaa...", "....aSSSSSSSSS..", "....aSSSSSSWES..", ".....SSSSScSSS..", ".....SSsSSSSs...", "......saaaas....", "......uTTTTu....", ".......TTTTTTS..", "......tTTuTTTs..", "......TTLLlLT...", ".......PPPPP....", ".......PP.PPP...", "......KKK..KKK..", "................", "................"]},
 operator:{down:["................", ".....HHHHHH.....", "....HhhHHHHH....", "...HhHHHHHHHH...", "...HHHHHHHHHd...", "..dHHHHHHHHHHd..", "..mGGGGGGGGGGm..", "..mGgGGGGGgGGm..", "..mmGGGmmGGGmm..", "...mMMMMMMMMm...", "...mMMMMMMMMm...", "....mMMMMMMm....", "...TVVVVVVVVT...", "..tTVvVVVVvVTu..", "..TTVVTTTTVVTT..", "..mTVVTtTuVVTm..", "..m.VLLLLLLV.m..", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK...."],
  right:["................", "......HHHHH.....", ".....HHHHhhH....", "....HHHHHHHhH...", "....HHHHHHHHH...", "...dHHHHHHHHHHd.", "....mmmmGGGGGGm.", "....mmmmGgGGGGm.", "....mMMMMMMMMm..", ".....MMMMMMMMm..", "......mMMMMm....", "......TVVVVT....", "......VVTTVVTm..", "......tVTTVVTm..", "......VVLLlLV...", ".......PPPPP....", ".......PP.PPP...", "......KKK..KKK..", "................", "................"]},
 gas:{down:["................", ".....HHHHHH.....", "....HhhHHHHH....", "...HhHHHHHHHH...", "...HHHHHHHHHd...", "..dHHHHHHHHHHd..", "..ddddddddddd...", "..MMMMMMMMMMMm..", "..MRRrMMMMRRrm..", "..MRRRMMMMRRRm..", "...MMMMmmMMMm...", "....MmCCCCmm....", "....uTTCCTTu....", "...tTTtTTtTTu...", "..MTTTuTTuTTTM..", "..mTTTTTTTTTTm..", "...TTTLLlLTTT...", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK...."],
  right:["................", "......HHHHH.....", ".....HHHHhhH....", "....HHHHHHHhH...", "....HHHHHHHHH...", "...dHHHHHHHHHHd.", "....ddddddddd...", "....MMMMMMMRRm..", "....MMMMMMMRRm..", ".....MMMMMMMMCC.", "......mMMMMmCCC.", "......uTTTTu....", ".......TTTTTTM..", "......tTTuTTTm..", "......TTLLlLTT..", "......TTTTTTT...", ".......PPPPP....", ".......PP.PPP...", "......KKK..KKK..", "................"]},
 ghillie:{down:["................", "....Y.YY.Y......", "...YXYXXYXY.Y...", "..YXXYXXXXYXX...", ".YXZXXXXXXXXZXY.", "..XXZZZZZZZZXX..", ".YXZSSSSSSSSZXY.", "..XZSEESSEESZX..", ".YXZcSSssSScZXY.", "..XXZsSSSSsZXX..", ".YXXuTTTTTTuXXY.", "..XXXXXXXXXXXX..", ".YXYXXZXXZXXYXY.", "..TXXXXXXXXXXT..", ".YuXZXXXXXXZXuY.", "..XYXXZXXZXXYX..", "...YXXXXXXXXY...", "....ZZZ..ZZZ....", "....KKK..KKK....", "................"],
  right:["................", ".....Y.YY.Y.....", "....YXYXXYXY....", "...YXXYXXXXYX...", "..YXZXXXXXXXXZ..", "...XXZZZZZSSSZ..", "..YXXZSSSSSSEZ..", "...XXZSSScSSSZ..", "..YXXXZsSSSSsZ..", "...XXXuTTTTTuX..", "..YXXXXXXXXXXXY.", "...XXYXXZXXXSX..", "..YXXXXuXXXXXs..", "...XYXXZXXZXX...", "....YXXXXXXXY...", ".......ZZZZ.....", ".......ZZ.ZZZ...", "......KKK..KKK..", "................", "................"]},
};
// Armas: de lado apuntan hacia adelante; de frente, hacia abajo (de espaldas, hacia arriba y detrás del cuerpo)
const GUN_PAL={N:'#323a47',n:'#7c8799',w:'#7a5230',x:'#a87443'};
const GUN_SPR={
 pistol:{side:[-1,0,["nNNNN","NN..."]],front:[-1,1,["NN","Nn","N."]]},
 smg:{side:[-2,0,["..nNNNNN","NNNNNNN.","N..NN..."]],front:[-1,-1,["nN","NN","NN","NN","N."]]},
 shotgun:{side:[-3,0,["wwxNNNNNNNNN","ww.wwx......"]],front:[-1,-2,["w.","x.","NN","NN","Nn","NN","N."]]},
 rifle:{side:[-3,-1,["......n......","wwxNNNNNNNNNN","w..NN.N......"]],front:[-1,-2,["n.","NN","NN","NN","Nn","NN","N.","N."]]}
};
const SK_W=24,SK_H=24,SK_OUT='#0b0e14';
function skinShade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const m=c=>Math.max(0,Math.min(255,Math.round(f<0?c*(1+f):c+(255-c)*f)));return `rgb(${m(r)},${m(g)},${m(b)})`;}
// Arma un mapa de 24 × 24: cada celda {ch, gun}. face: down/up/right; frame 0 quieto, 1 y 2 pasos.
function skinCells(skin,face,frame,weapon){
 const S=SKIN_GRID[skin]?skin:'recruitM',view=face==='right'?'right':'down';
 let rows=SKIN_GRID[S][view].map(r=>r.split(''));
 const torso=rows.findIndex(r=>r.includes('T')||r.includes('u'));
 if(face==='up'){const map=SKIN_BACK[S]||{};rows=rows.map((r,y)=>y<torso?r.map(c=>map[c]||c):r.map(c=>c==='C'?'T':c));}
 // pasos: levanta una bota y luego la otra
 let b=-1;rows.forEach((r,y)=>{if(r.includes('K'))b=y;});
 if(frame&&b>0){const runs=[];let st=-1;rows[b].forEach((c,x)=>{if(c==='K'&&st<0)st=x;if(c!=='K'&&st>=0){runs.push([st,x-1]);st=-1;}});if(st>=0)runs.push([st,rows[b].length-1]);
  const run=runs[frame===1?0:runs.length-1];if(run)for(let x=run[0];x<=run[1];x++){rows[b-1][x]='K';rows[b][x]='.';}}
 let feet=0;rows.forEach((r,y)=>{if(r.some(c=>c!=='.'))feet=y;});
 const dy=19-feet,cells=Array.from({length:SK_H},()=>Array(SK_W).fill(null));
 rows.forEach((r,y)=>r.forEach((c,x)=>{if(c!=='.'&&y+dy<SK_H)cells[y+dy][x]={ch:c,gun:false};}));
 const g=GUN_SPR[weapon];
 if(g){const [hx,hy]=SKIN_HAND[S][view];const [ox,oy,gr]=face==='right'?g.side:g.front;
  const src=face==='up'?gr.slice().reverse():gr;const y0=face==='up'?hy+dy-oy-gr.length+1:hy+dy+oy;
  src.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c==='.')return;const X=hx+ox+xx,Y=y0+yy;if(X<0||Y<0||X>=SK_W||Y>=SK_H)return;
   if(face==='up'&&cells[Y][X])return; /* de espaldas el arma queda detrás */ cells[Y][X]={ch:c,gun:true};}));}
 return cells;
}
const skinCache=new Map();
function skinSprite(skin,color,face,frame,hurt,weapon,scale){
 scale=scale||2;const key=[skin,color,face,frame,hurt?1:0,weapon,scale].join('|');let cv=skinCache.get(key);if(cv)return cv;
 const S=SKIN_GRID[skin]?skin:'recruitM',cells=skinCells(S,face,frame,weapon);
 const pal=Object.assign({},SKIN_BASE,SKIN_PAL[skinOf(S).p],{T:color,t:skinShade(color,.28),u:skinShade(color,-.32)});
 cv=document.createElement('canvas');cv.width=(SK_W+2)*scale;cv.height=(SK_H+2)*scale;const g=cv.getContext('2d');if(!g||!g.fillRect)return cv;
 const at=(x,y)=>y>=0&&y<SK_H&&x>=0&&x<SK_W?cells[y][x]:null;
 g.fillStyle=SK_OUT;
 for(let y=-1;y<=SK_H;y++)for(let x=-1;x<=SK_W;x++)if(!at(x,y)&&(at(x+1,y)||at(x-1,y)||at(x,y+1)||at(x,y-1)))g.fillRect((x+1)*scale,(y+1)*scale,scale,scale);
 const flash=color==='#f1f5f9'?'#f87171':'#ffffff';
 for(let y=0;y<SK_H;y++)for(let x=0;x<SK_W;x++){const c=at(x,y);if(!c)continue;
  const gunAt=(a,b)=>{const o=at(a,b);return o&&o.gun;};
  const edge=!c.gun&&(gunAt(x+1,y)||gunAt(x-1,y)||gunAt(x,y+1)||gunAt(x,y-1)); // el arma lleva su contorno también sobre el cuerpo
  g.fillStyle=edge?SK_OUT:hurt?flash:(c.gun?GUN_PAL[c.ch]:pal[c.ch])||'#ff00ff';g.fillRect((x+1)*scale,(y+1)*scale,scale,scale);}
 if(skinCache.size>600)skinCache.clear();skinCache.set(key,cv);return cv;
}
// Dibuja un soldado con el centro del cuerpo en cx y la planta de los pies en feetY. face incluye 'left' (espejo).
function drawSkin(g,skin,color,face,frame,hurt,weapon,cx,feetY,scale){
 scale=scale||2;const left=face==='left',spr=skinSprite(skin,color,left?'right':face,frame,hurt,weapon,scale);
 const top=feetY-21*scale;
 if(left){g.save();g.translate(cx+9*scale,top);g.scale(-1,1);g.drawImage(spr,0,0);g.restore();}
 else g.drawImage(spr,cx-9*scale,top);
}
const GUN_OF=w=>GUN_SPR[w]?w:'pistol';
let playerSkin=null;
try{const s=localStorage.getItem('pb_skin');if(SKIN_KEYS.includes(s))playerSkin=s;}catch(e){}
if(!playerSkin){playerSkin=Math.random()<.5?'recruitF':'recruitM';try{localStorage.setItem('pb_skin',playerSkin);}catch(e){}} // la primera vez: Recluta ♀ o ♂ al azar
