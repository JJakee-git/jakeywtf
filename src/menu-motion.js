// Framer's links move as one spring-driven row, with no stagger.
export function createMenuMotion(nav,header){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const row=nav.querySelector('.navigation-links');
 const button=header.querySelector('.menu-toggle');
 let animation;
 return open=>{
  const wasHidden=nav.hidden;
  if(!open&&wasHidden)return;
  if(open)nav.hidden=false;
  // The stationary nav clips at the button's right edge. The moving row stays
  // opaque while Menu covers it, so nothing fades in the space to its left.
  const travel=nav.clientWidth-button.offsetWidth;
  const closed=`translate(${travel}px,${-row.offsetTop}px)`;
  const start=wasHidden?closed:getComputedStyle(row).transform;
  animation?.cancel();
  header.classList.toggle('navigation-open',open);
  if(reduced){nav.hidden=!open;return;}
  const frames=open?[
   {transform:start,offset:0},
   {transform:'translateX(-7px)',offset:.67},
   {transform:'translateX(2px)',offset:.86},
   {transform:'translateX(0)',offset:1}
  ]:[
   {transform:start},
   {transform:closed}
  ];
  const current=row.animate(frames,{duration:open?1150:800,easing:'cubic-bezier(.25,.25,.25,1)',fill:'both'});
  animation=current;
  current.finished.then(()=>{if(animation===current&&!open){nav.hidden=true;current.cancel();}},()=>{});
 };
}

// Keep native link behavior for new tabs and reduced motion. Normal returns
// cover the stationary Back button first, then fade it before navigation.
export function enableProjectReturn(header,closeMenu){
 const back=header.querySelector('.project-back-button');
 if(!back)return;
 const menu=header.querySelector('.menu-toggle');
 let leaving=false,cover,fade,visit=0;
 function restore(){
  visit++;leaving=false;cover?.cancel();fade?.cancel();
  menu.inert=false;back.inert=false;back.removeAttribute('aria-disabled');
  delete header.dataset.projectReturn;
 }
 addEventListener('pageshow',event=>{if(event.persisted)restore();});
 back.addEventListener('click',async event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||back.target==='_blank')return;
  if(leaving){event.preventDefault();return;}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  event.preventDefault();leaving=true;
  const sequence=++visit;
  closeMenu();
  const start=getComputedStyle(menu).transform;
  const gap=parseFloat(getComputedStyle(menu.parentElement).columnGap)||0;
  const travel=back.offsetWidth+gap;
  header.dataset.projectReturn='covering';
  back.setAttribute('aria-disabled','true');menu.inert=true;back.inert=true;
  try{
   cover=menu.animate([{transform:start},{transform:`translateX(${travel}px)`}],{duration:760,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
   await cover.finished;
   header.dataset.projectReturn='fading';
   fade=back.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-out',fill:'forwards'});
   await fade.finished;
  }catch{
   // A superseding navigation or disabled animation should not strand the link.
  }
  if(leaving&&sequence===visit)location.assign(back.href);
 });
}
