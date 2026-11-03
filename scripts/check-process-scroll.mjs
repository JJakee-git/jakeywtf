import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'msedge',ignoreDefaultArgs:['--hide-scrollbars']});
const base='http://127.0.0.1:4173';
try{
 for(const height of [1000,720]){
  const page=await browser.newPage({viewport:{width:1440,height}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const route of ['projects/spierer-university/','testprojects/nvidia-drop/']){
   await page.goto(base+'/'+route,{waitUntil:'networkidle'});
   await page.evaluate(()=>document.fonts.ready);
   const section=page.locator('.project-process-flow'),strip=section.locator('.process-strip');
   const layout=await section.evaluate(s=>({
    start:s.getBoundingClientRect().top+scrollY,
    range:s.querySelector('.process-strip').scrollWidth-s.querySelector('.process-strip').clientWidth,
    enabled:s.classList.contains('process-scroll-enabled'),pinHeight:s.querySelector('.process-pin').offsetHeight,
    speed:Number(s.dataset.processSpeed)
   }));
   assert.equal(layout.enabled,true,'Overflowing process section did not enable: '+route);
   assert.equal(layout.speed,1.6);
   assert.ok(layout.pinHeight<=height+1,'Pinned content is taller than the viewport');
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),layout.start+1);
   await page.waitForTimeout(100);
   const before=await section.locator('.process-pin').boundingBox();
   await page.mouse.move(700,height*.6);await page.mouse.wheel(0,400);await page.waitForTimeout(35);
   const early=await strip.evaluate(e=>({x:e.scrollLeft,y:scrollY}));
   await page.waitForTimeout(240);
   const coast=await strip.evaluate(e=>({x:e.scrollLeft,y:scrollY}));
   assert.ok(coast.x>early.x+40,'Horizontal momentum stops immediately with input');
   assert.ok(Math.abs(coast.y-early.y)<2,'Momentum unexpectedly moved the vertical page');
   assert.ok(coast.x>500,'Sideways scrolling is not faster than the vertical input');
   assert.ok(await strip.evaluate(e=>e.scrollLeft)>300,'Downward scrolling did not move artwork horizontally');
   assert.ok(Math.abs((await section.locator('.process-pin').boundingBox()).y-before.y)<1,'Process section moved during horizontal scrolling');
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),layout.start+layout.range/layout.speed);
   await page.waitForTimeout(100);
   assert.ok(Math.abs(await strip.evaluate(e=>e.scrollLeft)-layout.range)<2,'Last artwork cannot be reached');
   await page.mouse.wheel(0,400);await page.waitForTimeout(150);
   assert.ok(await page.locator('.contact-footer').evaluate(e=>e.getBoundingClientRect().top)<height-100,'Scrolling did not continue to Contact Me');
   await page.mouse.wheel(0,-700);await page.waitForTimeout(150);
   assert.ok(await strip.evaluate(e=>e.scrollLeft)<layout.range-100,'Upward scrolling did not reverse the gallery');
   // A direct horizontal gesture must update page progress without snapping back.
   await strip.evaluate(e=>{e.scrollLeft=(e.scrollWidth-e.clientWidth)/2;});
   await page.waitForTimeout(150);
   const progress=await strip.evaluate(e=>({x:e.scrollLeft,y:scrollY}));
   assert.ok(Math.abs(progress.y-layout.start-progress.x/layout.speed)<2,'Horizontal gesture and vertical page progress disagree');
   const box=await strip.boundingBox(),x=box.x+box.width*.7,y=box.y+box.height/2;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-180,y,{steps:8});await page.mouse.up();
   await page.waitForTimeout(150);
   assert.ok(await strip.evaluate(e=>e.scrollLeft)>progress.x+100,'Mouse dragging stopped working while pinned');
   await strip.focus();
   const keyBefore=await strip.evaluate(e=>e.scrollLeft);
   await page.keyboard.press('ArrowRight');await page.waitForTimeout(350);
   assert.ok(await strip.evaluate(e=>e.scrollLeft)>keyBefore+75,'Keyboard scrolling stopped working with momentum');
   await strip.evaluate(e=>{e.scrollLeft=(e.scrollWidth-e.clientWidth)*.3;});
   await page.waitForTimeout(100);
   const thumb=await strip.evaluate(e=>{const r=e.getBoundingClientRect();return {
    x:r.left+e.scrollLeft*e.clientWidth/e.scrollWidth+e.clientWidth*e.clientWidth/e.scrollWidth/2,
    y:r.bottom-2,scroll:e.scrollLeft
   };});
   await page.mouse.move(thumb.x,thumb.y);await page.mouse.down();await page.mouse.move(thumb.x+100,thumb.y,{steps:10});await page.mouse.up();
   await page.waitForTimeout(150);
   assert.ok(await strip.evaluate(e=>e.scrollLeft)>thumb.scroll+100,'Content dragging intercepted the native scrollbar thumb');
  }
  assert.deepEqual(errors,[]);await page.close();
  console.log(height+'px desktop: pin, horizontal progress, contact release, reverse and direct scrolling passed');
 }
 for(const options of [
  {viewport:{width:390,height:844},isMobile:true,hasTouch:true},
  {viewport:{width:1440,height:1000},reducedMotion:'reduce'},
  {viewport:{width:1440,height:400}}
 ]){
  const page=await browser.newPage(options);
  await page.goto(base+'/projects/spierer-university/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('.process-scroll-enabled').count(),0,'Fallback should retain normal scrolling');
  assert.equal(await page.locator('.process-strip').evaluate(e=>getComputedStyle(e).overflowX),'auto');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.close();
 }
 console.log('Compact, reduced-motion and short-window fallbacks passed');
}finally{await browser.close();}
