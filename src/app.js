import {clampCamera,galleryScale} from './gallery-math.mjs';
import {enableSectionScrolling} from './scroll-controller.js';
import {initializeViewportLayout} from './viewport-layout.js';
import {createMenuMotion,enableProjectReturn} from './menu-motion.js';
import {enableProcessScrolling} from './process-scroll.js';

initializeViewportLayout();

// Keep the composition from selecting or creating native drag ghosts. Form
// editing retains normal selection, clipboard shortcuts and text dragging.
document.addEventListener('dragstart',event=>{if(!event.target.closest('input,textarea,[contenteditable=true]'))event.preventDefault();});

const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation');
const header=document.querySelector('.site-header');
const moveMenu=createMenuMotion(nav,header);
function setMenu(open){
  menu.setAttribute('aria-expanded',String(open));nav.inert=!open;nav.setAttribute('aria-hidden',String(!open));
  moveMenu(open);
}
menu.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
enableProjectReturn(header,()=>setMenu(false));
document.addEventListener('pointerdown',event=>{if(!header.contains(event.target))setMenu(false);});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){setMenu(false);menu.focus();}
});

for(const viewport of document.querySelectorAll('[data-gallery]')){
  const canvas=viewport.querySelector('.gallery-canvas');
  const width=Number(canvas.dataset.width),height=Number(canvas.dataset.height);
  let x=0,y=0,scale=1,gesture=null,suppressClick=false,initialized=false,previousWidth=viewport.clientWidth,previousHeight=viewport.clientHeight;
  const projectLinks=[...canvas.querySelectorAll('[data-project]')];
  let hoveredProject,focusedProject;
  function highlightProject(){for(const link of projectLinks)link.classList.toggle('project-active',link.dataset.project===hoveredProject||link.dataset.project===focusedProject);}
  for(const link of projectLinks){
    link.addEventListener('pointerenter',()=>{hoveredProject=link.dataset.project;highlightProject();});
    link.addEventListener('pointerleave',()=>{hoveredProject=undefined;highlightProject();});
    link.addEventListener('pointerup',event=>{if(event.pointerType==='touch'){hoveredProject=undefined;highlightProject();}});
  }
  canvas.addEventListener('focusin',event=>{focusedProject=event.target.closest('[data-project]')?.dataset.project;highlightProject();});
  canvas.addEventListener('focusout',()=>queueMicrotask(()=>{focusedProject=canvas.contains(document.activeElement)?document.activeElement.closest('[data-project]')?.dataset.project:undefined;highlightProject();}));
  function paint(){
    x=clampCamera(x,viewport.clientWidth,width*scale);y=clampCamera(y,viewport.clientHeight,height*scale);
    canvas.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
  }
  function reset(){x=viewport.clientWidth/2-Number(canvas.dataset.centerX)*scale;y=viewport.clientHeight/2-Number(canvas.dataset.centerY)*scale;paint();}
  new ResizeObserver(()=>{
    const centerX=(previousWidth/2-x)/scale,centerY=(previousHeight/2-y)/scale;
    scale=galleryScale(viewport.clientWidth, Number(canvas.dataset.referenceWidth)||1632);
    if(!initialized){reset();initialized=true;}else{x=viewport.clientWidth/2-centerX*scale;y=viewport.clientHeight/2-centerY*scale;paint();}
    previousWidth=viewport.clientWidth;previousHeight=viewport.clientHeight;
  }).observe(viewport);
  viewport.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0)return;
    suppressClick=false;gesture={id:event.pointerId,startX:event.clientX,startY:event.clientY,x,y,moved:false};
  });
  viewport.addEventListener('pointermove',event=>{
    if(!gesture||gesture.id!==event.pointerId)return;
    const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;
    if(!gesture.moved&&Math.hypot(dx,dy)<7)return;
    gesture.moved=true;viewport.setPointerCapture(event.pointerId);viewport.classList.add('dragging');
    x=gesture.x+dx;y=gesture.y+dy;paint();
  });
  const end=event=>{
    if(!gesture||gesture.id!==event.pointerId)return;
    suppressClick=gesture.moved;gesture=null;viewport.classList.remove('dragging');
    if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
    if(event.type==='pointercancel')suppressClick=false;
  };
  viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
  viewport.addEventListener('lostpointercapture',()=>{gesture=null;viewport.classList.remove('dragging');});
  viewport.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;}},true);
  viewport.addEventListener('dragstart',event=>event.preventDefault());
  viewport.addEventListener('keydown',event=>{
    if(event.target!==viewport)return;
    const delta=event.shiftKey?150:60;
    const directions={ArrowLeft:[delta,0],ArrowRight:[-delta,0],ArrowUp:[0,delta],ArrowDown:[0,-delta]};
    if(directions[event.key]){event.preventDefault();x+=directions[event.key][0];y+=directions[event.key][1];paint();}
    if(event.key==='Home'){event.preventDefault();reset();}
  });
  // Reveal a keyboard-focused project even when it starts outside the clipped window.
  canvas.addEventListener('focusin',event=>{
    const project=event.target.closest('.gallery-project');if(!project||!project.matches(':focus-visible'))return;
    viewport.scrollLeft=0;viewport.scrollTop=0;
    const projectX=Number(project.dataset.canvasX??project.offsetLeft);
    const projectY=Number(project.dataset.canvasY??project.offsetTop);
    x=viewport.clientWidth/2-(projectX+project.offsetWidth/2)*scale;
    y=viewport.clientHeight/2-(projectY+project.offsetHeight/2)*scale;paint();
  });
}

const form=document.querySelector('[data-contact-form]');
for(const field of form?.querySelectorAll('[data-validate-contact]')??[]){
 const error=document.getElementById(field.getAttribute('aria-describedby'));
 function validate(){
  const valid=field.validity.valid;
  field.setAttribute('aria-invalid',String(!valid));
  error.hidden=valid;
  error.textContent=valid?'':field.validity.valueMissing?`Enter your ${field.type==='email'?'email address':'phone number'}.`:field.type==='email'?'Enter an email address like name@example.com.':'Enter a phone number with 7–15 digits.';
 }
 field.addEventListener('blur',validate);
 field.addEventListener('invalid',validate);
 field.addEventListener('input',()=>{if(field.hasAttribute('aria-invalid'))validate();});
}
if(form)form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const endpoint=form.dataset.endpoint,email=form.dataset.email;
  const status=form.querySelector('[role=status]'),button=form.querySelector('[type=submit]');
  if(!endpoint&&!email)return;
  if(endpoint){
    button.disabled=true;status.textContent='Sending…';
    try{const response=await fetch(endpoint,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});if(!response.ok)throw Error('Delivery failed');status.textContent='Thank you. Your project request has been sent.';form.reset();}
    catch{status.textContent='Your request could not be sent. Please try again.';}
    finally{button.disabled=false;}
  }else{
    const body=[...new FormData(form)].map(([key,value])=>`${key}: ${value}`).join('\n\n');
    location.href=`mailto:${email}?subject=${encodeURIComponent('Portfolio project inquiry')}&body=${encodeURIComponent(body)}`;
    status.textContent='Your email app will open with your request. Send the email there to complete it.';
  }
});

const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
enableSectionScrolling();
enableProcessScrolling();
for(const dropdown of document.querySelectorAll('[data-dropdown]')){
 const trigger=dropdown.querySelector('.dropdown-trigger'),list=dropdown.querySelector('[role=listbox]'),select=dropdown.querySelector('select'),options=[...list.querySelectorAll('[role=option]')];
 function close(focus=false){list.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();}
 function open(index=select.selectedIndex){
  for(const other of document.querySelectorAll('[data-dropdown]'))if(other!==dropdown){other.querySelector('[role=listbox]').hidden=true;other.querySelector('button').setAttribute('aria-expanded','false');}
  list.hidden=false;trigger.setAttribute('aria-expanded','true');options[Math.max(0,Math.min(options.length-1,index))].focus();
 }
 function choose(index){select.selectedIndex=index;dropdown.querySelector('[data-dropdown-value]').textContent=options[index].dataset.value;options.forEach((option,i)=>option.setAttribute('aria-selected',String(i===index)));select.dispatchEvent(new Event('change',{bubbles:true}));close(true);}
 trigger.addEventListener('click',()=>list.hidden?open():close());
 trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();open();}if(event.key==='Escape')close(true);});
 options.forEach((option,index)=>{
  option.addEventListener('click',event=>{event.preventDefault();choose(index);});
  option.addEventListener('keydown',event=>{
   if(['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(event.key))event.preventDefault();
   if(event.key==='ArrowDown')options[(index+1)%options.length].focus();
   if(event.key==='ArrowUp')options[(index-1+options.length)%options.length].focus();
   if(event.key==='Home')options[0].focus();if(event.key==='End')options.at(-1).focus();
   if(event.key==='Enter'||event.key===' ')choose(index);if(event.key==='Escape')close(true);if(event.key==='Tab')close();
  });
 });
 document.addEventListener('pointerdown',event=>{if(!dropdown.contains(event.target))close();});
}

for(const stage of document.querySelectorAll('[data-reference-stage]')){
  const panel=stage.closest('.reference-panel');
  const resize=()=>{
    if(panel.hasAttribute('data-reference-flow')){stage.style.setProperty('--reference-scale',String(panel.clientWidth/Number(stage.dataset.width)));return;}
    const gutter=document.documentElement.dataset.layout==='compact'?12:48;
    const availableHeight=panel.clientHeight-(document.documentElement.dataset.layout==='compact'?95:110);
    const scale=Math.min((panel.clientWidth-gutter*2)/Number(stage.dataset.width),availableHeight/Number(stage.dataset.height));
    stage.style.setProperty('--reference-scale',String(scale));
  };
  new ResizeObserver(resize).observe(panel);resize();
}

for(const window of document.querySelectorAll('[data-word-cycle]')){
  const track=window.querySelector('.word-track'),count=track.children.length-1;
  let index=0,timer,visible=false;
  function next(){
    if(index>=count)return;
    index++;track.style.transform=`translateY(-${index*100/(count+1)}%)`;
    if(index===count)setTimeout(()=>{track.style.transition='none';index=0;track.style.transform='translateY(0)';requestAnimationFrame(()=>requestAnimationFrame(()=>{track.style.transition='';}));},reducedMotion?0:1050);
  }
  function schedule(){clearInterval(timer);if(visible&&!reducedMotion)timer=setInterval(next,4000);}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.4}).observe(window);
  window.addEventListener('click',()=>{next();schedule();});
}

for(const strip of document.querySelectorAll('[data-horizontal-drag]')){
 let gesture;
 strip.addEventListener('pointerdown',event=>{
  if(event.button!==0||event.pointerType==='touch')return;
  const rect=strip.getBoundingClientRect();
  const barHeight=strip.scrollWidth>strip.clientWidth?Math.max(4,strip.offsetHeight-strip.clientHeight):0;
  if(event.clientY>=rect.bottom-barHeight||event.clientX>=rect.left+strip.clientLeft+strip.clientWidth)return;
  gesture={id:event.pointerId,x:event.clientX,scroll:strip.scrollLeft,moved:false};
 });
 strip.addEventListener('pointermove',event=>{
  if(!gesture||event.pointerId!==gesture.id)return;
  const delta=event.clientX-gesture.x;if(!gesture.moved&&Math.abs(delta)<6)return;
  gesture.moved=true;strip.classList.add('dragging');strip.setPointerCapture(event.pointerId);strip.scrollLeft=gesture.scroll-delta;
 });
 const end=event=>{if(!gesture||gesture.id!==event.pointerId)return;gesture=null;strip.classList.remove('dragging');if(strip.hasPointerCapture(event.pointerId))strip.releasePointerCapture(event.pointerId);};
 strip.addEventListener('pointerup',end);strip.addEventListener('pointercancel',end);
 strip.addEventListener('dragstart',event=>event.preventDefault());
}

for(const element of document.querySelectorAll('[data-state-machine]')){
  const data=JSON.parse(element.dataset.stateMachine);
  const states=new Map([[data.initial,data.transitions],...data.states.map(s=>[s.id,s.transitions])]);
  let current=data.initial,timer,gesture;
  const frames=[...element.children].filter(child=>child.classList.contains('reference-state'));
  function change(target,duration=.3){
    if(!states.has(target)||target===current)return;
    clearTimeout(timer);current=target;element.style.setProperty('--state-duration',`${reducedMotion?0:duration}s`);
    for(const frame of frames){const active=frame.dataset.state===current;frame.classList.toggle('active',active);frame.inert=!active;frame.setAttribute('aria-hidden',String(!active));}
    schedule();
  }
  function schedule(){
    clearTimeout(timer);
    const action=(states.get(current)??[]).find(a=>a.event==='AFTER_TIMEOUT');
    if(action&&!reducedMotion)timer=setTimeout(()=>change(action.target,action.duration),Math.max(50,action.delay*1000));
  }
  function trigger(events){const action=(states.get(current)??[]).find(a=>events.includes(a.event));if(action)change(action.target,action.duration);}
  element.addEventListener('pointerenter',()=>trigger(['ON_HOVER','MOUSE_ENTER']));
  element.addEventListener('pointerleave',()=>{if(data.transitions.some(a=>['ON_HOVER','MOUSE_ENTER'].includes(a.event)))change(data.initial,1);});
  element.addEventListener('click',()=>trigger(['ON_CLICK']));
  element.addEventListener('pointerdown',event=>{gesture={x:event.clientX,y:event.clientY};});
  element.addEventListener('pointerup',event=>{if(gesture&&Math.abs(event.clientX-gesture.x)>25&&Math.abs(event.clientX-gesture.x)>Math.abs(event.clientY-gesture.y))trigger(['DRAG']);gesture=null;});
  new IntersectionObserver(entries=>{if(entries[0].isIntersecting)schedule();else clearTimeout(timer);}).observe(element);
}
