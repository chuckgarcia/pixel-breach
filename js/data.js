'use strict';
// Pixel Breach — Versión, constantes, escenarios, armas, roles y estado global
// Versionado semántico vMAYOR.MENOR.PARCHE (ver CHANGELOG.md).
// Cambios en el protocolo en línea suben MENOR: anfitrión e invitado deben coincidir en MAYOR.MENOR.
const VERSION='0.15.6';
const cv=document.getElementById('c'), ctx=cv.getContext('2d');
const T=32,COLS=21,ROWS=15,HUD=44,W=COLS*T,H=ROWS*T;
const FLOOR=0,WALL=1,CRATE=2,LAVA=3; // LAVA: no se puede pisar, pero las balas, granadas y la vista pasan por encima
// ---------- ESCENARIOS ----------
const THEMES={
 bunker:{name:'BÚNKER',fog:'rgba(5,7,12,.74)',debris:['#a16207','#78350f']},
 jungle:{name:'JUNGLA',fog:'rgba(3,10,5,.74)',debris:['#2f9e4f','#14532d']},
 brick:{name:'LADRILLO',fog:'rgba(8,6,6,.74)',debris:['#a16207','#78350f']},
 arcade:{name:'NEÓN',fog:'rgba(0,0,0,.8)',debris:['#fbbf24','#2b4cff'],wrap:true},
 volcano:{name:'VOLCÁN',fog:'rgba(10,4,2,.76)',debris:['#f97316','#3f2a1d'],lava:true},
 desert:{name:'DESIERTO',fog:'rgba(20,14,6,.72)',debris:['#4d5a2c','#c2a36b']},
 killhouse:{name:'KILLHOUSE',fog:'rgba(6,6,6,.74)',debris:['#1f2937','#4b5563']},
};
const THEME_KEYS=Object.keys(THEMES),THEME_OPTS=['random',...THEME_KEYS];
let themeKey='bunker',theme=THEMES.bunker,WRAP=false,themeChoice='random';
function setTheme(k){themeKey=THEMES[k]?k:'bunker';theme=THEMES[themeKey];WRAP=!!theme.wrap;}
const themeLabel=k=>k==='random'?'ALEATORIO':THEMES[k].name;
const wx=x=>WRAP?((x%COLS)+COLS)%COLS:x; // en ARCADE, salir por un lado te lleva al otro
const blocks=t=>t===WALL||t===CRATE;
const SIGHT=9,HEARING=11,MEMORY=6; // casillas de vista, de oído y segundos de memoria de la IA
const PRESETS=[{n:'RÁPIDA',t:120,f:5},{n:'NORMAL',t:180,f:10},{n:'LARGA',t:300,f:20},{n:'MARATÓN',t:600,f:30}];
let fragLimit=10,matchTime=180;
// ---------- MODOS ----------
// dm: deathmatch · ctf: captura la bandera (bandera neutral al centro, se lleva a tu base) · lms: último en pie (N vidas)
const CTF_PRESETS=[{c:1,t:180},{c:3,t:300},{c:5,t:480}],LMS_PRESETS=[{l:1,t:240},{l:3,t:360},{l:5,t:480}];
const MODES={dm:{n:'DEATHMATCH',p:PRESETS,key:'preset',max:5},ctf:{n:'CAPTURA LA BANDERA',p:CTF_PRESETS,key:'pctf',max:4},lms:{n:'ÚLTIMO EN PIE',p:LMS_PRESETS,key:'plms',max:5},
 arcade:{n:'ARCADE',p:[{t:0}],key:'parc',max:1,solo:true}}; // arcade: un jugador, niveles en js/levels.js
const MODE_KEYS=['dm','ctf','lms','arcade'];
const FLAG_HOME=[10,7],FLAG_RETURN=20,FLAG_SLOW=.85; // la bandera vuelve sola a los 20 s; quien la lleva va 15 % más lento
let gameMode='dm',capLimit=3,lifeCount=3,flag=null,goalSign=null;
const menuMode=()=>MODES[SETTINGS.mode]?SETTINGS.mode:'dm';
function presetIdx(m){m=m||menuMode();const v=SETTINGS[MODES[m].key];return MODES[m].p[v]?v|0:1;}
function presetLabel(i,m){m=MODES[m]?m:menuMode();const L=MODES[m].p,p=L[i]||L[1];
 if(m==='ctf')return `${p.c} CAPTURA${p.c>1?'S':''} · ${p.t/60} MIN`;
 if(m==='lms')return `${p.l} VIDA${p.l>1?'S':''} · ${p.t/60} MIN`;
 return `${p.n} · ${p.t/60} MIN · ${p.f} BAJAS`;}
function modeGoal(m){m=m||gameMode;return m==='ctf'?`LLEVA LA BANDERA A TU BASE · ${capLimit} CAPTURA${capLimit>1?'S':''}`:m==='lms'?`ÚLTIMO EN PIE · ${lifeCount} VIDA${lifeCount>1?'S':''}`:`GANA CON ${fragLimit} BAJAS`;}
const PLAYER_SPEED=4,MOVE_SPREAD=.14; // dispersión extra al disparar caminando
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1));
const DIRS=[{dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0}];
const RIGHT=DIRS[1];

// ---------- DATOS ----------
// spd y range en casillas (jugador = 4 casillas/s)
const WEAP={
 pistol:{name:'PISTOLA',short:'PIS',cd:.38,dmg:25,spd:9,spread:0,pellets:1,range:12,color:'#ffe066',crate:1},
 smg:{name:'SUBFUSIL',short:'SMG',cd:.09,dmg:11,spd:10,spread:.12,pellets:1,range:9,color:'#ffb347',crate:1},
 shotgun:{name:'ESCOPETA',short:'ESC',cd:.75,dmg:15,spd:8.5,spread:.32,pellets:7,range:4.5,color:'#ff7b54',crate:2},
 rifle:{name:'RIFLE',short:'RIF',cd:.85,dmg:70,spd:15,spread:0,pellets:1,range:20,color:'#9cf6ff',crate:3},
 frag:{name:'GRANADA',short:'GRN',cd:.8,throw:true,color:'#a3e635'},
 flash:{name:'FLASHBANG',short:'FLS',cd:.8,throw:true,color:'#f8fafc'},
};
const ORDER=['pistol','smg','shotgun','rifle','frag','flash'];
const FIREARMS=['pistol','smg','shotgun','rifle'];
const MAXAMMO={smg:120,shotgun:24,rifle:20,frag:4,flash:3};
const PICK={smg:{amt:45,col:'#ffb347',lbl:'SMG'},shotgun:{amt:8,col:'#ff7b54',lbl:'ESC'},rifle:{amt:8,col:'#9cf6ff',lbl:'RIF'},frag:{amt:2,col:'#a3e635',lbl:'GRN'},flash:{amt:1,col:'#f8fafc',lbl:'FLS'},medkit:{amt:40,col:'#f87171',lbl:'+'}};
const PICK_W=[['smg',3],['shotgun',3],['rifle',2],['frag',2],['flash',1.5],['medkit',2]];
// taken = multiplicador del daño que recibe el jugador
const DIFF={1:{name:'MUY FÁCIL',react:2.4,dodge:.25,speed:.8,fire:2,taken:.7},2:{name:'FÁCIL',react:1.6,dodge:.5,speed:.9,fire:1.5,taken:1},3:{name:'NORMAL',react:1,dodge:1,speed:1,fire:1.15,taken:1},4:{name:'DIFÍCIL',react:.6,dodge:1.3,speed:1.08,fire:.95,taken:1}};
const PERS=[
 {key:'asaltante',name:'ASALTANTE',color:'#ef4444',react:.28,dodge:.45,speed:3.7},
 {key:'flanqueador',name:'FLANQUEADOR',color:'#f472b6',react:.35,dodge:.6,speed:3.6,closeReact:.26},
 {key:'campero',name:'CAMPERO',color:'#22d3ee',react:.19,dodge:.4,speed:3.2},
 {key:'recolector',name:'RECOLECTOR',color:'#fb923c',react:.30,dodge:.55,speed:3.75},
];
// colores para el jugador: ninguno coincide con los de las IAs (rojo, rosa, cian, naranja)
const PALETTE=[['VERDE','#4ade80'],['AMARILLO','#facc15'],['MORADO','#a78bfa'],['AZUL','#3b82f6'],['BLANCO','#f1f5f9'],['CAFÉ','#b07d4a'],
 ['LIMA','#bef264'],['ÍNDIGO','#6366f1'],['GRIS','#9ca3af'],['MAGENTA','#c026d3'],['VINO','#9f1239'],['TURQUESA','#0d9488']];
const AI_NAMES=['RON','ICE','FRANK','VIPER','DOC','MAX','TANK','RAZOR','GHOST','BLAZE','ZED','HAWK','JACK','NOVA','REX','DUKE','SARGE','KILO'];
let playerName='',playerColor=PALETTE[0][1];
try{const n=localStorage.getItem('pb_name'),c=localStorage.getItem('pb_color');if(n)playerName=n.slice(0,10);if(PALETTE.some(p=>p[1]===c))playerColor=c;}catch(e){}
const displayName=()=>playerName.trim()||'JUGADOR';
const SPAWNS=[[1,1],[19,13],[19,1],[1,13],[10,7],[10,1],[10,13],[1,7],[19,7]];

// ---------- ESTADO ----------
let grid=null,crateHP=null,vis=null;
let ents=[],bullets=[],nades=[],pickups=[],parts=[],fx=[],feed=[],heard=[],toast=null;
const SETTINGS={sfx:true,sfxVol:.8,music:true,musicVol:.5,vibrate:true,fog:true,preset:1,mode:'dm',pctf:1,plms:1};
try{Object.assign(SETTINGS,JSON.parse(localStorage.getItem('pb_settings')||'{}'));}catch(e){}
function saveSettings(){try{localStorage.setItem('pb_settings',JSON.stringify(SETTINGS));}catch(e){}}
let state='title',diff=3,fog=SETTINGS.fog,muted=!SETTINGS.sfx,paused=false;
let myId=0,gridVer=0,firstBlood=false,announce=null;const me=()=>ents[myId];
let timeLeft=180,pickupT=0,shake=0,flashA=0,fogOn=false,winner=null,clock=0;

