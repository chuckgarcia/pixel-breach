'use strict';
// Pixel Breach — Sonido y música generados con WebAudio
// ---------- SONIDO (WebAudio, sin archivos) ----------
let AC=null,NB=null,sfxBus=null,musBus=null;
function audio(){
 if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();sfxBus=AC.createGain();musBus=AC.createGain();sfxBus.connect(AC.destination);musBus.connect(AC.destination);applyVolumes();}catch(e){AC=null;}}
 if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});
}
function applyVolumes(){if(!AC)return;sfxBus.gain.value=SETTINGS.sfx?SETTINGS.sfxVol:0;musBus.gain.value=SETTINGS.music?SETTINGS.musicVol*.55:0;}
function tone(f,d,type,v,f2,bus,at){const t=at||AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(Math.max(.001,v),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(bus||sfxBus);o.start(t);o.stop(t+d+.02);}
function noise(d,v,lp,bus,at,hp){if(!NB){NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const ch=NB.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1;}
 const t=at||AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NB;f.type=hp?'highpass':'lowpass';f.frequency.value=lp;g.gain.setValueAtTime(Math.max(.001,v),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(bus||sfxBus);s.start(t,Math.random()*.5);s.stop(t+d+.02);}
function sfx(n,x,y){
 if(!AC||!SETTINGS.sfx)return;let v=1;const p=me();
 if(p&&x!==undefined){const d=Math.hypot(p.x-x,p.y-y)/T;v=1-d/16;if(v<=.05)return;}
 try{switch(n){
  case 'pistol':tone(880,.08,'square',.05*v,220);noise(.05,.05*v,3200);break;
  case 'smg':tone(620,.05,'square',.03*v,200);noise(.03,.035*v,4000);break;
  case 'shotgun':noise(.22,.16*v,1800);tone(160,.12,'square',.04*v,60);break;
  case 'rifle':tone(1400,.14,'sawtooth',.05*v,110);noise(.12,.08*v,2500);break;
  case 'throw':tone(300,.08,'triangle',.05*v,520);break;
  case 'bounce':tone(220,.04,'triangle',.03*v);break;
  case 'boom':noise(.75,.45*v,500);noise(.2,.18*v,2800);tone(95,.5,'square',.08*v,32);break;
  case 'flash':tone(3200,.45,'sine',.05*v,2600);noise(.2,.15*v,6000);break;
  case 'tick':tone(880,.09,'square',.05);break;
  case 'go':tone(1320,.22,'square',.06);break;
  case 'pick':tone(660,.06,'square',.045*v);tone(990,.09,'square',.045*v,0,null,AC.currentTime+.06);break;
  case 'die':tone(420,.35,'square',.06*v,60);noise(.25,.08*v,1200);break;
  case 'streak':[523,659,784,1047].forEach((f,i)=>tone(f,.12,'square',.045,0,null,AC.currentTime+i*.07));break;
  case 'crate':noise(.12,.1*v,900);break;
  case 'hurt':tone(150,.1,'sawtooth',.06,80);break;
  case 'win':tone(523,.15,'square',.05);setTimeout(()=>AC&&tone(659,.15,'square',.05),150);setTimeout(()=>AC&&tone(784,.3,'square',.05),300);break;
 }}catch(e){}
}

// ---------- MÚSICA ----------
const MUSIC={
 menu:{bpm:92,len:32,bd:.5,ld:.32,
  bass:[45,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,41,0,0,0,0,0,0,0,43,0,0,0,0,0,0,0],
  lead:[69,0,0,0,72,0,0,0,76,0,0,0,72,0,0,0,65,0,0,0,69,0,0,0,72,0,0,0,71,0,0,0],
  drum:'k.......s.......k.......s.......'},
 game:{bpm:138,len:32,bd:.16,ld:.09,
  bass:[45,0,45,0,57,0,45,0,45,0,45,0,55,0,52,0,41,0,41,0,53,0,41,0,43,0,43,0,55,0,43,0],
  lead:[69,0,72,0,76,0,72,0,69,0,72,0,74,0,72,0,65,0,69,0,72,0,69,0,67,0,71,0,74,0,71,0],
  drum:'k.h.s.h.k.k.s.h.k.h.s.h.k.h.s.hh'},
};
let mTrack=null,mStep=0,mNext=0,mTimer=null;
const midi=n=>440*Math.pow(2,(n-69)/12);
function setMusic(track){
 if(!AC){mTrack=null;return;}
 if(track===mTrack)return;mTrack=track;mStep=0;mNext=AC.currentTime+.08;
 if(!mTimer)mTimer=setInterval(musicTick,25);
}
function musicTick(){
 if(!AC||!mTrack||!SETTINGS.music)return;
 const tr=MUSIC[mTrack],sp=60/tr.bpm/4;
 if(mNext<AC.currentTime-.5)mNext=AC.currentTime+.05; // la pestaña estuvo en pausa
 while(mNext<AC.currentTime+.15){
  const i=mStep%tr.len,t=mNext;
  if(tr.bass[i])tone(midi(tr.bass[i]),tr.bd,'triangle',.22,0,musBus,t);
  if(tr.lead[i]&&(mTrack==='menu'||Math.floor(mStep/tr.len)%2===1))tone(midi(tr.lead[i]),tr.ld,'square',.05,0,musBus,t);
  const d=tr.drum[i];
  if(d==='k')tone(110,.12,'sine',.35,38,musBus,t);
  else if(d==='s')noise(.09,.12,1800,musBus,t,true);
  else if(d==='h')noise(.03,.05,6000,musBus,t,true);
  mStep++;mNext+=sp;
 }
}
function musicForState(){setMusic(state==='play'?'game':(state==='title'||state==='lobby'||state==='over')?'menu':null);}

