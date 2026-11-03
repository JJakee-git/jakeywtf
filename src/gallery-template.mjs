// Build-time renderer for the gallery layers decoded from the user's Figma file.
import {artworkOutline} from './gallery-outline.mjs';
const rgba=(color,opacity=1)=>`rgba(${Math.round(color.r*255)},${Math.round(color.g*255)},${Math.round(color.b*255)},${(color.a??1)*opacity})`;

function bounds(node){
 const t=node.transform??{m00:1,m01:0,m02:0,m10:0,m11:1,m12:0};
 const corners=[[0,0],[node.size.x,0],[node.size.x,node.size.y],[0,node.size.y]].map(([x,y])=>[t.m00*x+t.m01*y+t.m02,t.m10*x+t.m11*y+t.m12]);
 return {left:Math.min(...corners.map(p=>p[0])),top:Math.min(...corners.map(p=>p[1])),right:Math.max(...corners.map(p=>p[0])),bottom:Math.max(...corners.map(p=>p[1]))};
}

export function renderGallery({full=false,projects,scene,img,esc}){
 const addedProjects=projects.filter(p=>!p.sceneNode);
 const additionsBounds=addedProjects.map(p=>({left:p.position.x,top:p.position.y,right:p.position.x+p.position.width,bottom:p.position.y+p.position.width*.91}));
 const width=Math.max(scene.width,...additionsBounds.map(r=>r.right+500));
 const height=Math.max(scene.height,...additionsBounds.map(r=>r.bottom+500));
 const outline=artworkOutline([...scene.root.children.filter(n=>n.size).map(bounds),...additionsBounds],width,height);
 const boundary=`<svg class="canvas-boundary" aria-hidden="true" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><path d="${outline}"/></svg>`;
 // A project can own multiple artwork frames plus its plaque in the source canvas.
 const links=new Map(projects.flatMap(p=>[...new Set([p.sceneNode,...(p.sceneNodes??[])].filter(Boolean))].map(id=>[id,p])));
 function fills(node){return node.fills.map(fill=>fill.type==='image'?`<img class="scene-fill" src="${esc(fill.path)}" alt="" draggable="false" decoding="async" style="opacity:${fill.opacity};object-fit:${fill.fit}">`:`<span class="scene-fill" style="background:${rgba(fill.color,fill.opacity)}"></span>`).join('');}
 function render(node){
  const project=links.get(node.id),tag=project?'a':'div';
  const nameplate=Boolean(project&&node.children?.some(child=>child.type==='TEXT'));
  const style=[`width:${node.size?.x??0}px`,`height:${node.size?.y??0}px`,`opacity:${node.opacity}`];
  const t=node.transform;
  if(t)style.push(`transform:matrix(${t.m00},${t.m10},${t.m01},${t.m11},${t.m02},${t.m12})`);
  else if(node.type==='TEXT')style.push('left:50%','top:50%','transform:translate(-50%,-50%)');
  if(node.clip)style.push('overflow:hidden');
  if(node.shadow)style.push(`filter:drop-shadow(${node.shadow.x}px ${node.shadow.y}px ${node.shadow.blur/2}px ${rgba(node.shadow.color)})`);
  let content='';
  if(node.type==='TEXT'){
   const color=node.fills.find(f=>f.type==='solid');
   style.push(`font-size:${node.fontSize??24}px`,`text-align:${node.align}`,'white-space:pre-wrap','line-height:1.2');
   if(color)style.push(`color:${rgba(color.color,color.opacity)}`);
   content=esc(node.text);
  }else content=fills(node)+node.children.map(render).join('');
  if(nameplate)content=`<div class="nameplate-face">${content}</div>`;
  return `<${tag} class="scene-node${project?' gallery-project':''}${nameplate?' gallery-nameplate':''}${node.type==='TEXT'?' scene-text':''}" data-source-node="${node.id}" style="${style.join(';')}"${project?` href="projects/${project.slug}/" data-project="${project.slug}" aria-label="View ${esc(project.title)}" data-canvas-x="${t?.m02??0}" data-canvas-y="${t?.m12??0}"`:''}>${content}</${tag}>`;
 }
 const additions=addedProjects.map(p=>`<a class="gallery-project added-project" href="projects/${p.slug}/" data-project="${p.slug}" data-canvas-x="${p.position.x}" data-canvas-y="${p.position.y}" style="left:${p.position.x}px;top:${p.position.y}px;width:${p.position.width}px" aria-label="View ${esc(p.title)}"><div class="added-project-frame"><div class="added-project-art">${img(p.preview,p.title)}</div>${img('assets/branding/ornate-gold-frame.png','','added-frame-overlay')}</div><span class="added-project-plaque"><span class="plaque nameplate-face">${esc(p.title)}</span></span></a>`).join('');
 return `<section class="gallery-section ${full?'gallery-full':''}" id="work" aria-label="Selected work"><div class="gold-frame"><div class="gallery-viewport" tabindex="0" role="region" aria-label="Draggable project gallery. Drag in any direction, or use the arrow keys. Home returns to the starting view." data-gallery><div class="gallery-canvas" style="width:${width}px;height:${height}px;background:none" data-width="${width}" data-height="${height}" data-reference-width="${scene.referenceViewportWidth}" data-center-x="${scene.centerX}" data-center-y="${scene.centerY}">${fills(scene.root)}${scene.root.children.map(render).join('')}${additions}${boundary}</div></div>${img('assets/branding/ornate-gold-frame.png','','frame-overlay',false)}${full?'':`<a class="more-projects" href="projects/">${img('assets/branding/more-projects-plaque.png','See more of my projects')}</a>`}</div></section>`;
}
