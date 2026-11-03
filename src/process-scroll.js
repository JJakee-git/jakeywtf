// Native vertical page scrolling drives a faster, inertial horizontal gallery.
// No wheel events are captured, so reversing direction and leaving the section
// remain ordinary page scrolling.
export function enableProcessScrolling(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const speed=1.6;
 for(const section of document.querySelectorAll('.page-project .project-process-flow')){
  const strip=section.querySelector('.process-strip');
  if(!strip)continue;
  const pin=document.createElement('div');pin.className='process-pin';
  pin.append(...section.childNodes);section.append(pin);
  let active=false,start=0,range=0,travel=0,paintFrame=0,measureFrame=0;
  let position=0,velocity=0,writtenX=strip.scrollLeft,lastTime=0,dragging=false;
  const clamp=value=>Math.max(0,Math.min(range,value));
  const write=()=>{strip.scrollLeft=position;writtenX=strip.scrollLeft;};
  function schedulePaint(){
   if(!paintFrame){lastTime=performance.now();paintFrame=requestAnimationFrame(paint);}
  }
  function paint(now){
   paintFrame=0;
   if(!active||dragging)return;
   const target=clamp((scrollY-start)*speed);
   // Reach the endpoint before the pinned section releases to the next page area.
   if(scrollY<=start+1){position=0;velocity=0;write();return;}
   if(scrollY>=start+travel-1){position=range;velocity=0;write();return;}
   const dt=Math.max(.25,Math.min(2,(now-lastTime)/16.667));lastTime=now;
   velocity=(velocity+(target-position)*.1*dt)*Math.pow(.6,dt);
   const next=position+velocity*dt;position=clamp(next);
   if(position!==next)velocity=0;
   if(Math.abs(target-position)<.35&&Math.abs(velocity)<.12){position=target;velocity=0;write();return;}
   write();paintFrame=requestAnimationFrame(paint);
  }
  function measure(){
   measureFrame=0;
   const wasActive=active,previousRange=range,previousStart=start;
   active=document.documentElement.dataset.layout==='wide'&&!reduced.matches;
   section.classList.toggle('process-scroll-enabled',active);
   strip.style.removeProperty('--sketch-height');
   if(!active){section.style.removeProperty('height');return;}
   const image=strip.querySelector('.process-image');
   if(!image)return;
   const preferred=image.getBoundingClientRect().height;
   const padding=getComputedStyle(pin);
   const otherHeight=[...pin.children].filter(child=>child!==strip).reduce((sum,child)=>sum+child.getBoundingClientRect().height,0);
   const chrome=otherHeight+strip.offsetHeight-preferred+parseFloat(padding.paddingTop)+parseFloat(padding.paddingBottom);
   if(chrome+120>innerHeight){
    active=false;section.classList.remove('process-scroll-enabled');section.style.removeProperty('height');return;
   }
   const available=Math.max(120,innerHeight-chrome);
   if(preferred>available)strip.style.setProperty('--sketch-height',`${available}px`);
   range=Math.max(0,strip.scrollWidth-strip.clientWidth);
   if(range<1){active=false;section.classList.remove('process-scroll-enabled');section.style.removeProperty('height');strip.style.removeProperty('--sketch-height');return;}
   travel=range/speed;
   section.dataset.processSpeed=String(speed);
   section.style.height=`${pin.offsetHeight+travel}px`;
   start=section.getBoundingClientRect().top+scrollY;
   if(!wasActive||Math.abs(previousRange-range)>1||Math.abs(previousStart-start)>1){position=clamp((scrollY-start)*speed);velocity=0;write();}
   else schedulePaint();
  }
  const scheduleMeasure=()=>{if(!measureFrame)measureFrame=requestAnimationFrame(measure);};
  addEventListener('scroll',()=>{if(active)schedulePaint();},{passive:true});
  // Keep dragging, the scrollbar, and horizontal keyboard input in sync with
  // the same page progress instead of fighting the pinned scroll position.
  strip.addEventListener('scroll',()=>{
   if(!active||Math.abs(strip.scrollLeft-writtenX)<1.5)return;
   const rect=pin.getBoundingClientRect();
   if(rect.bottom<=0||rect.top>=innerHeight)return;
   position=strip.scrollLeft;writtenX=position;velocity=0;
   scrollTo({top:start+position/speed,behavior:'instant'});
  },{passive:true});
  strip.addEventListener('pointerdown',event=>{
   if(!active||event.button!==0||!event.isPrimary||event.pointerType==='touch')return;
   dragging=true;velocity=0;position=strip.scrollLeft;
   cancelAnimationFrame(paintFrame);paintFrame=0;
  });
  const release=()=>{if(dragging){dragging=false;if(active)schedulePaint();}};
  addEventListener('pointerup',release);addEventListener('pointercancel',release);
  strip.addEventListener('keydown',event=>{
   if(!active||event.target!==strip)return;
   const step=event.shiftKey?300:150;
   const current=clamp((scrollY-start)*speed);
   const destinations={ArrowLeft:current-step,ArrowRight:current+step,Home:0,End:range};
   if(!(event.key in destinations))return;
   event.preventDefault();
   scrollTo({top:start+clamp(destinations[event.key])/speed,behavior:'instant'});
   schedulePaint();
  });
  const observer=new ResizeObserver(scheduleMeasure);observer.observe(strip);observer.observe(pin);
  new MutationObserver(scheduleMeasure).observe(document.documentElement,{attributes:true,attributeFilter:['data-layout']});
  addEventListener('resize',scheduleMeasure);addEventListener('pageshow',scheduleMeasure);reduced.addEventListener('change',scheduleMeasure);
  document.fonts.ready.then(scheduleMeasure);
  for(const image of strip.querySelectorAll('img'))image.addEventListener('load',scheduleMeasure,{once:true});
  measure();
 }
}
