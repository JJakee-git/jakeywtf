// Twenty-four widely spaced anchors describe a loose perimeter around the art.
// Interpolated curves connect them without the old dense sawtooth edge.
export function artworkContours(rectangles,width,height){
 if(!rectangles.length)return [];
 const padding=350;
 const rects=rectangles.map(r=>({left:Math.max(60,r.left-padding),top:Math.max(60,r.top-padding),right:Math.min(width-60,r.right+padding),bottom:Math.min(height-60,r.bottom+padding)}));
 const xs=[...new Set(rects.flatMap(r=>[r.left,r.right]))].sort((a,b)=>a-b);
 const ys=[...new Set(rects.flatMap(r=>[r.top,r.bottom]))].sort((a,b)=>a-b);
 const filled=ys.slice(1).map((_,y)=>xs.slice(1).map((_,x)=>rects.some(r=>xs[x]>=r.left&&xs[x+1]<=r.right&&ys[y]>=r.top&&ys[y+1]<=r.bottom)));
 const edges=new Map(),key=p=>p.join(',');
 const add=(a,b)=>edges.set(key(a),b);
 for(let y=0;y<ys.length-1;y++)for(let x=0;x<xs.length-1;x++){
  if(!filled[y][x])continue;
  const tl=[xs[x],ys[y]],tr=[xs[x+1],ys[y]],br=[xs[x+1],ys[y+1]],bl=[xs[x],ys[y+1]];
  if(!filled[y-1]?.[x])add(tl,tr);
  if(!filled[y]?.[x+1])add(tr,br);
  if(!filled[y+1]?.[x])add(br,bl);
  if(!filled[y]?.[x-1])add(bl,tl);
 }
 const contours=[];
 while(edges.size){
  const first=edges.keys().next().value,start=first.split(',').map(Number),points=[start];
  let current=start;
  do{const next=edges.get(key(current));if(!next)break;edges.delete(key(current));points.push(next);current=next;}while(key(current)!==first);
  const area=points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0);
  if(area<=0)continue;
  let smooth=points.slice(0,-1).filter((p,i,all)=>{const a=all[(i+all.length-1)%all.length],b=all[(i+1)%all.length];return Math.abs((p[0]-a[0])*(b[1]-p[1])-(p[1]-a[1])*(b[0]-p[0]))>1e-6;});
  // Limit the corner radius even when a new arrangement creates very long
  // straight edges. Otherwise repeated corner cutting can cross the artwork.
  smooth=smooth.flatMap((p,i)=>{const q=smooth[(i+1)%smooth.length],steps=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/500);return Array.from({length:steps},(_,j)=>[p[0]+(q[0]-p[0])*j/steps,p[1]+(q[1]-p[1])*j/steps]);});
  for(let pass=0;pass<4;pass++)smooth=smooth.flatMap((p,i)=>{
   const q=smooth[(i+1)%smooth.length];
   return [[p[0]*.76+q[0]*.24,p[1]*.76+q[1]*.24],[p[0]*.24+q[0]*.76,p[1]*.24+q[1]*.76]];
  });
  const lengths=smooth.map((p,i)=>Math.hypot(p[0]-smooth[(i+1)%smooth.length][0],p[1]-smooth[(i+1)%smooth.length][1]));
  const perimeter=lengths.reduce((a,b)=>a+b,0),count=24;
  const sampled=[];let edge=0,distance=0;
  for(let i=0;i<count;i++){
   const target=i*perimeter/count;
   while(edge<lengths.length-1&&distance+lengths[edge]<target)distance+=lengths[edge++];
   const p=smooth[edge],q=smooth[(edge+1)%smooth.length],t=(target-distance)/(lengths[edge]||1);
   sampled.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);
  }
  contours.push(sampled.map((p,i)=>{
   const before=sampled[(i+count-1)%count],after=sampled[(i+1)%count],dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1;
   const hash=Math.sin(i*127.1+area*.00001)*43758.5453,noise=hash-Math.floor(hash);
   const offset=45+noise*75+Math.sin(i*.83)*30;
   return [Math.max(20,Math.min(width-20,p[0]+dy/length*offset)),Math.max(20,Math.min(height-20,p[1]-dx/length*offset))];
  }));
 }
 return contours;
}

export function artworkOutline(rectangles,width,height){
 const format=p=>p.map(n=>Number(n.toFixed(2))).join(' ');
 return artworkContours(rectangles,width,height).map(points=>{
  const n=points.length;
  return 'M'+format(points[0])+' '+points.map((p,i)=>{
   const before=points[(i+n-1)%n],next=points[(i+1)%n],after=points[(i+2)%n];
   const first=p.map((v,axis)=>v+(next[axis]-before[axis])/8);
   const second=next.map((v,axis)=>v-(after[axis]-p[axis])/8);
   return 'C'+format(first)+' '+format(second)+' '+format(next);
  }).join(' ')+' Z';
 }).join(' ');
}
