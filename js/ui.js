'use strict';
// Pixel Breach — Ajustes, controles táctiles e inicio del juego
// ---------- AJUSTES ----------
let settingsOpen=false,pausedBySettings=false,installEvt=null;
const fsOK=!!(document.documentElement&&document.documentElement.requestFullscreen);
function openSettings(){
 if(settingsOpen)return;settingsOpen=true;$('settings').style.display='flex';syncSettingsUI();
 if(state==='play'&&!NET&&!paused){paused=true;pausedBySettings=true;}
}
function closeSettings(){
 if(!settingsOpen)return;settingsOpen=false;$('settings').style.display='none';
 if(pausedBySettings){paused=false;pausedBySettings=false;}
}
function syncSettingsUI(){
 const tog=(id,on)=>{const b=$(id);b.textContent=on?'SÍ':'NO';b.classList.toggle('on',!!on);};
 tog('sSfx',SETTINGS.sfx);tog('sMus',SETTINGS.music);tog('sVib',SETTINGS.vibrate);
 $('sSfxVol').value=Math.round(SETTINGS.sfxVol*100);$('sMusVol').value=Math.round(SETTINGS.musicVol*100);
 const online=!!NET;tog('sFog',online?NET.fog!==false:fog);$('sFog').disabled=online;
 $('sFogNote').textContent=online?'En línea, la niebla la elige el anfitrión.':'';
 $('sVibRow').style.display=isTouch&&navigator.vibrate?'':'none';
 $('sFsRow').style.display=fsOK?'':'none';$('sFs').textContent=document.fullscreenElement?'SALIR':'COMPLETA';
 $('sInstall').style.display=installEvt?'':'none';
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent||'')&&!(navigator.standalone);$('sIosNote').style.display=ios?'':'none';
}
$('sSfx').addEventListener('click',()=>{SETTINGS.sfx=!SETTINGS.sfx;muted=!SETTINGS.sfx;audio();applyVolumes();saveSettings();syncSettingsUI();sfx('pick');});
$('sMus').addEventListener('click',()=>{SETTINGS.music=!SETTINGS.music;audio();applyVolumes();saveSettings();syncSettingsUI();musicForState();});
$('sSfxVol').addEventListener('input',e=>{SETTINGS.sfxVol=e.target.value/100;applyVolumes();saveSettings();});
$('sSfxVol').addEventListener('change',()=>sfx('pick'));
$('sMusVol').addEventListener('input',e=>{SETTINGS.musicVol=e.target.value/100;applyVolumes();saveSettings();});
$('sVib').addEventListener('click',()=>{SETTINGS.vibrate=!SETTINGS.vibrate;saveSettings();syncSettingsUI();try{SETTINGS.vibrate&&navigator.vibrate(30);}catch(e){}});
$('sFog').addEventListener('click',()=>{if(NET)return;fog=!fog;SETTINGS.fog=fog;saveSettings();syncSettingsUI();});
$('sFs').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{await document.documentElement.requestFullscreen();try{await screen.orientation.lock('landscape');}catch(e){}}}catch(e){}syncSettingsUI();});
$('sTut').addEventListener('click',()=>{try{localStorage.removeItem('pb_tut');}catch(e){}closeSettings();showToast('LA GUÍA APARECE EN TU PRÓXIMA PARTIDA SOLO','#facc15');});
$('sInstall').addEventListener('click',async()=>{if(!installEvt)return;installEvt.prompt();try{await installEvt.userChoice;}catch(e){}installEvt=null;syncSettingsUI();});
$('sClose').addEventListener('click',closeSettings);
$('gearMenu').addEventListener('click',()=>{audio();openSettings();});
$('gearGame').addEventListener('click',()=>{audio();openSettings();});
$('rotateOk').addEventListener('click',()=>document.body.classList.add('portrait-ok'));
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;if(settingsOpen)syncSettingsUI();});
// instalable y sin internet (solo en la página publicada, no dentro de Claude)
if('serviceWorker' in navigator&&location.protocol==='https:'&&/github\.io$/.test(location.hostname)){
 addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

// ---------- CONTROLES TÁCTILES ----------
let isTouch=false;
function enableTouch(){if(isTouch)return;isTouch=true;document.body.classList.add('touch');}
try{if(matchMedia('(pointer:coarse)').matches||'ontouchstart' in window)enableTouch();}catch(e){}
addEventListener('touchstart',enableTouch,{passive:true});
const pad=document.getElementById('pad');
const padSpans={ArrowUp:pad.querySelector('.u'),ArrowDown:pad.querySelector('.d'),ArrowLeft:pad.querySelector('.l'),ArrowRight:pad.querySelector('.r')};
let padCode=null;
function setPadDir(code){
 if(code===padCode)return;
 if(padCode){release(padCode);padSpans[padCode].classList.remove('on');}
 padCode=code;
 if(code){press(code);padSpans[code].classList.add('on');}
}
// Joystick por deslizamiento: la dirección sale de hacia dónde mueves el dedo, no de dónde está.
// El punto de referencia (ancla) sigue al dedo, así que puedes salirte del círculo sin perder el control.
const DEAD=10,MAXR=28;
const knob=document.getElementById('knob');
let padId=null,ax=0,ay=0;
function dirOf(dx,dy){return Math.abs(dx)>Math.abs(dy)?(dx>0?'ArrowRight':'ArrowLeft'):(dy>0?'ArrowDown':'ArrowUp');}
function padUpdate(x,y){
 let dx=x-ax,dy=y-ay,d=Math.hypot(dx,dy);
 if(d>MAXR){ax=x-dx/d*MAXR;ay=y-dy/d*MAXR;dx=x-ax;dy=y-ay;d=MAXR;}
 setPadDir(d<DEAD?null:dirOf(dx,dy));
 const k=d?Math.min(1,d/MAXR)*48:0;
 knob.style.transform=`translate(${d?dx/d*k:0}px,${d?dy/d*k:0}px)`;
}
// iPhone/iPad: Safari ignora "user-scalable=no", así que bloqueamos aquí el zoom por doble toque y por pellizco.
pad.addEventListener('touchstart',ev=>ev.preventDefault(),{passive:false});
pad.addEventListener('touchend',ev=>ev.preventDefault(),{passive:false});
$('btns').addEventListener('touchend',ev=>ev.preventDefault(),{passive:false});
let lastTouchEnd=0;
document.addEventListener('touchend',ev=>{
 const now=Date.now(),t=ev.target;
 const typing=t&&t.closest&&t.closest('input,textarea,select,details,button,a,.ovl'); // menús y botones funcionan normal
 if(!typing&&now-lastTouchEnd<350)ev.preventDefault(); // segundo toque rápido = no zoom
 lastTouchEnd=now;
},{passive:false});
for(const n of ['gesturestart','gesturechange','gestureend'])document.addEventListener(n,ev=>ev.preventDefault(),{passive:false});
document.addEventListener('dblclick',ev=>{if(isTouch)ev.preventDefault();},{passive:false});
pad.addEventListener('pointerdown',ev=>{
 ev.preventDefault();try{pad.setPointerCapture(ev.pointerId);}catch(e){}
 padId=ev.pointerId;pad.classList.add('active');
 const r=pad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
 // si tocas sobre una flecha, responde al instante; si tocas cerca del centro, espera a que deslices
 if(Math.hypot(ev.clientX-cx,ev.clientY-cy)>DEAD+8){ax=cx;ay=cy;}else{ax=ev.clientX;ay=ev.clientY;}
 padUpdate(ev.clientX,ev.clientY);
});
addEventListener('pointermove',ev=>{if(ev.pointerId===padId)padUpdate(ev.clientX,ev.clientY);});
function padEnd(ev){if(ev.pointerId!==padId)return;padId=null;pad.classList.remove('active');knob.style.transform='';setPadDir(null);}
addEventListener('pointerup',padEnd);addEventListener('pointercancel',padEnd);
document.querySelectorAll('#btns button').forEach(b=>{
 const k=b.dataset.k;
 b.addEventListener('pointerdown',ev=>{ev.preventDefault();try{b.setPointerCapture(ev.pointerId);}catch(e){}b.classList.add('on');press(k);});
 const up=()=>{if(!b.classList.contains('on'))return;b.classList.remove('on');release(k);};
 for(const n of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(n,up);
 b.addEventListener('contextmenu',ev=>ev.preventDefault());
});
addEventListener('contextmenu',ev=>{if(isTouch)ev.preventDefault();});

setTheme(THEME_KEYS[ri(0,THEME_KEYS.length-1)]);genMap();
state=/^#[A-Za-z0-9]{4}$/.test(location.hash)?'title':'intro'; // con invitación vamos directo al menú
requestAnimationFrame(loop);
