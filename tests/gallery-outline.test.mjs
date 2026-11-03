import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {artworkContours,artworkOutline} from '../src/gallery-outline.mjs';

const inside=(point,polygon)=>{
 let result=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])result=!result;
 }
 return result;
};

test('loose 24-anchor contours enclose every original artwork corner',async()=>{
 const scene=JSON.parse(await readFile(new URL('../src/content/gallery-scene.json',import.meta.url),'utf8'));
 const rectangles=scene.root.children.map(n=>{
  const t=n.transform;
  const points=[[0,0],[n.size.x,0],[n.size.x,n.size.y],[0,n.size.y]].map(([x,y])=>[t.m00*x+t.m01*y+t.m02,t.m10*x+t.m11*y+t.m12]);
  return {left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
 });
 const contours=artworkContours(rectangles,scene.width,scene.height);
 for(const contour of contours)assert.equal(contour.length,24,'The boundary should have only 24 anchors');
 const path=artworkOutline(rectangles,scene.width,scene.height);
 assert.equal((path.match(/L/g)??[]).length,contours.length*23,'Straight lines should join all 24 points before closing');
 assert.ok(!/[CQAS]/.test(path),'The boundary should contain no curves');
 for(const r of rectangles)for(const point of [[r.left,r.top],[r.right,r.top],[r.right,r.bottom],[r.left,r.bottom]])assert.ok(contours.some(c=>inside(point,c)),'Contour cuts into artwork at '+point.join(','));
 for(const contour of contours)for(let i=0;i<contour.length;i++){
  const a=contour[i],b=contour[(i+1)%contour.length];
  const orientation=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
  for(let j=i+2;j<contour.length;j++){
   if(i===0&&j===contour.length-1)continue;
   const c=contour[j],d=contour[(j+1)%contour.length];
   assert.ok(!(orientation(a,b,c)*orientation(a,b,d)<0&&orientation(c,d,a)*orientation(c,d,b)<0),'Boundary crosses itself');
  }
  for(let step=0;step<=50;step++){
   const p=a.map((value,axis)=>value+(b[axis]-value)*step/50);
   const clearance=Math.min(...rectangles.map(r=>Math.hypot(Math.max(r.left-p[0],0,p[0]-r.right),Math.max(r.top-p[1],0,p[1]-r.bottom))));
   assert.ok(clearance>=140,'Boundary gets too close to the artwork');
   assert.ok(clearance<=550,'Boundary wanders too far from the artwork');
  }
 }
 for(const [x,y] of contours.flat())assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>0&&y>0&&x<scene.width&&y<scene.height);
 assert.equal(artworkOutline(rectangles,scene.width,scene.height),artworkOutline(rectangles,scene.width,scene.height),'Rebuilding should not randomly change the outline');
});

test('separate arrangements stay separate and an empty gallery has no outline',()=>{
 assert.deepEqual(artworkContours([],2000,2000),[]);
 const contours=artworkContours([{left:400,top:400,right:600,bottom:600},{left:1800,top:1800,right:2000,bottom:2000}],2600,2600);
 assert.equal(contours.length,2);
 assert.ok(contours.some(c=>inside([500,500],c))&&contours.some(c=>inside([1900,1900],c)));
});
