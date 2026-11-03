import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderGallery} from '../src/gallery-template.mjs';
import {artworkContours} from '../src/gallery-outline.mjs';

test('new project frames expand the gallery without moving its starting view',async()=>{
 const projects=JSON.parse(await readFile(new URL('../src/content/projects.json',import.meta.url),'utf8'));
 const scene=JSON.parse(await readFile(new URL('../src/content/gallery-scene.json',import.meta.url),'utf8'));
 const html=renderGallery({full:true,projects,scene,esc:String,img:(src,alt)=>`<img src="${src}" alt="${alt}">`});
 for(const project of projects)assert.ok(html.includes(`href="projects/${project.slug}/"`),'Missing gallery route: '+project.slug);
 assert.ok(html.includes(`data-center-x="${scene.centerX}" data-center-y="${scene.centerY}"`),'Original gallery starting view changed');
 const [,width,height]=html.match(/data-width="([\d.]+)" data-height="([\d.]+)"/).map(Number);
 const additions=projects.filter(p=>!p.sceneNode).map(p=>({left:p.position.x,top:p.position.y,right:p.position.x+p.position.width,bottom:p.position.y+p.position.width*.91}));
 for(const r of additions)assert.ok(r.right<width-230&&r.bottom<height-230,'New artwork clipped by the canvas');
 const contours=artworkContours(additions,width,height);
 const inside=([x,y],points)=>{let result=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;};
 for(const r of additions)for(const p of [[r.left,r.top],[r.right,r.top],[r.right,r.bottom],[r.left,r.bottom]])assert.ok(contours.some(c=>inside(p,c)),'New artwork falls outside the jagged boundary');
});
