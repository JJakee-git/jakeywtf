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
