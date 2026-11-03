import {chromium,devices} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
const projects=JSON.parse(await readFile('src/content/projects.json','utf8'));
const site=JSON.parse(await readFile('src/content/site.json','utf8'));
const projectCollection=project=>project.collection==='testprojects'?'testprojects':'projects';
const projectPath=project=>`${projectCollection(project)}/${project.slug}/`;
const testProjects=projects.filter(project=>project.collection==='testprojects');
const scrollTestPaths=site.showScrollTests?['test/',...['elastic','spring','momentum','magnetic'].map(mode=>`test/${mode}/`)]:[];
await mkdir('.local',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const failures=[];
try {
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{...devices['iPhone 13'],defaultBrowserType:undefined,reducedMotion:'reduce'}:{viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',error=>failures.push(error.message));
  page.on('response',response=>{if(response.status()>=400)failures.push(response.status()+' '+response.url());});
  for(const path of ['','projects/','testprojects/','aboutme/','contact/',...scrollTestPaths,...projects.map(projectPath)]){
   await page.goto('http://127.0.0.1:4173/'+path,{waitUntil:'networkidle'});
   await page.evaluate(()=>document.fonts.ready);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow: '+path);
   assert.equal(await page.locator('img').evaluateAll(images=>images.filter(i=>i.complete&&i.naturalWidth<=1).length),0,'Broken or collapsed image '+path);
   if(path===''){
    const dimensions=await page.evaluate(async()=>{
     const paths=['assets/textures/hero-grunge.png','assets/textures/marble.jpg','assets/projects/plaque.png'];
     return Promise.all(paths.map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve([src,i.naturalWidth,i.naturalHeight]);i.onerror=()=>resolve([src,0,0]);i.src=src;})));
    });
    for(const [asset,width,height] of dimensions)assert.ok(width>100&&height>100,'Collapsed texture: '+asset);
   }
   if(path===''||path==='projects/'){
    const viewport=page.locator('[data-gallery]');const canvas=page.locator('.gallery-canvas');
    for(const project of testProjects)assert.equal(await viewport.locator(`[data-project="${project.slug}"]`).count(),0,'Test project is still in Work: '+project.slug);
    for(const project of projects.filter(project=>project.collection!=='testprojects'))assert.ok(await viewport.locator(`[data-project="${project.slug}"]`).count()>0,'Original project is missing from Work: '+project.slug);
    await viewport.scrollIntoViewIfNeeded();const box=await viewport.boundingBox();
    const original=await canvas.evaluate(el=>getComputedStyle(el).transform);
    const fixedFrame=await page.locator('.gold-frame').boundingBox();
    await page.mouse.move(box.x+box.width*.8,box.y+box.height*.8);await page.mouse.down();
    await page.mouse.move(box.x+box.width*.3,box.y+box.height*.3,{steps:12});await page.mouse.up();
    assert.notEqual(await canvas.evaluate(el=>getComputedStyle(el).transform),original,'Gallery did not pan');
    assert.deepEqual(await page.locator('.gold-frame').boundingBox(),fixedFrame,'Outer frame moved');
    await viewport.focus();await page.keyboard.press('Home');
    assert.equal(await canvas.evaluate(el=>getComputedStyle(el).transform),original,'Reset failed');
    assert.equal(await page.getByRole('button',{name:'RESET VIEW'}).count(),0);
    await page.keyboard.press('ArrowRight');
    assert.notEqual(await canvas.evaluate(el=>getComputedStyle(el).transform),original,'Keyboard did not pan');
    await page.keyboard.press('Home');
    for(const link of await viewport.locator('a.gallery-project').all()){
     await page.keyboard.press('Tab');
     await link.focus();
     const target=await link.boundingBox(),window=await viewport.boundingBox();
     assert.ok(target.x+target.width/2>=window.x&&target.x+target.width/2<=window.x+window.width,'Focused artwork is outside the gallery horizontally');
     assert.ok(target.y+target.height/2>=window.y&&target.y+target.height/2<=window.y+window.height,'Focused artwork is outside the gallery vertically');
    }
    await viewport.focus();await page.keyboard.press('Home');
    await page.evaluate(()=>{document.activeElement.blur();window.scrollTo({top:0,behavior:'instant'});});
    await page.screenshot({path:`.local/${mobile?'mobile':'desktop'}-${path?'work':'home'}.png`,fullPage:true});
   }
   if(path==='testprojects/'){
    assert.equal(await page.locator('#main a[href^="testprojects/"]').count(),testProjects.length,'Test-project index has extra or missing links');
    for(const project of testProjects)assert.equal(await page.locator(`#main a[href="${projectPath(project)}"]`).count(),1,'Test-project index is missing: '+project.slug);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollSnapType),'none','Test-project index should scroll continuously');
   }
   const project=projects.find(project=>path===projectPath(project));
   if(project){
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollSnapType),'none','Project should scroll continuously: '+path);
    if(await page.locator('.project-overview-grid').count()){
     const geometry=await page.locator('.project-overview-grid').evaluate(grid=>({
      columns:[...grid.children].map(column=>{const children=[...column.children].map(child=>child.getBoundingClientRect());return {top:children[0].top,bottom:children.at(-1).bottom};}),
      storyHeight:grid.querySelector('.project-story').clientHeight
     }));
     assert.ok(geometry.storyHeight>=140,'Project description collapsed: '+path);
     if(!mobile){
      assert.ok(Math.abs(geometry.columns[0].top-geometry.columns[1].top)<1,'Project column top edges differ: '+path);
      assert.ok(Math.abs(geometry.columns[0].bottom-geometry.columns[1].bottom)<1,'Project column bottom edges differ: '+path);
     }
    }else assert.ok(await page.locator('.project-extra-art img').count()>0,'Artwork-only project is empty: '+path);
   }
   const back=page.locator('.project-back-button');
   assert.equal(await back.count(),project?1:0,'Back button should only appear on project detail pages: '+path);
   if(project){
    const parent=projectCollection(project);
    assert.equal(await back.getAttribute('aria-label'),parent==='testprojects'?'Back to test projects':'Back to projects');
    assert.equal(await back.getAttribute('href'),parent+'/','Back button has the wrong destination: '+path);
    const backRect=await back.boundingBox(),menuRect=await page.locator('.menu-toggle').boundingBox();
    assert.equal(backRect.width,backRect.height,'Back button is not square');
    assert.equal(backRect.height,menuRect.height,'Back and Menu heights differ');
    assert.ok(backRect.x>menuRect.x+menuRect.width,'Back button is not to the right of Menu');
    assert.equal(await back.locator(':scope>span:last-child').textContent(),'BACK');
    await back.click();await page.waitForURL(`**/${parent}/`);
   }
  }
  await page.goto('http://127.0.0.1:4173/');
  await page.getByRole('button',{name:'MENU',exact:true}).click();
  assert.equal(await page.locator('#navigation').isVisible(),true);
  await page.keyboard.press('Escape');await page.locator('#navigation').waitFor({state:'hidden'});
  await page.goto('http://127.0.0.1:4173/contact/');assert.equal(await page.locator('[type=submit]').isDisabled(),true);
  await context.close();console.log(mobile?'Mobile checks passed':'Desktop checks passed');
 }
 assert.deepEqual(failures,[],'Browser errors or failed requests');
} finally {await browser.close();}
