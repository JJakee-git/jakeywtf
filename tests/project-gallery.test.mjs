import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderGallery} from '../src/gallery-template.mjs';

test('test projects stay out of the original gallery and its canvas bounds',async()=>{
 const projects=JSON.parse(await readFile(new URL('../src/content/projects.json',import.meta.url),'utf8'));
 const scene=JSON.parse(await readFile(new URL('../src/content/gallery-scene.json',import.meta.url),'utf8'));
 const html=renderGallery({full:true,projects,scene,esc:String,img:(src,alt)=>`<img src="${src}" alt="${alt}">`});
 const staged=projects.filter(p=>p.collection==='testprojects');
 assert.ok(staged.length>0,'No projects available to check staging isolation');
 for(const project of projects){
  if(project.collection==='testprojects'){
   assert.ok(!html.includes(`data-project="${project.slug}"`),'Test project leaked into the gallery: '+project.slug);
   assert.ok(!html.includes(`href="testprojects/${project.slug}/"`),'Test project link leaked into the gallery: '+project.slug);
  }else assert.ok(html.includes(`href="projects/${project.slug}/"`),'Missing original gallery route: '+project.slug);
 }
 assert.ok(html.includes(`data-center-x="${scene.centerX}" data-center-y="${scene.centerY}"`),'Original gallery starting view changed');
 const [,width,height]=html.match(/data-width="([\d.]+)" data-height="([\d.]+)"/).map(Number);
 assert.equal(width,scene.width,'Staged projects expanded the gallery width');
 assert.equal(height,scene.height,'Staged projects expanded the gallery height');
});
