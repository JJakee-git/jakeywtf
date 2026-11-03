// Use the actual browser window for layout mode, so page zoom does not switch
// a wide desktop window to the phone layout. Readable body text still zooms.
export function initializeViewportLayout(){
 const root=document.documentElement;
 root.style.setProperty('--nav-count',String(document.querySelectorAll('#navigation a').length||4));
 const phone=matchMedia('(hover: none) and (pointer: coarse)').matches;
 const initialDifference=outerWidth-innerWidth;
 const horizontalChrome=!phone&&initialDifference>=0&&initialDifference<=40?initialDifference:0;
 const widthRules=[];
 for(const sheet of document.styleSheets){
  let rules;try{rules=sheet.cssRules;}catch{continue;}
  for(const rule of rules)if(rule.type===CSSRule.MEDIA_RULE&&/max-width\s*:\s*809px/.test(rule.conditionText))widthRules.push(rule);
 }
 function resize(){
  const windowWidth=phone?innerWidth:Math.max(1,(outerWidth||innerWidth)-horizontalChrome);
  const compact=windowWidth<=809;
  const unit=Math.max(.1,Math.min(8,innerWidth/windowWidth));
  root.style.setProperty('--ui',`${unit}px`);
  root.dataset.layout=compact?'compact':'wide';
  for(const rule of widthRules)rule.media.mediaText=compact?'all':'not all';
 }
 resize();addEventListener('resize',resize);
 return resize;
}
