const rgba=(c,o=1)=>c?`rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${(c.a??1)*o})`:'transparent';
export function renderReference(panel,{esc,label='Project details',className='',start=false,flow=false}){
 function node(n){
  const t=n.transform??{m00:1,m01:0,m02:0,m10:0,m11:1,m12:0};
  const style=[`width:${n.size?.x??0}px`,`height:${n.size?.y??0}px`,`transform:matrix(${t.m00},${t.m10},${t.m01},${t.m11},${t.m02},${t.m12})`,`opacity:${n.opacity}`];
  if(n.clip)style.push('overflow:hidden');
  if(n.stroke&&n.strokeWidth)style.push(`border:${n.strokeWidth}px solid ${rgba(n.stroke)}`);
  let html='';
  if(n.type==='TEXT'){
   const paint=n.fills.find(f=>f.type==='solid');
   style.push(`font-family:${n.font?.family?.includes('Brutalisme')?'Brutalisme':'Helvetica Neue'}`,`font-size:${n.fontSize}px`,`--figma-font-size:${n.fontSize}px`,`font-weight:${n.weight}`,`text-align:${n.align}`,'line-height:1.2');
   if(paint)style.push(`color:${rgba(paint.color,paint.opacity)}`);
   html=esc(n.text);
  }else{
   html=n.fills.map(p=>p.type==='image'?`<img src="${esc(p.path)}" class="reference-fill" alt="${esc(n.name)}" draggable="false" decoding="async" style="object-fit:${p.fit};opacity:${p.opacity};mix-blend-mode:${p.blend==='normal'?'normal':p.blend??'normal'}">`:`<span class="reference-fill" style="background:${rgba(p.color,p.opacity)}"></span>`).join('');
   if(n.paths?.length){const fill=n.fills.find(p=>p.type==='solid');html=`<svg class="reference-fill" viewBox="0 0 ${n.size.x} ${n.size.y}">${n.paths.map(p=>`<path d="${p.d}" fill="${fill?rgba(fill.color,fill.opacity):'none'}"/>`).join('')}</svg>`;}
   const childHTML=n.children.map(node).join('');
   if(n.sourceSize&&n.size&&(n.sourceSize.x!==n.size.x||n.sourceSize.y!==n.size.y))html+=`<div class="reference-children" style="transform:scale(${n.size.x/n.sourceSize.x},${n.size.y/n.sourceSize.y})">${childHTML}</div>`;
   else html+=childHTML;
  }
  let machine='';
  if(n.stateMachine){
   machine=` data-state-machine="${esc(JSON.stringify({initial:n.stateMachine.initial,transitions:n.stateMachine.transitions,states:n.stateMachine.variants.map(v=>({id:v.id,transitions:v.transitions}))}))}"`;
   html=`<div class="reference-state active" data-state="${n.stateMachine.initial}">${html}</div>`+n.stateMachine.variants.map(v=>`<div class="reference-state" data-state="${v.id}" inert aria-hidden="true"><div class="reference-children" style="transform:scale(${(n.size?.x??1)/(v.node.size?.x??1)},${(n.size?.y??1)/(v.node.size?.y??1)})">${node(v.node)}</div></div>`).join('');
  }
  return `<div class="reference-node${n.type==='TEXT'?' reference-text':''}" data-figma-node="${n.id}" style="${style.join(';')}"${machine}>${html}</div>`;
 }
 return `<section class="reference-panel ${className}" aria-label="${esc(label)}" ${start?'data-project-start':''} ${flow?`data-reference-flow style="aspect-ratio:${panel.width}/${panel.height}"`:''}><div class="reference-stage" data-reference-stage data-width="${panel.width}" data-height="${panel.height}" style="width:${panel.width}px;height:${panel.height}px">${panel.nodes.map(node).join('')}</div></section>`;
}

const descendants=nodes=>nodes.flatMap(n=>[n,...descendants(n.children??[])]);
const findNode=(panels,id)=>panels.flatMap(p=>descendants(p.nodes)).find(n=>n.id===id);

// Keep the original collage, but let the biography wrap as real paragraphs.
export function renderOrigins(panel,{esc,img}){
 const nodes=descendants(panel.nodes);
 const paragraphs=['147:1392','147:1393','147:1395','147:1396','147:1397'].map(id=>nodes.find(n=>n.id===id));
 const portrait=nodes.find(n=>n.id==='147:1369');
 const monochrome=portrait.children[0].fills.find(p=>p.type==='image').path;
 const colour=portrait.stateMachine.variants[0].node.children[0].fills.find(p=>p.type==='image').path;
 const interests=nodes.filter(n=>n.type==='TEXT'&&!paragraphs.includes(n)&&n.id!=='147:1389');
 return `<section class="origins-section snap-panel" aria-labelledby="origins-heading"><div class="origins-corner" aria-hidden="true"></div><div class="origins-bracket" aria-hidden="true"></div><h2 id="origins-heading">ORIGINS</h2><div class="origins-copy">${paragraphs.map(n=>`<p>${esc(n.text)}</p>`).join('')}</div><div class="origins-interests" aria-label="Some of my interests">${interests.map(n=>`<span style="left:${n.transform.m02/panel.width*100}%;top:${n.transform.m12/panel.height*100}%;--interest-angle:${Math.atan2(n.transform.m10,n.transform.m00)*180/Math.PI}deg;--interest-size:${n.fontSize/1728*100}vw">${esc(n.text)}</span>`).join('')}</div><figure class="origins-portrait">${img(monochrome,'Jacob Spierer with a praying mantis','',false)}${img(colour,'','origins-portrait-colour',false)}</figure></section>`;
}

function renderStory(source,{esc,title}){
 const texts=descendants([source]).filter(n=>n.type==='TEXT');
 const name=texts.find(n=>n.fontSize>=40)?.text??title;
 const meta=texts.filter(n=>n.fontSize<=12);
 const content=texts.filter(n=>n.fontSize>12&&n.fontSize<40);
 return `<article class="project-story" tabindex="0" aria-label="${esc(title)} project details"><h2>${esc(name)}</h2><div class="project-story-meta">${meta.map(n=>`<span>${esc(n.text)}</span>`).join('')}</div>${content.map(n=>n.fontSize>=24?`<h3>${esc(n.text)}</h3>`:`<p>${esc(n.text)}</p>`).join('')}</article>`;
}

// The artwork still uses its original Figma geometry. Text and sketch rows flow
// independently, so browser text scaling never shrinks them into a tiny canvas.
export function renderProjectDetails(ref,project,{esc,img}){
 const panels=[ref.overview,ref.process];
 const get=id=>findNode(panels,id);
 const artwork=(id,label)=>{
  const n=get(id);
  return renderReference({width:n.size.x,height:n.size.y,nodes:[{...n,transform:{m00:1,m01:0,m02:0,m10:0,m11:1,m12:0}}]},{esc,label,className:'project-art-reference',flow:true});
 };
 let columns='';
 if(project.slug==='mercedesbenz')columns=`<div class="project-column">${artwork('118:1170','Mercedes-Benz poster mockup')}</div><div class="project-column">${renderStory(get('118:1746'),{esc,title:project.title})}${artwork('118:1193','Mercedes-Benz G55 Cabrio illustration')}</div>`;
 if(project.slug==='fjallraven')columns=`<div class="project-column">${artwork('135:758','Fjällräven backpack designs')}${artwork('145:836','Fjällräven pattern designs')}</div><div class="project-column">${renderStory(get('145:886'),{esc,title:project.title})}${artwork('135:761','Fjällräven scouting pattern')}</div>`;
 if(project.slug==='spierer-university')columns=`<div class="project-column">${artwork('143:515','Spierer University merchandise catalog')}${artwork('143:539','Spierer University additional catalog artwork')}</div><div class="project-column">${artwork('143:518','Spierer University mascot and sticker sets')}${renderStory(get('143:583'),{esc,title:project.title})}</div>`;
 const heading=ref.process.nodes.find(n=>descendants([n]).some(c=>c.type==='TEXT'&&c.text==='PROCESS & SKETCHES'));
 const processMeta=descendants([heading]).filter(n=>n.type==='TEXT'&&n.fontSize<=12);
 const strip=ref.process.nodes.find(n=>n.children?.filter(c=>c.children?.some(d=>d.type==='TEXT')).length>=2&&n.size.x===1728);
 const sketches=strip.children.map(n=>{
  const imageNode=descendants([n]).find(c=>c.fills?.some(f=>f.type==='image'));
  const caption=descendants([n]).find(c=>c.type==='TEXT');
  if(!imageNode||!caption)return '';
  const asset=imageNode.fills.find(f=>f.type==='image');
  return `<figure style="--sketch-ratio:${imageNode.size.x/imageNode.size.y}">${img(asset.path,caption.text.trim(),'process-image')}<figcaption>${esc(caption.text.trim())}</figcaption></figure>`;
 }).join('');
 return renderReference(ref.hero,{esc,label:project.title+' artwork',className:'project-reference project-hero-reference',start:true,flow:true})+`<section class="project-overview-flow" aria-label="${esc(project.title)} overview"><div class="project-overview-grid">${columns}</div></section><section class="project-process-flow" aria-labelledby="process-heading"><div class="project-process-heading"><h2 id="process-heading">PROCESS &amp; SKETCHES</h2><div class="project-story-meta">${processMeta.map(n=>`<span>${esc(n.text)}</span>`).join('')}</div></div><div class="process-strip" tabindex="0" role="region" aria-label="${esc(project.title)} sketches and moodboards; scroll horizontally to explore" data-horizontal-drag>${sketches}</div></section>`;
}
