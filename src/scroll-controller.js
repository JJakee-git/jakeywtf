// A reversible pull previews the next section before a deliberate gesture commits.
// The test routes share these sections, with four distinct motion models.
export function enableSectionScrolling(){
 const root=document.documentElement,main=document.querySelector('#main');
 if(root.classList.contains('continuous-scroll'))return;
 const panels=[...main.querySelectorAll(':scope > .snap-panel,:scope > .gallery-section,:scope > .reference-panel')];
 if(panels.length<2||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const mode=main.dataset.scrollMode||'spring';
 root.style.scrollSnapType='none';root.style.scrollBehavior='auto';
 let phase='idle',position=scrollY,target=scrollY,velocity=0,pull=0,base=scrollY,index=0;
 let frame=0,lastFrame=0,lastInput=0,blockedUntil=0,timer,settleFrom=0,settleStarted=0,duration=900,touch;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const nearest=y=>panels.reduce((best,p,i)=>Math.abs(p.offsetTop-y)<Math.abs(panels[best].offsetTop-y)?i:best,0);
 const maxScroll=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
 function state(next){phase=next;root.dataset.scrollPhase=next;}
 function paint(){
  const maximum=maxScroll(),actual=clamp(position,0,maximum),overscroll=position-actual;
  main.style.transform=Math.abs(overscroll)>.1?`translateY(${-overscroll}px)`:'';
  scrollTo({top:actual,behavior:'instant'});
 }
 function startFrame(){if(!frame){lastFrame=performance.now();frame=requestAnimationFrame(tick);}}
 function finish(){
  position=target;velocity=0;pull=0;paint();state('idle');
  blockedUntil=Math.max(performance.now()+100,lastInput+170);
 }
 function tick(now){
  frame=0;const dt=Math.min(2.5,Math.max(.25,(now-lastFrame)/16.667));lastFrame=now;
  if(phase==='settle'){
   if(mode==='spring'||mode==='momentum'){
    const stiffness=mode==='spring'?.035:.023,damping=mode==='spring'?.78:.79;
    velocity=(velocity+(target-position)*stiffness*dt)*Math.pow(damping,dt);position+=velocity*dt;
    if(Math.abs(target-position)<.45&&Math.abs(velocity)<.12){finish();return;}
   }else{
    const t=Math.min(1,(now-settleStarted)/duration);
    const progress=mode==='magnetic'?1-Math.pow(1-t,4):duration<700?1-Math.pow(1-t,3):t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    position=settleFrom+(target-settleFrom)*progress;
    if(t===1){finish();return;}
   }
  }else if(phase==='pull'||phase==='glide'){
   const smoothing=mode==='momentum'?.18:mode==='magnetic'?.5:.34;
   position+=(target-position)*(1-Math.pow(1-smoothing,dt));
   if(Math.abs(target-position)<.08){position=target;paint();return;}
  }else return;
  paint();frame=requestAnimationFrame(tick);
 }
 function settle(y,nextIndex,returning=false){
  clearTimeout(timer);index=nextIndex;target=y;settleFrom=position;settleStarted=performance.now();
  duration=returning?520:mode==='magnetic'?1050:950;
  if(phase!=='glide')velocity=0;
  state('settle');startFrame();
 }
 function release(){
  if(phase==='glide'){const next=nearest(target);settle(panels[next].offsetTop,next);return;}
  if(phase!=='pull')return;
  const threshold=mode==='magnetic'?innerHeight*.16:mode==='spring'?130:180;
  const next=Math.abs(pull)>=threshold?clamp(index+Math.sign(pull),0,panels.length-1):index;
  settle(next===index?base:panels[next].offsetTop,next,next===index);
 }
 function activePanel(){return panels.findLast(p=>p.offsetTop<=scrollY+2)||panels[0];}
 function nativeInsideTallPanel(direction){
  if(phase!=='idle')return false;
  const active=activePanel();
  return active.offsetHeight>innerHeight+2&&(direction>0?scrollY+innerHeight<active.offsetTop+active.offsetHeight-2:scrollY>active.offsetTop+2);
 }
 function input(delta){
  const now=performance.now(),gap=now-lastInput;lastInput=now;
  if(nativeInsideTallPanel(Math.sign(delta)))return false;
  if(mode!=='momentum'&&(phase==='settle'||now<blockedUntil))return true;
  if(mode==='momentum'){
   if(phase!=='glide'){position=scrollY;target=scrollY;velocity=0;}
   target=clamp(target+delta*.9,-70,maxScroll()+70);state('glide');startFrame();
  }else{
   if(phase==='idle'||gap>300&&phase==='pull'){
    const active=activePanel();index=active.offsetHeight>innerHeight+2?panels.indexOf(active):nearest(scrollY);
    base=scrollY;position=scrollY;pull=0;
   }
   pull+=delta;
   const limit=innerHeight*(mode==='magnetic'?.46:.19),gain=mode==='spring'?.6:mode==='magnetic'?1:.42;
   target=base+Math.sign(pull)*limit*(1-Math.exp(-Math.abs(pull)*gain/limit));
   state('pull');startFrame();
   if(mode!=='magnetic'&&Math.abs(pull)>=(mode==='spring'?130:180)){
    const next=clamp(index+Math.sign(pull),0,panels.length-1);
    if(next!==index){settle(panels[next].offsetTop,next);return true;}
   }
  }
  clearTimeout(timer);timer=setTimeout(release,mode==='momentum'?190:165);
  return true;
 }
 addEventListener('wheel',event=>{
  if(event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||event.target.closest('.dropdown-options,input,select,textarea,[data-horizontal-drag]'))return;
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  if(input(delta))event.preventDefault();
 },{passive:false});
 addEventListener('touchstart',event=>{
  if(event.touches.length!==1||event.target.closest('[data-gallery],.site-header,.scroll-test-toolbar,input,select,textarea,[data-horizontal-drag]')){touch=undefined;return;}
  touch={x:event.touches[0].clientX,y:event.touches[0].clientY,lastY:event.touches[0].clientY};
 },{passive:true});
 addEventListener('touchmove',event=>{
  if(!touch||event.touches.length!==1)return;
  const point=event.touches[0],delta=touch.lastY-point.clientY;touch.lastY=point.clientY;
  if(Math.abs(point.clientX-touch.x)>Math.abs(point.clientY-touch.y))return;
  if(input(delta*2))event.preventDefault();
 },{passive:false});
 addEventListener('touchend',()=>{if(touch){touch=undefined;release();}},{passive:true});
 addEventListener('touchcancel',()=>{touch=undefined;release();},{passive:true});
 addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,select,textarea,[data-gallery],[data-horizontal-drag],[contenteditable=true]'))return;
  if(event.target.closest('a,button')&&[' ','Enter'].includes(event.key))return;
  const direction=['ArrowDown','PageDown',' '].includes(event.key)?event.shiftKey?-1:1:['ArrowUp','PageUp'].includes(event.key)?-1:0;
  if(!direction&&!['Home','End'].includes(event.key))return;
  if(direction&&nativeInsideTallPanel(direction))return;
  event.preventDefault();
  if(phase==='settle')return;
  const active=activePanel(),current=active.offsetHeight>innerHeight+2?panels.indexOf(active):nearest(scrollY);
  const next=event.key==='Home'?0:event.key==='End'?panels.length-1:clamp(current+direction,0,panels.length-1);
  position=scrollY;settle(panels[next].offsetTop,next);
 });
 addEventListener('scroll',()=>{if(phase==='idle'){position=scrollY;index=nearest(scrollY);}},{passive:true});
 addEventListener('resize',()=>{
  clearTimeout(timer);if(frame)cancelAnimationFrame(frame);frame=0;
  state('idle');position=scrollY;target=scrollY;pull=0;velocity=0;main.style.transform='';
 });
 state('idle');
}
