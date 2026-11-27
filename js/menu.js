'use strict';
// Pixel Breach — Menú principal
// ---------- MENÚ ----------
const $=id=>document.getElementById(id);
const menuEl=$('menu'),overEl=$('overBtns'),nameEl=$('pname'),dnameEl=$('dname');
let shownState=null,shownDiff=null;
function syncOverlays(){
 if(state!==shownState){shownState=state;document.body.classList.toggle('menus',state==='title'||state==='lobby'); /* en celular: menú a pantalla completa, sin controles */menuEl.style.display=state==='title'?'flex':'none';overEl.style.display=state==='over'?'flex':'none';$('lobby').style.display=state==='lobby'?'flex':'none';if(state==='title')buildHowto();
  const host=!NET||NET.role==='host';$('again').style.display=host?'':'none';$('toMenu').textContent=!NET?'MENÚ':host?'SALA':'SALIR';
  if(state==='lobby')renderLobby();}
 if(diff!==shownDiff){shownDiff=diff;dnameEl.textContent=DIFF[diff].name;}
 $('gearMenu').style.display=(state==='title'&&!menuEl.classList.contains('invite'))||state==='lobby'?'block':'none';
 $('gearGame').style.display=state==='play'?'block':'none';
}
function save(){try{localStorage.setItem('pb_name',playerName);localStorage.setItem('pb_color',playerColor);}catch(e){}}
nameEl.value=playerName;
nameEl.addEventListener('input',()=>{const v=nameEl.value.toUpperCase().replace(/[^A-Z0-9ÑÁÉÍÓÚÜ _-]/g,'').slice(0,10);if(v!==nameEl.value)nameEl.value=v;playerName=v;save();});
// ---- color: ◀ VERDE ▶, igual que las demás opciones ----
function colorIdx(c){return Math.max(0,PALETTE.findIndex(p=>p[1]===c));}
function showColor(el,c){if(!el||!el.children||el.children.length<2)return;const p=PALETTE[colorIdx(c)];const [i,t]=el.children;i.style.background=p[1];t.textContent=p[0];el.style.color=p[1];el.title=p[0];}
function buildSwatches(){showColor($('cname'),playerColor);if(typeof NET!=='undefined'&&NET&&state==='lobby')showColor($('lcname'),myLobbyColor());} // nombre histórico: refresca los selectores
function stepColor(d,taken){ // recorre la paleta dando la vuelta; en la sala salta los colores de otros
 let i=colorIdx(state==='lobby'&&typeof NET!=='undefined'&&NET?myLobbyColor():playerColor);
 for(let k=0;k<PALETTE.length;k++){i=(i+d+PALETTE.length)%PALETTE.length;if(!taken||!taken.has(PALETTE[i][1]))return PALETTE[i][1];}
 return null;
}
$('cprev').addEventListener('click',()=>{playerColor=stepColor(-1);save();buildSwatches();});
$('cnext').addEventListener('click',()=>{playerColor=stepColor(1);save();buildSwatches();});
// deslizar el dedo sobre el soldado también cambia de color
function swipeColor(el,fn){let x0=null;el.addEventListener('pointerdown',e=>{x0=e.clientX;});el.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>24)fn(dx<0?1:-1);});el.addEventListener('pointercancel',()=>{x0=null;});}
swipeColor($('pv'),d=>$(d>0?'cnext':'cprev').click());
buildSwatches();
// unirse con código: en celular el campo se abre con «UNIRSE…»
$('joinOpen').addEventListener('click',()=>{$('joinRow').classList.toggle('open');if($('joinRow').classList.contains('open'))$('jcode').focus();});
$('dprev').addEventListener('click',()=>{diff=Math.max(1,diff-1);});
function stepTheme(d){const i=THEME_OPTS.indexOf(themeChoice);themeChoice=THEME_OPTS[(i+d+THEME_OPTS.length)%THEME_OPTS.length];
 if(themeChoice!=='random'&&(state==='title'||state==='lobby')){setTheme(themeChoice);genMap();} // el fondo muestra el escenario elegido
 $('tname').textContent=themeLabel(themeChoice);$('ltName').textContent=themeLabel(themeChoice);}
function stepPreset(d){SETTINGS.preset=Math.max(0,Math.min(PRESETS.length-1,(SETTINGS.preset|0)+d));saveSettings();$('pname2').textContent=presetLabel(SETTINGS.preset);$('lpName').textContent=presetLabel(SETTINGS.preset);shownState=null;}
$('pprev').addEventListener('click',()=>stepPreset(-1));$('pnext').addEventListener('click',()=>stepPreset(1));
$('pname2').textContent=presetLabel(SETTINGS.preset);
$('tprev').addEventListener('click',()=>stepTheme(-1));$('tnext').addEventListener('click',()=>stepTheme(1));
$('tname').textContent=themeLabel(themeChoice);
{const lb=$('logoBox');if(lb&&lb.appendChild){const c=logoCanvas(4,false);c.id='logo';lb.appendChild(c);}} // logotipo en pixel art
$('ver').textContent='v'+VERSION;$('ver').classList.add('inv');
// vista previa del soldado con el color elegido: camina y gira
const pv=$('pv');window.pvxMain=pv.getContext('2d');
const lpvx=$('lpv').getContext('2d');
function drawPreview(pvx,color){
 pvx=pvx||window.pvxMain;color=color||playerColor;if(!pvx||!pvx.clearRect)return;
 const faces=['down','right','up','left'],face=faces[Math.floor(clock/1.1)%4],frame=Math.floor(clock*6)%2?1:2;
 pvx.imageSmoothingEnabled=false;pvx.clearRect(0,0,52,64);
 pvx.fillStyle='rgba(0,0,0,.35)';pvx.fillRect(10,56,32,5);
 drawSkin(pvx,playerSkin,color,face,frame,false,'rifle',26,58,2);
}
// ---- aspecto: ◀ RECLUTA ♀ ▶ (solo visual: todos miden y resisten lo mismo) ----
function showSkin(){const n=skinOf(playerSkin).n;for(const id of ['kname','lkname']){const el=$(id);if(el)el.textContent=n;}
 const p=PALETTE[colorIdx(playerColor)];for(const id of ['pv','lpv']){const el=$(id);if(el&&el.setAttribute)el.setAttribute('aria-label',`Vista previa de tu soldado: ${n.replace('♀','versión femenina').replace('♂','versión masculina')}, ${p[0].toLowerCase()}`);}}
function stepSkin(d){const i=SKIN_KEYS.indexOf(playerSkin);playerSkin=SKIN_KEYS[(i+d+SKIN_KEYS.length)%SKIN_KEYS.length];try{localStorage.setItem('pb_skin',playerSkin);}catch(e){}showSkin();
 if(typeof NET!=='undefined'&&NET&&state==='lobby'){if(NET.role==='host')hostLobbyUpdate();else{try{NET.conn.send({t:'skin',k:playerSkin});}catch(e){}}}}
$('kprev').addEventListener('click',()=>stepSkin(-1));$('knext').addEventListener('click',()=>stepSkin(1));
$('lkprev').addEventListener('click',()=>stepSkin(-1));$('lknext').addEventListener('click',()=>stepSkin(1));
showSkin();
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
 add('ASPECTO',undefined,null,'h');
 add('Todos los aspectos miden y resisten lo mismo; solo cambia cómo se ven. Cada arma tiene su dibujo, así ves qué lleva cada rival.',undefined,null,'full');
 add('CONTROLES',undefined,null,'h');
 const C=isTouch?[['CRUCETA','desliza el dedo para moverte'],['FUEGO','disparar (mantén presionado)'],['GRAN','lanzar granada'],['ARMA','cambiar arma'],['II','pausa']]
  :[['WASD / FLECHAS','moverte'],['ESPACIO / J','disparar'],['G / K','lanzar granada'],['Q / L','cambiar arma'],['F','niebla de guerra (en línea la elige el anfitrión)'],['P / ESC','pausa · M sonido · O ajustes']];
 for(const [a,b] of C)add(a,b,'#facc15');
 add('REGLAS',undefined,null,'h');
 {const pr=PRESETS[SETTINGS.preset]||PRESETS[1];add(`Gana quien llegue a ${pr.f} bajas o tenga más al acabar los ${pr.t/60} minutos (cámbialo en PARTIDA). La pistola es infinita; recoge armas, granadas y botiquines.`,undefined,null,'full');}
 add('CRÉDITOS',undefined,null,'h');
 add('Idea y diseño','chuckgarcia');add('Desarrollo','Claude (Anthropic)');add('Conexión en línea','PeerJS (licencia MIT)');add('Versión','v'+VERSION);
}
