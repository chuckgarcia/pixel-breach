'use strict';
// Pixel Breach — Aspectos de los soldados: dibujos de 16 × 20 en texto, contorno automático y armas.
// Letras: T/t/u = color del jugador (base, luz, sombra); el resto, por aspecto (SKIN_PAL) o comunes (SKIN_BASE).
const SKINS=[{k:'recruitF',n:'RECLUTA ♀',p:'recruit'},{k:'recruitM',n:'RECLUTA ♂',p:'recruit'},{k:'commandoF',n:'COMANDO ♀',p:'commando'},{k:'commandoM',n:'COMANDO ♂',p:'commando'},
 {k:'operator',n:'OPERADOR',p:'operator'},{k:'gas',n:'ANTIGÁS',p:'gas'},{k:'ghillie',n:'GHILLIE',p:'ghillie'},{k:'classic',n:'CLÁSICO',p:'classic'}];
const SKIN_KEYS=SKINS.map(s=>s.k);
const skinOf=k=>SKINS.find(s=>s.k===k)||(typeof VSKINS!=='undefined'&&VSKINS.find(s=>s.k===k))||(typeof SKIN_EXTRA!=='undefined'&&SKIN_EXTRA.find(s=>s.k===k))||SKINS[1];
const SKIN_BASE={S:'#f2c18d',s:'#cf8f5d',E:'#1b1b22',W:'#ffffff',A:'#6b3a1f',a:'#4a2814',P:'#3a4250',p:'#2a303b',K:'#1d2129',L:'#7a5230',l:'#a87443'};
const SKIN_PAL={
 recruit:{H:'#5b6f3c',h:'#7e9455',d:'#3d4c27'},
 commando:{B:'#7f1d1d',b:'#b43a3a',c:'#4a6b2a'},
 operator:{H:'#454d5f',h:'#6c7890',d:'#2e3442',G:'#f59e0b',g:'#fde68a',M:'#2f3542',m:'#1f242e',V:'#22262f',v:'#3a404d'},
 gas:{H:'#39435a',h:'#56627d',d:'#262d3d',M:'#7b8597',m:'#555e70',R:'#ef4444',r:'#fca5a5',C:'#3f4654'},
 ghillie:{X:'#4d6b2e',Y:'#6f8f3c',Z:'#33481f',c:'#4a6b2a'},
 classic:{H:'#4d5a2c',h:'#6b7d3c',d:'#3a4421',R:'#2f3a1a'} // el soldado original (v0.1–v0.11): casco oliva, franja y uniforme de tu color
};
// De espaldas: lo que en la cara se ve de frente pasa a pelo, capucha o correas (solo arriba del torso)
const SKIN_BACK={recruitF:{S:'A',s:'a',E:'A',W:'A'},recruitM:{S:'a',E:'a',W:'a'},commandoF:{S:'A',s:'a',E:'A',W:'A',c:'A'},commandoM:{S:'a',E:'a',W:'a',c:'a'},
 operator:{G:'m',g:'m'},gas:{R:'M',r:'M',C:'m'},ghillie:{S:'X',s:'Z',E:'X',c:'X'},classic:{S:'a',E:'a',s:'a'}};
// Mano que sostiene el arma (columna, renglón) en cada vista. El lado es el frente girado 45°: mismo diseño, cara hacia el arma.
const SKIN_HAND={recruitF:{down:[13,14],right:[14,14]},recruitM:{down:[13,14],right:[14,14]},commandoF:{down:[13,15],right:[14,15]},commandoM:{down:[13,15],right:[14,15]},
 operator:{down:[13,15],right:[14,14]},gas:{down:[13,14],right:[14,14]},ghillie:{down:[13,14],right:[14,13]},classic:{down:[13,14],right:[14,14]}};
const SKIN_GRID={
 recruitF:{down:["................", ".....HHHHHH.....", "....HhhHHHHH....", "...HhHHHHHHHH...", "...HHHHHHHHHd...", "..HHHHHHHHHHdd..", "..AddddddddddA..", "..ASSSSSSSSSSA..", "..ASEESSSSEESA..", ".AASWESSSSWESAA.", ".AASSSSssSSSSAA.", ".AA.sSSSSSSs.AA.", "..A.uTTTTTTu.A..", "...tTTtTTtTTu...", "..STTTuTTuTTTS..", "..sTTTLLlLTTTs..", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK....", "................"],
  right:["................", ".....HHHHHH.....", "....HHhhHHHH....", "...HHhHHHHHHH...", "...HHHHHHHHHHd..", "..HHHHHHHHHHHdd.", "..AAdddddddddd..", "..AASSSSSSSSSS..", ".AAASSSEESSSEE..", ".AAASSSWESSSWE..", ".AAASSSSSSssSS..", ".AA..sSSSSSSs...", "..A..uTTTTTTu...", "....tTTtTTtTTu..", "...sTTuTTuTTTTS.", "...sTTTLLlLTTTs.", ".....PPPPPPPP...", ".....PPp..pPP...", ".....KKK..KKK...", "................"]},
 recruitM:{down:["................", ".....HHHHHH.....", "....HhhHHHHH....", "...HhHHHHHHHH...", "...HHHHHHHHHd...", "..HHHHHHHHHHdd..", "..dddddddddddd..", "..aSSSSSSSSSSa..", "..aSEESSSSEESa..", "...SWESSSSWES...", "...SSSSssSSSS...", "....sSSSSSSs....", "....uTTTTTTu....", "...tTTtTTtTTu...", "..STTTuTTuTTTS..", "..sTTTLLlLTTTs..", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK....", "................"],
  right:["................", ".....HHHHHH.....", "....HHhhHHHH....", "...HHhHHHHHHH...", "...HHHHHHHHHHd..", "..HHHHHHHHHHHdd.", "..dddddddddddd..", "...aSSSSSSSSSS..", "...aSSSEESSSEE..", "....SSSWESSSWE..", "....SSSSSSssSS..", ".....sSSSSSSs...", ".....uTTTTTTu...", "....tTTtTTtTTu..", "...sTTuTTuTTTTS.", "...sTTTLLlLTTTs.", ".....PPPPPPPP...", ".....PPp..pPP...", ".....KKK..KKK...", "................"]},
 commandoF:{down:["................", "................", "....BBBBBBBb....", "...BbbBBBBBBB...", "..BBBBBBBBBBBBB.", "...AAAAAAAAAA...", "..AASSSSSSSSAA..", "..ASSSSSSSSSSAA.", "..ASEESSSSEESAA.", "..AcWESSSSWEcAAA", "..ASSSSssSSSSAAA", "...ScSSSSSScS.AA", "....sSSSSSSs..A.", "....uTTTTTTu....", "...tTTtTTtTTu...", "..STTTuTTuTTTS..", "..sTTTLLlLTTTs..", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK...."],
  right:["................", "................", ".....BBBBBBBb...", "....BbbBBBBBBB..", "...BBBBBBBBBBBBB", "..AAAAAAAAAAA...", ".AAASSSSSSSSSS..", ".AAASSSSSSSSSS..", ".AAASSSEESSSEE..", "AAAAScWESSSWEc..", "AAA.SSSSSSssSS..", "AA..SScSSSSScS..", "A....sSSSSSSs...", ".....uTTTTTTu...", "....tTTtTTtTTu..", "...sTTuTTuTTTTS.", "...sTTTLLlLTTTs.", ".....PPPPPPPP...", ".....PPp..pPP...", ".....KKK..KKK..."]},
 commandoM:{down:["................", "................", "....BBBBBBBb....", "...BbbBBBBBBB...", "..BBBBBBBBBBBBB.", "...aaaaaaaaaa...", "...SSSSSSSSSS...", "..aSSSSSSSSSSa..", "..aSEESSSSEESa..", "...cWESSSSWEc...", "...SSSSssSSSS...", "...ScSsSSsScS...", "....saaaaaas....", "....uTTTTTTu....", "...tTTtTTtTTu...", "..STTTuTTuTTTS..", "..sTTTLLlLTTTs..", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK...."],
  right:["................", "................", ".....BBBBBBBb...", "....BbbBBBBBBB..", "...BBBBBBBBBBBBB", "..aaaaaaaaaaa...", "..aaSSSSSSSSSS..", "...aSSSSSSSSSS..", "...aSSSEESSSEE..", "....ScWESSSWEc..", "....SSSSSSssSS..", "....SScSsSScSS..", ".....saaaaaas...", ".....uTTTTTTu...", "....tTTtTTtTTu..", "...sTTuTTuTTTTS.", "...sTTTLLlLTTTs.", ".....PPPPPPPP...", ".....PPp..pPP...", ".....KKK..KKK..."]},
 operator:{down:["................", "................", ".....HHHHHH.....", "....HhhHHHHH....", "...HhHHHHHHHH...", "..dHHHHHHHHHHd..", "..mGGGGGGGGGGm..", "..mGgGGGGGgGGm..", "..mmGGGmmGGGmm..", "...mMMMMMMMMm...", "...mMMMMMMMMm...", "....mMMMMMMm....", "...TVVVVVVVVT...", "..tTVvVVVVvVTu..", "..TTVVTTTTVVTT..", "..mTVVTtTuVVTm..", "..m.VLLLLLLV.m..", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK...."],
  right:["................", "................", ".....HHHHHH.....", "....HHhhHHHH....", "...HHhHHHHHHH...", "..dHHHHHHHHHHHd.", "..mmmGGGGGGGGGm.", "..mmmGGgGGGGgGm.", "..mmmmGGGmmGGGm.", "...mmMMMMMMMMm..", "...mmMMMMMMMMm..", "....mmMMMMMMm...", "....TVVVVVVVVT..", "...tTVvVVVVvVTu.", "...TTVVTTTTVVTm.", "...mTVVTtTuVVTm.", "...m.VLLLLLLV...", ".....PPPPPPPP...", ".....PPp..pPP...", ".....KKK..KKK..."]},
 gas:{down:["................", "................", ".....HHHHHH.....", "....HhhHHHHH....", "...HhHHHHHHHH...", "..dHHHHHHHHHHd..", "..ddddddddddd...", "..MMMMMMMMMMMm..", "..MRRrMMMMRRrm..", "..MRRRMMMMRRRm..", "...MMMMmmMMMm...", "....MmCCCCmm....", "....uTTCCTTu....", "...tTTtTTtTTu...", "..MTTTuTTuTTTM..", "..mTTTTTTTTTTm..", "...TTTLLlLTTT...", "....PPPPPPPP....", "....PPp..pPP....", "....KKK..KKK...."],
  right:["................", "................", ".....HHHHHH.....", "....HHhhHHHH....", "...HHhHHHHHHH...", "..dHHHHHHHHHHHd.", "..dddddddddddd..", "..mMMMMMMMMMMM..", "..mMMRRrMMMRRr..", "..mMMRRRMMMRRR..", "...mMMMMMmmMMM..", ".....mmCCCCCm...", ".....uTTCCTTu...", "....tTTtTTtTTu..", "...mTTTuTTuTTTM.", "...mTTTTTTTTTTm.", "....TTTLLlLTTT..", ".....PPPPPPPP...", ".....PPp..pPP...", ".....KKK..KKK..."]},
 ghillie:{down:["................", "....Y.YY.Y......", "...YXYXXYXY.Y...", "..YXXYXXXXYXX...", ".YXZXXXXXXXXZXY.", "..XXZZZZZZZZXX..", ".YXZSSSSSSSSZXY.", "..XZSEESSEESZX..", ".YXZcSSssSScZXY.", "..XXZsSSSSsZXX..", ".YXXuTTTTTTuXXY.", "..XXXXXXXXXXXX..", ".YXYXXZXXZXXYXY.", "..TXXXXXXXXXXT..", ".YuXZXXXXXXZXuY.", "..XYXXZXXZXXYX..", "...YXXXXXXXXY...", "....ZZZ..ZZZ....", "....KKK..KKK....", "................"],
  right:["................", "....Y.YY.Y......", "...YXYXXYXY.Y...", "..YXXYXXXXYXX...", ".YXZXXXXXXXXZXY.", "..XXXZZZZZZZZX..", ".YXXZSSSSSSSSZY.", "..XXZSSEESSEEZ..", ".YXXZScSSssScZY.", "..XXXZsSSSSsZX..", ".YXXXuTTTTTTuXY.", "..XXXXXXXXXXXXX.", ".YXYXXZXXZXXYXY.", "..TXXXXXXXXXXTS.", ".YuXZXXXXXXZXuY.", "...XYXXZXXZXXYX.", "....YXXXXXXXXY..", ".....ZZZ..ZZZ...", ".....KKK..KKK...", "................"]},
 classic:{down:["................","......HHHH......","....HHhhHHHH....","...HHhHHHHHHH...","...HHHHHHHHHd...","...TTTTTTTTTT...","..RRRRRRRRRRRR..","...SSSSSSSSSS...","...SSESSSSESS...","...SSSSSSSSSS...","...sSSSssSSSs...","....sSSSSSSs....","...uTTuTTuTTu...","..STTTuTTuTTTS..","..STTTuTTuTTTS..","...tTTTTTTTTt...","....PPPPPPPP....","....PPp..pPP....","....KKK..KKK....","................"],
  right:["................","......HHHH......","....HHHhhHHH....","...HHHhHHHHHH...","...HHHHHHHHHHd..","...TTTTTTTTTTT..","..RRRRRRRRRRRRR.","....SSSSSSSSSS..","....SSSSESSSES..","....SSSSSSSSSS..","....sSSSSSSssS..",".....sSSSSSSs...","....uTTuTTuTTu..","...sTTTuTTuTTTS.","...sTTTuTTuTTTS.","....tTTTTTTTTt..",".....PPPPPPPP...",".....PPp..pPP...",".....KKK..KKK...","................"]},
};
// ---------- BANDO ENEMIGO (modo Arcade) ----------
// Aspectos que el jugador no puede elegir: cara cubierta y ojos rojos para reconocerlos al instante.
const VCOL='#991b1b'; // uniforme vino de todo el bando
const VSKINS=[{k:'vSkull',n:'CALAVERA',p:'vskull'},{k:'vHood',n:'ENCAPUCHADO',p:'vskull'},{k:'vGas',n:'ANTIGÁS ROJO',p:'vgas'},
 {k:'vShield',n:'ESCUDO',p:'vshield'},{k:'vColossusC',n:'COMANDANTE',p:'vcolC'}];
{const VB={D:'#18181b',e:'#3f3f46',O:'#e7e5e4',o:'#a8a29e',Q:'#0a0a0a',R:'#ef4444',r:'#fca5a5'};
 Object.assign(SKIN_PAL,{vskull:VB,vgas:{H:'#27272a',h:'#3f3f46',d:'#18181b',M:'#3f3f46',m:'#27272a',R:'#ef4444',r:'#fecaca',C:'#7f1d1d'},
  vshield:Object.assign({},VB,{H:'#3f3f46',h:'#71717a',V:'#18181b',v:'#27272a',m:'#27272a',M:'#52525b'}),
  vcolC:Object.assign({},VB,{H:'#3f3f46',h:'#71717a',V:'#27272a',v:'#3f3f46',Y:'#facc15',F:'#7f1d1d'})});}
Object.assign(SKIN_BACK,{vSkull:{O:'D',o:'D',Q:'D',R:'D'},vHood:{Q:'D',R:'D',r:'D'},vGas:{R:'M',r:'M',C:'m'},vShield:{V:'H',R:'H'},vColossusC:{O:'H',Q:'H',R:'H'}});
for(const k of ['vSkull','vHood','vGas','vShield','vColossusC'])SKIN_HAND[k]={down:[13,14],right:[14,14]};
SKIN_GRID.vSkull={down:["................",".....DDDDDD.....","....DeeDDDDD....","...DeDDDDDDDD...","...DOOOOOOOOD...","..DOOOOOOOOOOD..","..DOQQOOOOQQOD..","..DOQROOOORQOD..","..DOQQOooOQQOD..","...DOOOQQOOOD...","...DOQoQoQoOD...","....DOoOoOoD....","....uTTTTTTu....","...tTTtTTtTTu...","..DTTTuTTuTTTD..","..DTTTLLlLTTTD..","....PPPPPPPP....","....PPp..pPP....","....KKK..KKK....","................"],
 right:["................",".....DDDDDD.....","....DDeeDDDD....","...DDeDDDDDDD...","...DDDOOOOOOOD..","..DDDOOOOOOOOOD.","..DDDOQQOOOQQOD.","..DDDOQROOOQRO..","...DDOQQOooQQO..","...DDOOOOQQOOO..","....DOQoQoQoQD..",".....DOoOoOoD...",".....uTTTTTTu...","....tTTtTTtTTu..","...DTTuTTuTTTTD.","...DTTTLLlLTTTD.",".....PPPPPPPP...",".....PPp..pPP...",".....KKK..KKK...","................"]};
SKIN_GRID.vHood={down:["................","......DDDD......","....DDeeDDDD....","...DDeDDDDDDD...","..DDeDDDDDDDDD..","..DDDQQQQQQDDD..","..DDQQQQQQQQDD..","..DDQRRQQRRQDD..","..DDQrQQQQrQDD..","..DDQQQQQQQQDD..","..DDDQQQQQQDDD..","...DDDDDDDDDD...","...DuTTTTTTuD...","...tTTtTTtTTu...","..DTTTuTTuTTTD..","..DTTTLLlLTTTD..","....PPPPPPPP....","....PPp..pPP....","....KKK..KKK....","................"],
 right:["................","......DDDD......","....DDDeeDDD....","...DDDeDDDDDD...","..DDDeDDDDDDDD..","..DDDDDQQQQQQD..","..DDDDQQQQQQQQ..","..DDDDQQRRQQRR..","..DDDDQQrQQQrQ..","..DDDDQQQQQQQQ..","..DDDDDQQQQQQD..","...DDDDDDDDDD...","....DuTTTTTTu...","....tTTtTTtTTu..","...DTTuTTuTTTTD.","...DTTTLLlLTTTD.",".....PPPPPPPP...",".....PPp..pPP...",".....KKK..KKK...","................"]};
SKIN_GRID.vShield={down:["................",".....HHHHHH.....","....HhhHHHHH....","...HhHHHHHHHH...","..HHHHHHHHHHHH..","..HVVVVVVVVVVH..","..HVRRRRRRRRVH..","..HVVVVVVVVVVH..","..HHHmmmmmmHHH..",".hHHmMMMMMMmHHh.","hHHhTTTTTTTThHHh","hHHTTtTTTTtTTHHh",".HHTVVVVVVVVTHH.","..DTVvVVVVvVTD..","..DTVVTTTTVVTD..","..DTVVLLLLVVTD..","....PPPPPPPP....","....PPp..pPP....","....KKK..KKK....","................"],
 right:["................",".....HHHHHH.....","....HHhhHHHH....","...HHhHHHHHHH...","..HHHHHHHHHHHH..","..HHHHHVVVVVVVH.","..HHHHHVRRRRRRH.","..HHHHHVVVVVVVH.","..HHHHHmmmmmmH..","..hHHHmMMMMMMm..",".hHHhTTTTTTTThH.",".hHHTTtTTTTtTTH.","..HHTVVVVVVVVTH.","...DTVvVVVVvVTD.","...DTVVTTTTVVTD.","...DTVVLLLLVVTD.",".....PPPPPPPP...",".....PPp..pPP...",".....KKK..KKK...","................"]};
SKIN_GRID.vColossusC={down:["................","....HHFFFFHH....","...HhhHHHHHHH...","..HhHHHHHHHHHH..","..HHOOOOOOOOHH..","..HOQQOOOOQQOH..","..HOQROOOORQOH..","..HOOOOQQOOOOH..","..HHOQOQOQOQHH..",".hhHHHHHHHHHHhh.","YYHHhTTTTTThHHYY","YHHHTTtTTtTTHHHY","FHHHVYVYVVVVHHHF","FHHDVvVVVVvVDHHF","FFDDVVVTTVVVDDFF","FFDDVVLLLLVVDDFF","FF.PPPPPPPPPP.FF","FF.PPPp..pPPP.FF","F..KKKK..KKKK..F","................"],
 right:["................","....HHFFFFHH....","...HHhhHHHHHH...","..HHhHHHHHHHHH..","..HHHHOOOOOOOOH.","..HHHOQQOOOQQOH.","..HHHOQROOOQROH.","..HHHOOOOQQOOOH.","..HHHHOQOQOQOHH.",".hhHHHHHHHHHHHh.","YHHHHhTTTTTThHYY","hHHHHTTtTTtTTHHh","hHHHHVVYVYVVVHHh","FHHHDVvVVVVvVDH.","FFFDDVVVTTVVVDD.","FFFDDVVLLLLVVDD.","FFF.PPPPPPPPPP..","FF..PPPp..pPPP..","F...KKKK..KKKK..","................"]};
SKIN_GRID.vGas=SKIN_GRID.gas; // la careta del antigás, con cristales rojos
// Premio del Arcade: al terminar el nivel 10 puedes vestirte como El Comandante (con tu color en el uniforme)
const SKIN_EXTRA=[{k:'commander',n:'COMANDANTE',p:'vcolC'}];
SKIN_GRID.commander=SKIN_GRID.vColossusC;SKIN_HAND.commander=SKIN_HAND.vColossusC;SKIN_BACK.commander=SKIN_BACK.vColossusC;
const SKIN_ALL=SKIN_KEYS.concat(SKIN_EXTRA.map(s=>s.k)); // los que viajan en línea

// Armas: de lado apuntan hacia adelante; de frente, hacia abajo (de espaldas, hacia arriba y detrás del cuerpo)
const GUN_PAL={N:'#3a4352',n:'#9aa6b8',w:'#7a5230',x:'#c08a52'};
const GUN_SPR={
 pistol:{side:[-1,0,["nNNNN","NN..."]],front:[-1,1,["NN","Nn","N."]]},
 smg:{side:[-2,0,["..nNNNNN","NNNNNNN.","N..NN..."]],front:[-1,-1,["nN","NN","NN","NN","N."]]},
 shotgun:{side:[-3,0,["wwxNNNNNNNNN","ww.wwx......"]],front:[-1,-2,["w.","x.","NN","NN","Nn","NN","N."]]},
 rifle:{side:[-3,-1,["......n......","wwxNNNNNNNNNN","w..NN.N......"]],front:[-1,-2,["n.","NN","NN","NN","Nn","NN","N.","N."]]}
};
// De frente el arma se sostiene al centro (columnas 7–8) con la punta abajo; de espaldas, la misma al revés,
// detrás del cuerpo y asomando sobre el casco. De lado, el cañón va en el renglón del carril de la bala.
const GUN_FRONT={pistol:[17,["NN","Nn","nN"]],smg:[14,["nN","NN","Nn","NN","N.","N."]],
 shotgun:[13,["xw","ww","NN","NN","Nn","NN","NN","N."]],rifle:[13,["xw","ww","NN","Nn","NN","NN","NN","NN","N.","N."]]};
const SK_LANE=13,SK_TOP=4; // renglón por donde viaja la bala (centro del soldado); renglones extra arriba para el cañón de espaldas
const SK_W=24,SK_H=20+SK_TOP+4,SK_OUT='#0b0e14';
function skinShade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const m=c=>Math.max(0,Math.min(255,Math.round(f<0?c*(1+f):c+(255-c)*f)));return `rgb(${m(r)},${m(g)},${m(b)})`;}
// Arma un mapa de 24 × 24: cada celda {ch, gun}. face: down/up/right; frame 0 quieto, 1 y 2 pasos.
// Dónde va el arma (columna, renglón sin los renglones extra) y dónde queda su punta
function gunPlace(S,face,weapon){
 if(!GUN_SPR[weapon])return null;
 if(face==='right'){const [hx]=SKIN_HAND[S].right,[ox,,gr]=GUN_SPR[weapon].side;let bi=0,best=-1;
  gr.forEach((r,i)=>{const e=r.replace(/\.+$/,'').length;if(e>best){best=e;bi=i;}});
  return {x:hx+ox,y:SK_LANE-bi,rows:gr,tip:[hx+ox+best-1,SK_LANE]};}
 const [y0,gr]=GUN_FRONT[weapon];
 if(face==='up'){const src=gr.slice().reverse();return {x:7,y:-2,rows:src,tip:[7,-2]};}
 return {x:7,y:y0,rows:gr,tip:[7,y0+gr.length-1]};
}
// Punta del cañón respecto al centro del soldado, en píxeles del juego (escala 2). face: down/up/right/left
const tipCache=new Map();
function gunTip(skin,face,weapon){
 const S=SKIN_GRID[skin]?skin:'recruitM',w=GUN_SPR[weapon]?weapon:'pistol',key=S+face+w;let t=tipCache.get(key);if(t)return t;
 const gp=gunPlace(S,face==='left'?'right':face,w),[c,r]=gp.tip;
 if(face==='right'||face==='left'){const dx=(c+1-8)*2;t={dx:face==='left'?-dx:dx,dy:0};}
 else if(face==='down')t={dx:0,dy:-27+2*r+2};else t={dx:0,dy:-27+2*r};
 tipCache.set(key,t);return t;
}
function skinCells(skin,face,frame,weapon){
 const S=SKIN_GRID[skin]?skin:'recruitM',view=face==='right'?'right':'down';
 let rows=SKIN_GRID[S][view].map(r=>r.split(''));
 const torso=rows.findIndex((r,y)=>y>=8&&(r.includes('T')||r.includes('u'))); // desde el renglón 8: la franja del casco CLÁSICO no cuenta como torso
 if(face==='up'){const map=SKIN_BACK[S]||{};rows=rows.map((r,y)=>y<torso?r.map(c=>map[c]||c):r.map(c=>c==='C'?'T':c));}
 // pasos: levanta una bota y luego la otra
 let b=-1;rows.forEach((r,y)=>{if(r.includes('K'))b=y;});
 if(frame&&b>0){const runs=[];let st=-1;rows[b].forEach((c,x)=>{if(c==='K'&&st<0)st=x;if(c!=='K'&&st>=0){runs.push([st,x-1]);st=-1;}});if(st>=0)runs.push([st,rows[b].length-1]);
  const run=runs[frame===1?0:runs.length-1];if(run)for(let x=run[0];x<=run[1];x++){rows[b-1][x]='K';rows[b][x]='.';}}
 let feet=0;rows.forEach((r,y)=>{if(r.some(c=>c!=='.'))feet=y;});
 const dy=19-feet+SK_TOP,cells=Array.from({length:SK_H},()=>Array(SK_W).fill(null));
 rows.forEach((r,y)=>r.forEach((c,x)=>{if(c!=='.'&&y+dy<SK_H)cells[y+dy][x]={ch:c,gun:false};}));
 const gp=gunPlace(S,face,weapon);
 if(gp)gp.rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c==='.')return;const X=gp.x+xx,Y=gp.y+yy+SK_TOP;if(X<0||Y<0||X>=SK_W||Y>=SK_H)return;
  if(face==='up'&&cells[Y][X])return; /* de espaldas el arma queda detrás */ cells[Y][X]={ch:c,gun:true};}));
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
 const top=feetY-(21+SK_TOP)*scale;
 if(left){g.save();g.translate(cx+9*scale,top);g.scale(-1,1);g.drawImage(spr,0,0);g.restore();}
 else g.drawImage(spr,cx-9*scale,top);
}
const GUN_OF=w=>GUN_SPR[w]?w:'pistol';
let playerSkin=null;
try{const s=localStorage.getItem('pb_skin');if(SKIN_ALL.includes(s))playerSkin=s;}catch(e){}
if(!playerSkin){playerSkin=Math.random()<.5?'recruitF':'recruitM';try{localStorage.setItem('pb_skin',playerSkin);}catch(e){}} // la primera vez: Recluta ♀ o ♂ al azar
