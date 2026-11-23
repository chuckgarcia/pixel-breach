'use strict';
// Pixel Breach — Mapa: generación, casillas, línea de vista y rutas
// ---------- MAPA ----------
const idx=(x,y)=>y*COLS+x;
const inb=(x,y)=>x>=0&&y>=0&&x<COLS&&y<ROWS;
const tile=(x,y)=>{x=wx(x);return inb(x,y)?grid[idx(x,y)]:WALL;};
const walkable=(x,y)=>tile(x,y)===FLOOR;
const nearSpawn=(x,y,r)=>SPAWNS.some(([sx,sy])=>Math.abs(sx-x)+Math.abs(sy-y)<=r);

function connected(){
 const N=COLS*ROWS;let start=-1,total=0;
 for(let i=0;i<N;i++)if(grid[i]!==WALL&&grid[i]!==LAVA){total++;if(start<0)start=i;}
 const seen=new Uint8Array(N),q=[start];seen[start]=1;let c=0;
 while(q.length){const i=q.pop();c++;const x=i%COLS,y=(i/COLS)|0;
  for(const d of DIRS){const nx=x+d.dx,ny=y+d.dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(!seen[j]&&grid[j]!==WALL&&grid[j]!==LAVA){seen[j]=1;q.push(j);}}}
 return c===total;
}
function genMap(){
 grid=new Uint8Array(COLS*ROWS);crateHP=new Uint8Array(COLS*ROWS);
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)
  if(x===0||y===0||x===COLS-1||y===ROWS-1||(x%2===0&&y%2===0))grid[idx(x,y)]=WALL;
 // muros extra que unen pilares => cuartos y pasillos estilo CQB
 let added=0;
 for(let k=0;k<300&&added<26;k++){
  const x=ri(1,COLS-2),y=ri(1,ROWS-2);
  if(grid[idx(x,y)]!==FLOOR||((x%2===0)===(y%2===0))||nearSpawn(x,y,2))continue;
  grid[idx(x,y)]=theme.lava&&Math.random()<.35?LAVA:WALL;
  if(!connected())grid[idx(x,y)]=FLOOR;else added++;
 }
 if(theme.lava){ // pozas de lava sueltas
  for(let k=0,n=0;k<200&&n<10;k++){const x=ri(2,COLS-3),y=ri(2,ROWS-3);if(grid[idx(x,y)]!==FLOOR||nearSpawn(x,y,3))continue;grid[idx(x,y)]=LAVA;if(!connected())grid[idx(x,y)]=FLOOR;else n++;}
 }
 if(WRAP){ // túneles laterales como en Pac-Man
  for(const y of [3,7,11]){grid[idx(0,y)]=FLOOR;grid[idx(COLS-1,y)]=FLOOR;grid[idx(1,y)]=FLOOR;grid[idx(COLS-2,y)]=FLOOR;}
 }
 for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){
  const i=idx(x,y);
  if(grid[i]===FLOOR&&!nearSpawn(x,y,2)&&!(WRAP&&(x<=1||x>=COLS-2))&&Math.random()<.3){grid[i]=CRATE;crateHP[i]=3;}
 }
 vis=new Uint8Array(COLS*ROWS).fill(1);
}
function hitCrate(x,y,d){
 const i=idx(x,y);if(grid[i]!==CRATE)return;
 crateHP[i]=Math.max(0,crateHP[i]-d);gridVer++;
 if(crateHP[i]===0)destroyCrate(x,y);
}
const CRATE_DROP=.4; // probabilidad de que una caja rota suelte un arma, granada o botiquín
function destroyCrate(x,y){
 grid[idx(x,y)]=FLOOR;
 sparks(x*T+T/2,y*T+T/2,theme.debris[0],10,140);sparks(x*T+T/2,y*T+T/2,theme.debris[1],6,100);
 snd('crate',x*T,y*T);gridVer++;
 if(Math.random()<CRATE_DROP&&!pickups.some(p=>p.tx===x&&p.ty===y)){const type=weightedType();pickups.push({tx:x,ty:y,type,amt:PICK[type].amt,t:0});emitEv({k:'sp',x:x*T+T/2,y:y*T+T/2,c:PICK[type].col,n:8,s:70});}
}
function nearestFloor(x,y){
 x=Math.max(1,Math.min(COLS-2,x));y=Math.max(1,Math.min(ROWS-2,y));
 const seen=new Uint8Array(COLS*ROWS),q=[[x,y]];seen[idx(x,y)]=1;
 for(let h=0;h<q.length;h++){const [cx,cy]=q[h];if(walkable(cx,cy))return [cx,cy];
  for(const d of DIRS){const nx=cx+d.dx,ny=cy+d.dy;if(inb(nx,ny)&&!seen[idx(nx,ny)]){seen[idx(nx,ny)]=1;q.push([nx,ny]);}}}
 return null;
}
function losPx(x0,y0,x1,y1){
 const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d/8);
 const ax=Math.floor(x0/T),ay=Math.floor(y0/T),bx=Math.floor(x1/T),by=Math.floor(y1/T);
 for(let i=1;i<n;i++){
  const tx=Math.floor((x0+(x1-x0)*i/n)/T),ty=Math.floor((y0+(y1-y0)*i/n)/T);
  if(blocks(tile(tx,ty))){if((tx===bx&&ty===by)||(tx===ax&&ty===ay))continue;return false;}
 }
 return true;
}

// ---------- PATHFINDING ----------
class Heap{constructor(){this.a=[]}size(){return this.a.length}
 push(p,v){const a=this.a;a.push([p,v]);let i=a.length-1;while(i>0){const j=(i-1)>>1;if(a[j][0]<=a[i][0])break;[a[i],a[j]]=[a[j],a[i]];i=j;}}
 pop(){const a=this.a,top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<a.length&&a[l][0]<a[m][0])m=l;if(r<a.length&&a[r][0]<a[m][0])m=r;if(m===i)break;[a[i],a[m]]=[a[m],a[i]];i=m;}}return top;}}
function distField(gx,gy){
 const D=new Float32Array(COLS*ROWS).fill(1e9),h=new Heap();
 D[idx(gx,gy)]=0;h.push(0,idx(gx,gy));
 while(h.size()){
  const [d,i]=h.pop();if(d>D[i])continue;
  const x=i%COLS,y=(i/COLS)|0,cost=grid[i]===CRATE?5:1;
  for(const dd of DIRS){const nx=wx(x+dd.dx),ny=y+dd.dy;const tt=tile(nx,ny);if(tt===WALL||tt===LAVA)continue;const j=idx(nx,ny),nd=d+cost;if(nd<D[j]){D[j]=nd;h.push(nd,j);}}
 }
 return D;
}
function nextStep(e,goal){
 const [gx,gy]=goal;if(gx===e.tx&&gy===e.ty)return null;
 const D=distField(gx,gy);let best=null,bd=D[idx(e.tx,e.ty)];
 const opts=DIRS.slice().sort(()=>Math.random()-.5);
 for(const d of opts){const nx=wx(e.tx+d.dx),ny=e.ty+d.dy;const tt=tile(nx,ny);if(tt===WALL||tt===LAVA)continue;const v=D[idx(nx,ny)];if(v<bd){bd=v;best=d;}}
 return best;
}

