import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const origin='http://127.0.0.1:4173';
const browser=await chromium.launch({channel:'msedge'});
try{
 for(const width of [1440,390])for(const reducedMotion of ['no-preference','reduce']){
  const page=await browser.newPage({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390,reducedMotion});
  for(const [parent,slug] of [['projects','mercedesbenz'],['testprojects','nvidia-drop']]){
   await page.goto(`${origin}/${parent}/${slug}/`,{waitUntil:'networkidle'});
   const back=page.locator('.project-back-button');
   const before=await back.boundingBox();
   if(parent==='testprojects'){
    await page.locator('.menu-toggle').evaluate(button=>button.click());
   }
   await back.evaluate(button=>button.click());
   if(reducedMotion!=='reduce'){
    assert.equal(await page.locator('.site-header').getAttribute('data-project-return'),'covering');
    assert.equal(await back.evaluate(button=>getComputedStyle(button).opacity),'1','Back faded before being covered');
    await page.waitForFunction(()=>document.querySelector('.site-header').dataset.projectReturn==='fading');
    assert.equal(new URL(page.url()).pathname,`/${parent}/${slug}/`,'Navigation happened before the fade');
    const covered=await page.locator('.menu-toggle').boundingBox();
    const after=await back.boundingBox();
    assert.deepEqual(after,before,'Back moved during its return animation');
    assert.ok(Math.abs(covered.x+covered.width-after.x-after.width)<1,'Menu did not cover Back before fading');
   }
   await page.waitForURL(`${origin}/${parent}/`);
   console.log(width,reducedMotion,parent,'cover/fade/return passed');
  }
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(`${origin}/projects/mercedesbenz/`,{waitUntil:'networkidle'});
 // Modified clicks retain native new-tab behavior instead of starting an exit.
 const native=await page.locator('.project-back-button').evaluate(button=>{
  const event=new MouseEvent('click',{button:0,ctrlKey:true,bubbles:true,cancelable:true});
  button.addEventListener('click',event=>event.preventDefault(),{once:true});
  let intercepted;
  button.addEventListener('click',event=>{intercepted=!!document.querySelector('.site-header').dataset.projectReturn;},{once:true});
  button.dispatchEvent(event);return intercepted;
 });
 assert.equal(native,false,'Modified click started a return animation');
 await page.locator('.project-back-button').evaluate(button=>button.click());
 await page.waitForFunction(()=>document.querySelector('.site-header').dataset.projectReturn==='covering');
 // A cached-page restoration must also cancel any pending delayed navigation.
 await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
 await page.waitForTimeout(1050);
 assert.equal(new URL(page.url()).pathname,'/projects/mercedesbenz/','Restored page navigated away again');
 assert.equal(await page.locator('.site-header').getAttribute('data-project-return'),null);
 assert.equal(await page.locator('.project-back-button').evaluate(button=>button.inert),false);
 assert.equal(await page.locator('.project-back-button').evaluate(button=>getComputedStyle(button).opacity),'1');
 console.log('Modified clicks and cached-page restoration passed');
}finally{await browser.close();}
