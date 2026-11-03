import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
const root='original-assets/figma-export/extracted';
const document=JSON.parse(await readFile(root+'/document.json','utf8'));
const inventory=JSON.parse((await readFile(root+'/inventory.json','utf8')).replace(/^\uFEFF/,''));
const id=g=>g?`${g.sessionID}:${g.localID}`:null;
const nodes=document.nodeChanges,byId=new Map(nodes.map(n=>[id(n.guid),n]));
const children=new Map();
for(const n of nodes){const p=id(n.parentIndex?.guid);if(!children.has(p))children.set(p,[]);children.get(p).push(n);}
for(const list of children.values())list.sort((a,b)=>(a.parentIndex.position<b.parentIndex.position?-1:1));
await mkdir('public/assets/reference-pages',{recursive:true});
const assets=new Map();
async function paints(list=[]){
 const result=[];
 for(const p of list){
  if(p.visible===false)continue;
  if(p.type==='IMAGE'){
   const hash=Buffer.from(Object.values(p.image.hash)).toString('hex');
   const image=inventory.find(i=>i.id===hash);if(!image)continue;
   const name=(p.image.name||'image').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
   const path=`assets/reference-pages/${name.slice(0,70)}-${hash.slice(0,8)}.${image.format}`;
   if(!assets.has(hash)){await copyFile(root+'/'+image.file,'public/'+path);assets.set(hash,{name:p.image.name,path,source:image.file});}
   result.push({type:'image',path,opacity:p.opacity??1,fit:p.imageScaleMode==='FIT'?'contain':'cover',blend:p.blendMode?.toLowerCase()});
  }else if(p.type==='SOLID')result.push({type:'solid',color:p.color,opacity:p.opacity??1});
 }
 return result;
}
function pathFromBlob(index){
 const bytes=document.blobs[index]?.bytes;if(!bytes)return '';
 const b=Buffer.from(Object.values(bytes));let offset=0,path='';
 while(offset<b.length){const op=b[offset++],command=['Z','M','L','C','Q'][op],count=[0,2,2,6,4][op];if(!command||offset+count*4>b.length)return '';const values=[];for(let i=0;i<count;i++,offset+=4)values.push(Number(b.readFloatLE(offset).toFixed(3)));path+=command+values.join(' ');}
 return path;
}
async function convert(original,overrides=new Map(),depth=0,allowVariants=true){
 if(depth>18)return null;
 let node={...original,...overrides.get(id(original.guid))};
 let kids=children.get(id(node.guid))??[],sourceSize=node.size;
 if(node.symbolData){
  const master=byId.get(id(node.symbolData.symbolID));
  if(master){sourceSize=master.size;kids=children.get(id(master.guid))??[];node={...master,...node};}
  overrides=new Map(overrides);
  for(const override of [...(node.symbolData.symbolOverrides??[]),...(node.derivedSymbolData??[])]){
   const key=id(override.guidPath?.guids?.at(-1));if(key)overrides.set(key,{...overrides.get(key),...override});
  }
 }
 const result={id:id(original.guid),name:node.name,type:node.type,size:node.size??node.derivedTextData?.layoutSize,sourceSize,transform:node.transform,opacity:node.opacity??1,clip:node.frameMaskDisabled===false,fills:await paints(node.fillPaints),stroke:node.strokePaints?.find(p=>p.visible!==false&&p.type==='SOLID')?.color,strokeWidth:node.strokeWeight??0};
 if(node.type==='TEXT')Object.assign(result,{text:node.textData?.characters??node.name,font:node.fontName,fontSize:node.fontSize??24,align:node.textAlignHorizontal?.toLowerCase()??'left',vertical:node.textAlignVertical?.toLowerCase(),lineHeight:node.lineHeight,weight:/bold|75/i.test(node.fontName?.style)?700:400});
 if(node.type==='VECTOR')result.paths=(node.fillGeometry??[]).map(g=>({d:pathFromBlob(g.commandsBlob),rule:g.windingRule})).filter(p=>p.d);
 result.children=[];
 for(const child of kids)if(child.visible!==false){const converted=await convert(child,overrides,depth+1,allowVariants);if(converted)result.children.push(converted);}
 if(original.type==='INSTANCE'&&result.size&&result.children.some(c=>c.size?.x>=result.size.x*.95&&c.size?.y>=result.size.y*.95))result.sourceSize=result.size;
 if(node.stackMode){
  const horizontal=node.stackMode==='HORIZONTAL',padX=node.stackHorizontalPadding??0,padY=node.stackVerticalPadding??0;
  let cursor=horizontal?padX:padY;
  for(const child of result.children){
   if(!child.transform){const w=child.size?.x??0,h=child.size?.y??0;child.transform={m00:1,m01:0,m02:horizontal?cursor:((result.size?.x??0)-w)/2,m10:0,m11:1,m12:horizontal?((result.size?.y??0)-h)/2:cursor};}
   cursor+=(horizontal?child.size?.x??0:child.size?.y??0)+(node.stackSpacing??0);
  }
 }
 const directTransitions=n=>(n.prototypeInteractions??[]).filter(i=>!i.isDeleted).flatMap(i=>i.actions.filter(a=>a.navigationType==='SWAP_STATE').map(a=>({event:i.event.interactionType,delay:i.event.transitionTimeout??0,target:id(a.transitionNodeID),duration:a.transitionDuration??.3,type:a.transitionType})));
 const transitions=n=>{const own=directTransitions(n);return own.length?own:(children.get(id(n.guid))??[]).flatMap(directTransitions);};
 if(allowVariants&&node.type!=='TEXT'&&transitions(node).length){
  const initial=transitions(node),initialId=id(node.symbolData?.symbolID)??id(original.guid),queue=initial.map(t=>t.target),seen=new Set([initialId]),variants=[];
  while(queue.length&&variants.length<16){const target=queue.shift();if(seen.has(target))continue;seen.add(target);const targetNode=byId.get(target);if(!targetNode)continue;const converted=await convert(targetNode,new Map(),depth+1,false);converted.transform={m00:1,m01:0,m02:0,m10:0,m11:1,m12:0};variants.push({id:target,node:converted,transitions:transitions(targetNode)});queue.push(...transitions(targetNode).map(t=>t.target));}
  if(variants.length)result.stateMachine={initial:initialId,transitions:initial,variants};
 }
 return result;
}
async function panel(frameId,start,end,{omit=[]}={}){
 const selected=(children.get(frameId)??[]).filter(n=>n.visible!==false&&!omit.includes(id(n.guid))&&(n.transform?.m12??0)>=start&&(n.transform?.m12??0)<end&&!/^(BOTTOM|TOP|Frame 26)$/.test(n.name));
 const output=[];
 for(const node of selected){const converted=await convert(node);converted.transform={...converted.transform,m12:converted.transform.m12-start};output.push(converted);}
 return {width:1728,height:end-start,nodes:output};
}
const pages={};
for(const [slug,frame,processStart,bottom] of [['mercedesbenz','118:985',4468,5193],['spierer-university','135:475',4433,5606],['fjallraven','135:681',4468,5193]]){
 pages[slug]={hero:await panel(frame,2234,3351,{omit:slug==='spierer-university'?['143:429']:[]}),overview:await panel(frame,3351,processStart),process:await panel(frame,processStart,bottom)};
 if(slug==='spierer-university')pages[slug].hero.nodes.push(await convert(byId.get('143:429')));
}
// The Spierer artwork group straddles the original hero boundary.
const spierGroup=pages['spierer-university'].hero.nodes.at(-1);if(spierGroup?.id==='143:429')spierGroup.transform.m12-=2234;
pages.aboutOrigins=await panel('22:158',2234,3350,{omit:['147:1464']});
const cycling=children.get('27:259').filter(n=>n.type==='TEXT').sort((a,b)=>a.transform.m12-b.transform.m12).map(n=>n.textData.characters);
const photoStates=[];
for(const state of ['147:1365','147:1363']){const image=children.get(state)?.[0];if(image)photoStates.push((await paints(image.fillPaints)).find(p=>p.type==='image')?.path);}
const interactions=nodes.filter(n=>n.prototypeInteractions?.some(i=>!i.isDeleted)).map(n=>({id:id(n.guid),name:n.name,events:n.prototypeInteractions.filter(i=>!i.isDeleted).map(i=>({event:i.event,actions:i.actions.map(a=>({target:id(a.transitionNodeID),type:a.transitionType,duration:a.transitionDuration,navigation:a.navigationType}))}))}));
await writeFile('src/content/reference-pages.json',JSON.stringify({pages,cycling,photoStates},null,2));
await writeFile('docs/figma-interactions.json',JSON.stringify(interactions,null,2));
await writeFile('docs/figma-page-assets.json',JSON.stringify([...assets.values()],null,2));
console.log(`Imported project layouts, About origins, ${cycling.length} cycling words and ${assets.size} source images.`);
