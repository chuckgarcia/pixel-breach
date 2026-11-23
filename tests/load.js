// Carga el juego en Node (sin navegador) con un DOM mínimo, en el mismo orden que index.html.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..');
function scriptList(){
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
}
function makeContext(){
  const noop=()=>{};
  const c2=new Proxy({},{get:(t,k)=>k==='measureText'?(()=>({width:10})):(k in t?t[k]:noop),set:(t,k,v)=>{t[k]=v;return true;}});
  const el=()=>({style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},dataset:{},value:'',textContent:'',width:672,height:524,
    getContext:()=>c2,addEventListener:noop,appendChild:noop,append:noop,setAttribute:noop,focus:noop,blur:noop,querySelector:()=>el(),
    getBoundingClientRect:()=>({left:0,top:0,width:1,height:1})});
  const doc={addEventListener:noop,getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],body:el(),documentElement:el(),head:el(),hidden:false};
  const sb={document:doc,performance:{now:()=>Date.now()},requestAnimationFrame:noop,addEventListener:noop,window:{},setTimeout,clearTimeout,
    setInterval:()=>0,clearInterval:noop,navigator:{userAgent:'node'},URL:{createObjectURL:()=>''},Blob:function(){},Worker:function(){this.postMessage=noop;},
    console,Math,Object,Array,String,Number,JSON,Date,Set,Map,Promise,Uint8Array,Float32Array,Infinity,NaN,parseInt,isFinite,
    localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},location:{hash:'',search:'',href:'http://x/',host:'x',hostname:'x',protocol:'http:'},history:{replaceState:noop},
    matchMedia:()=>({matches:false}),screen:{}};
  sb.window=sb;vm.createContext(sb);
  for(const f of scriptList())vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sb,{filename:f});
  return {sb,run:code=>vm.runInContext(code,sb)};
}
module.exports={makeContext,scriptList,ROOT};
