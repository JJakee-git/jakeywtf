// Native vertical page scrolling drives a sticky horizontal process gallery.
// No wheel events are captured, so reversing direction and leaving the section
// remain ordinary page scrolling.
export function enableProcessScrolling(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 for(const section of document.querySelectorAll('.page-project .project-process-flow')){
  const strip=section.querySelector('.process-strip');
  if(!strip)continue;
  const pin=document.createElement('div');pin.className='process-pin';
  pin.append(...section.childNodes);section.append(pin);
  let active=false,start=0,range=0,paintFrame=0,measureFrame=0;
  const clamp=value=>Math.max(0,Math.min(range,value));
  function paint(){
   paintFrame=0;
   if(active)strip.scrollLeft=clamp(scrollY-start);
  }
  function measure(){
   measureFrame=0;
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
   section.style.height=`${pin.offsetHeight+range}px`;
   start=section.getBoundingClientRect().top+scrollY;
   paint();
  }
  const scheduleMeasure=()=>{if(!measureFrame)measureFrame=requestAnimationFrame(measure);};
  addEventListener('scroll',()=>{if(active&&!paintFrame)paintFrame=requestAnimationFrame(paint);},{passive:true});
  // Keep dragging, the scrollbar, and horizontal keyboard input in sync with
  // the same page progress instead of fighting the pinned scroll position.
  strip.addEventListener('scroll',()=>{
   if(!active||Math.abs(strip.scrollLeft-clamp(scrollY-start))<2)return;
   const rect=pin.getBoundingClientRect();
   if(rect.bottom<=0||rect.top>=innerHeight)return;
   scrollTo({top:start+strip.scrollLeft,behavior:'instant'});
  },{passive:true});
  const observer=new ResizeObserver(scheduleMeasure);observer.observe(strip);observer.observe(pin);
  new MutationObserver(scheduleMeasure).observe(document.documentElement,{attributes:true,attributeFilter:['data-layout']});
  addEventListener('resize',scheduleMeasure);addEventListener('pageshow',scheduleMeasure);reduced.addEventListener('change',scheduleMeasure);
  document.fonts.ready.then(scheduleMeasure);
  for(const image of strip.querySelectorAll('img'))image.addEventListener('load',scheduleMeasure,{once:true});
  measure();
 }
}
