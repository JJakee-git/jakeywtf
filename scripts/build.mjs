import {readFile, writeFile, mkdir, cp, access} from 'node:fs/promises';
import {dirname, resolve, sep} from 'node:path';
import {rm} from 'node:fs/promises';
import {renderSitePages} from './page-templates.mjs';
const json=async path=>JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));
const site=await json('src/content/site.json');
const projects=await json('src/content/projects.json');
const caseStudies=await json('src/content/case-studies.json');
for(const project of projects)project.caseStudy=caseStudies[project.slug];
const about=await json('src/content/about.json');
const mercedesCopy=await json('src/content/mercedes-copy.json');
const galleryScene=await json('src/content/gallery-scene.json');
const references=await json('src/content/reference-pages.json');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugSet=new Set();
for(const p of projects){
  if(!/^[a-z0-9-]+$/.test(p.slug)||slugSet.has(p.slug))throw Error('Invalid or duplicate project slug: '+p.slug);
  slugSet.add(p.slug);
  for(const asset of [p.preview,p.hero,p.framedPreview,...p.images].filter(Boolean))await access('public/'+asset);
  if(p.caseStudy){
    for(const asset of [p.caseStudy.hero,...p.caseStudy.left,p.caseStudy.right,...p.caseStudy.process].filter(Boolean)){
      if(!asset.alt||!(asset.width>0&&asset.height>0))throw Error('Incomplete artwork metadata: '+p.slug);
      await access('public/'+asset.path);
    }
  }
}
const outputRoot=resolve('dist');
if(outputRoot!==resolve('.')+sep+'dist')throw Error('Unexpected build output directory');
await rm(outputRoot,{recursive:true,force:true});
await mkdir(outputRoot,{recursive:true});
await cp('public','dist',{recursive:true});
const styleFiles=['src/design-tokens.css','src/site.css','src/refinements.css','src/display-refinements.css','src/gallery-refinements.css','src/content-refinements.css','src/interaction-refinements.css'];
const styles=[];for(const file of styleFiles){try{styles.push(await readFile(file,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}}
await writeFile('dist/styles.css',styles.join('\n'));
await cp('src/app.js','dist/app.js');
await cp('src/gallery-math.mjs','dist/gallery-math.mjs');
await cp('src/scroll-controller.js','dist/scroll-controller.js');
await cp('src/viewport-layout.js','dist/viewport-layout.js');
await cp('src/menu-motion.js','dist/menu-motion.js');
await cp('src/process-scroll.js','dist/process-scroll.js');
const img=(path,alt,cls='',lazy=true)=>`<img src="${esc(path)}" alt="${esc(alt)}" class="${cls}" ${lazy?'loading="lazy"':''} decoding="async" draggable="false">`;
const pages=renderSitePages({site,projects,galleryScene,references,esc,img});
for(const [path,html] of pages){await mkdir(dirname('dist/'+path),{recursive:true});await writeFile('dist/'+path,html);}
await writeFile('dist/.nojekyll','');
await writeFile('dist/404.html',pages[0][1].replace('<title>Home','<title>Page not found'));
console.log(`Built ${pages.length} pages into dist/`);
