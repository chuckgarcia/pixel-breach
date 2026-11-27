'use strict';
// Pixel Breach — Logotipo en pixel art: «PIXEL» claro, «BREACH» grande en verde con sombra y un punto naranja,
// y «DEATHMATCH CQB» espaciado. Se usa en la intro (letra por letra) y en el menú (como imagen).
const LOGO_BIG={ // 6 × 7, trazos de 2
 P:["#####.","##..##","##..##","#####.","##....","##....","##...."],
 I:["######","..##..","..##..","..##..","..##..","..##..","######"],
 X:["##..##","##..##",".####.","..##..",".####.","##..##","##..##"],
 E:["######","##....","##....","#####.","##....","##....","######"],
 L:["##....","##....","##....","##....","##....","##....","######"],
 B:["#####.","##..##","##..##","#####.","##..##","##..##","#####."],
 R:["#####.","##..##","##..##","#####.","##.##.","##..##","##..##"],
 A:[".####.","##..##","##..##","######","##..##","##..##","##..##"],
 C:[".#####","##....","##....","##....","##....","##....",".#####"],
 H:["##..##","##..##","##..##","######","##..##","##..##","##..##"]};
const LOGO_SMALL={ // 5 × 5
 D:["####.","#...#","#...#","#...#","####."],E:["#####","#....","####.","#....","#####"],A:[".###.","#...#","#####","#...#","#...#"],
 T:["#####","..#..","..#..","..#..","..#.."],H:["#...#","#...#","#####","#...#","#...#"],M:["#...#","##.##","#.#.#","#...#","#...#"],
 C:[".####","#....","#....","#....",".####"],Q:[".###.","#...#","#.#.#","#..#.",".##.#"],B:["####.","#...#","####.","#...#","####."]};
// Una letra como imagen: contorno, sombra y relleno con brillo arriba y sombra abajo
function logoGlyph(rows,s,fill,top,bottom,shadow,outline,off){
 off=off||Math.max(1,Math.round(s/2));
 const w=rows[0].length,h=rows.length,pad=Math.max(1,Math.round(s/3)),cv=document.createElement('canvas');
 cv.width=w*s+off+pad*2;cv.height=h*s+off+pad*2;const g=cv.getContext('2d');if(!g||!g.fillRect)return cv;
 const each=(fn)=>rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='#')fn(x,y);}));
 g.fillStyle=outline;each((x,y)=>{g.fillRect(x*s,y*s,s+pad*2,s+pad*2);g.fillRect(x*s+off,y*s+off,s+pad*2,s+pad*2);}); // contorno de letra y sombra
 g.fillStyle=shadow;each((x,y)=>g.fillRect(pad+x*s+off,pad+y*s+off,s,s)); // sombra abajo a la derecha
 each((x,y)=>{g.fillStyle=y===0?top:y===h-1?bottom:fill;g.fillRect(pad+x*s,pad+y*s,s,s);});
 return cv;
}
// Piezas del logotipo con su posición (x, y) relativa a la esquina superior izquierda. u = píxeles por punto.
function logoPieces(u,withSub){
 const out=[],gap=u,pxS=u,brS=u*2;
 const pix='PIXEL',bre='BREACH';
 const pixW=pix.length*6*pxS+(pix.length-1)*gap*1.5,breW=bre.length*6*brS+(bre.length-1)*gap*2+brS*2+gap*2;
 const W=Math.max(pixW,breW);
 [...pix].forEach((c,i)=>out.push({img:logoGlyph(LOGO_BIG[c],pxS,'#eaffbf','#f7ffe0','#c9ec86','#1d5a32','#04140a'),x:(W-pixW)/2+i*(6*pxS+gap*1.5),y:0,row:0}));
 const by=7*pxS+gap*2.5;
 [...bre].forEach((c,i)=>out.push({img:logoGlyph(LOGO_BIG[c],brS,'#4ade80','#86efac','#22c55e','#14532d','#04140a'),x:(W-breW)/2+i*(6*brS+gap*2),y:by,row:1}));
 out.push({img:logoGlyph(["##","##"],brS,'#f59e0b','#fbbf24','#d97706','#7c2d12','#04140a'),x:(W-breW)/2+bre.length*(6*brS+gap*2),y:by+5*brS,row:1,dot:true});
 let H=by+7*brS+gap*2;
 if(withSub){const s=Math.max(2,Math.round(u/2)),txt='DEATHMATCH CQB',adv=5*s+s*3,sw=txt.length*adv-s*3,sy=H+gap*2;
  [...txt].forEach((c,i)=>{if(c!==' ')out.push({img:logoGlyph(LOGO_SMALL[c],s,'#94a3b8','#cbd5e1','#64748b','#0f172a','#04070c'),x:(W-sw)/2+i*adv,y:sy,row:2});});
  H=sy+5*s+s*2;}
 return {pieces:out,w:W+u*2,h:H+u};
}
// El logotipo completo como una imagen (para el menú)
function logoCanvas(u,withSub){
 const L=logoPieces(u,withSub),cv=document.createElement('canvas');cv.width=Math.ceil(L.w);cv.height=Math.ceil(L.h);
 const g=cv.getContext('2d');if(g&&g.drawImage)for(const p of L.pieces)g.drawImage(p.img,Math.round(p.x),Math.round(p.y));
 return cv;
}
