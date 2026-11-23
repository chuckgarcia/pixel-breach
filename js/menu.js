'use strict';
// Pixel Breach — Menú principal
// ---------- MENÚ ----------
const $=id=>document.getElementById(id);
const menuEl=$('menu'),overEl=$('overBtns'),nameEl=$('pname'),dnameEl=$('dname'),sw=$('swatches');
let shownState=null,shownDiff=null;
function syncOverlays(){
 if(state!==shownState){shownState=state;menuEl.style.display=state==='title'?'flex':'none';overEl.style.display=state==='over'?'flex':'none';$('lobby').style.display=state==='lobby'?'flex':'none';if(state==='title')buildHowto();
  const host=!NET||NET.role==='host';$('again').style.display=host?'':'none';$('toMenu').textContent=!NET?'MENÚ':host?'SALA':'SALIR';
  if(state==='lobby')renderLobby();}
 if(diff!==shownDiff){shownDiff=diff;dnameEl.textContent=DIFF[diff].name;}
 $('gearMenu').style.display=(state==='title'&&!menuEl.classList.contains('invite'))||state==='lobby'?'block':'none';
 $('gearGame').style.display=state==='play'?'block':'none';
}
function save(){try{localStorage.setItem('pb_name',playerName);localStorage.setItem('pb_color',playerColor);}catch(e){}}
nameEl.value=playerName;
nameEl.addEventListener('input',()=>{const v=nameEl.value.toUpperCase().replace(/[^A-Z0-9ÑÁÉÍÓÚÜ _-]/g,'').slice(0,10);if(v!==nameEl.value)nameEl.value=v;playerName=v;save();});
function buildSwatches(){
 sw.textContent='';
 for(const [n,c] of PALETTE){const b=document.createElement('button');b.style.background=c;b.title=n;b.setAttribute('aria-label',n);
  if(c===playerColor)b.classList.add('sel');
  b.addEventListener('click',()=>{playerColor=c;save();buildSwatches();});sw.appendChild(b);}
}
buildSwatches();
$('dprev').addEventListener('click',()=>{diff=Math.max(1,diff-1);});
function stepTheme(d){const i=THEME_OPTS.indexOf(themeChoice);themeChoice=THEME_OPTS[(i+d+THEME_OPTS.length)%THEME_OPTS.length];
 if(themeChoice!=='random'&&(state==='title'||state==='lobby')){setTheme(themeChoice);genMap();} // el fondo muestra el escenario elegido
 $('tname').textContent=themeLabel(themeChoice);$('ltName').textContent=themeLabel(themeChoice);}
function stepPreset(d){SETTINGS.preset=Math.max(0,Math.min(PRESETS.length-1,(SETTINGS.preset|0)+d));saveSettings();$('pname2').textContent=presetLabel(SETTINGS.preset);$('lpName').textContent=presetLabel(SETTINGS.preset);shownState=null;}
$('pprev').addEventListener('click',()=>stepPreset(-1));$('pnext').addEventListener('click',()=>stepPreset(1));
$('pname2').textContent=presetLabel(SETTINGS.preset);
$('tprev').addEventListener('click',()=>stepTheme(-1));$('tnext').addEventListener('click',()=>stepTheme(1));
$('tname').textContent=themeLabel(themeChoice);
$('ver').textContent='v'+VERSION;$('ver').classList.add('inv');
// vista previa del soldado con el color elegido: camina y gira
const pv=$('pv');window.pvxMain=pv.getContext('2d');
const lpvx=$('lpv').getContext('2d');
function drawPreview(pvx,color){
 pvx=pvx||window.pvxMain;color=color||playerColor;
 const faces=['down','right','up','left'],face=faces[Math.floor(clock/1.1)%4],frame=Math.floor(clock*6)%2?1:2;
 pvx.imageSmoothingEnabled=false;pvx.clearRect(0,0,52,64);
 pvx.fillStyle='rgba(0,0,0,.35)';pvx.fillRect(8,56,36,6);
 const spr=sprite(color,face==='left'?'right':face,frame,false);
 const gun=()=>{const [gx,gy,w,h]=GUN_RECT[face];pvx.fillStyle='#05070b';pvx.fillRect(2+gx*4-2,2+gy*4-2,w*4+4,h*4+4);pvx.fillStyle='#1f2937';pvx.fillRect(2+gx*4,2+gy*4,w*4,h*4);};
 if(face==='up')gun();
 if(face==='left'){pvx.save();pvx.translate(52,0);pvx.scale(-1,1);pvx.drawImage(spr,0,0,52,64);pvx.restore();}else pvx.drawImage(spr,0,0,52,64);
 if(face!=='up')gun();
}
$('dnext').addEventListener('click',()=>{diff=Math.min(4,diff+1);});
$('playAI').addEventListener('click',()=>{audio();startMatch();});
$('again').addEventListener('click',()=>{audio();overAgain();});
$('toMenu').addEventListener('click',()=>overMenu());
function overAgain(){if(!NET)startMatch();else if(NET.role==='host')hostStart();}
function overMenu(){if(!NET)toTitle();else if(NET.role==='host')hostToLobby();else netLeave();}
function buildHowto(){
 const h=$('howto');h.textContent='';
 const add=(a,b,col,cls)=>{const x=document.createElement('div');x.textContent=a;if(cls)x.className=cls;if(col)x.style.color=col;h.appendChild(x);if(b!==undefined){const y=document.createElement('div');y.textContent=b;h.appendChild(y);}};
 add('ESTILOS DE LAS IAs',undefined,null,'h');
 for(const p of PERS)add(p.name,{asaltante:'va directo por ti',flanqueador:'te corta el paso',campero:'espera en pasillos largos',recolector:'junta armas primero'}[p.key],p.color);
 add('CONTROLES',undefined,null,'h');
 const C=isTouch?[['CRUCETA','desliza el dedo para moverte'],['FUEGO','disparar (mantén presionado)'],['GRAN','lanzar granada'],['ARMA','cambiar arma'],['II','pausa']]
  :[['WASD / FLECHAS','moverte'],['ESPACIO / J','disparar'],['G / K','lanzar granada'],['Q / L','cambiar arma'],['F','niebla de guerra (en línea la elige el anfitrión)'],['P / ESC','pausa · M sonido · O ajustes']];
 for(const [a,b] of C)add(a,b,'#facc15');
 add('REGLAS',undefined,null,'h');
 {const pr=PRESETS[SETTINGS.preset]||PRESETS[1];add('',`Gana quien llegue a ${pr.f} bajas o tenga más al acabar los ${pr.t/60} minutos (cámbialo en PARTIDA). La pistola es infinita; recoge armas, granadas y botiquines.`);}
 add('CRÉDITOS',undefined,null,'h');
 add('Idea y diseño','chuckgarcia');add('Desarrollo','Claude (Anthropic)');add('Conexión en línea','PeerJS (licencia MIT)');add('Versión','v'+VERSION);
}
