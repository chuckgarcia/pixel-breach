'use strict';
// Pixel Breach — Teclado
// ---------- INPUT ----------
function press(c,repeat){
 audio();
 if(settingsOpen){if(c==='Escape'||c==='KeyO')closeSettings();return;}
 if(c==='KeyO'&&state!=='intro'&&!repeat){openSettings();return;}
 if(state==='intro'){if(!repeat)endIntro();return;}
 if(c in KEYDIR){dirStack=dirStack.filter(k=>k!==c);dirStack.push(c);}
 keys[c]=true;
 if(repeat)return;
 if(state==='title'){
  if(/^Digit[1-4]$/.test(c))diff=+c.slice(5);
  if(c==='ArrowLeft'||c==='KeyA')diff=Math.max(1,diff-1);
  if(c==='ArrowRight'||c==='KeyD')diff=Math.min(4,diff+1);
  if(c==='Enter')startMatch();
  return;
 }
 if(state==='lobby')return;
 if(state==='over'){if(c==='Enter')overAgain();if(c==='Escape')overMenu();return;}
 if(c==='Escape'&&tut){skipTut();return;} // con la guía activa, ESC la salta
 if(c==='KeyP'||c==='Escape'){if(NET)showToast('SIN PAUSA EN LÍNEA');else paused=!paused;}
 if(c==='KeyF'){if(NET)showToast('EN LÍNEA LA NIEBLA LA ELIGE EL ANFITRIÓN');else{fog=!fog;SETTINGS.fog=fog;saveSettings();syncSettingsUI();showToast(fog?'NIEBLA DE GUERRA: ON':'NIEBLA DE GUERRA: OFF');}}
 if(c==='KeyM'){SETTINGS.sfx=!SETTINGS.sfx;SETTINGS.music=SETTINGS.sfx;muted=!SETTINGS.sfx;applyVolumes();saveSettings();syncSettingsUI();showToast(muted?'SONIDO: OFF':'SONIDO: ON');}
 const p=me();if(!p||paused)return;
 if(NET&&NET.role==='client'){ // en línea como invitado: el anfitrión decide, aquí solo mandamos lo que presionas
  if(c==='Space'||c==='KeyJ')NET.fc++;
  if(c==='KeyG'||c==='KeyK')NET.gc++;
  if(c==='KeyQ'||c==='KeyL')NET.qc++;
  sendInput();return;
 }
 if(c==='KeyQ'||c==='KeyL')cycle(p);
 if(c==='KeyG'||c==='KeyK')throwNade(p);   // al instante: un toque rápido también cuenta
 if(c==='Space'||c==='KeyJ')fire(p);
}
function release(c){keys[c]=false;dirStack=dirStack.filter(k=>k!==c);if(NET&&NET.role==='client')sendInput();}
addEventListener('keydown',ev=>{
 if(ev.target&&ev.target.tagName==='INPUT'){if(ev.code==='Enter'){ev.target.blur();if(ev.target.id==='hsName')arcSaveRecord(ev.target.value);else if(ev.target.id==='jcode')joinRoom(ev.target.value);else if(inviteCode&&ev.target.id==='pname')joinRoom(inviteCode);else{press('Enter');release('Enter');}}return;}
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(ev.code))ev.preventDefault();
 press(ev.code,ev.repeat);
});
addEventListener('keyup',ev=>release(ev.code));
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;dirStack=[];});
cv.addEventListener('pointerdown',ev=>{
 cv.focus();audio();
 if(state==='intro'){endIntro();return;}
 if(ev.pointerType==='touch'||isTouch){ // tocar la pantalla: empezar / revancha / continuar
  if(state==='over'&&(!NET||NET.role==='host')){press('Enter');release('Enter');}
 }
});
