import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('.local', {recursive:true});
const browser = await chromium.launch({channel:'msedge', headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
for (const [name,url] of [['home',''],['work','playground'],['about','aboutme'],['contact','contact']]) {
  await page.goto('https://compassionate-emoji-484945.framer.app/'+url, {waitUntil:'networkidle'});
  await page.screenshot({path:'.local/framer-'+name+'.png',fullPage:true});
  console.log(name, await page.title());
}
await browser.close();
