import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const extracted='original-assets/figma-export/extracted';
const document=JSON.parse(await readFile(extracted+'/document.json','utf8'));
const inventory=JSON.parse((await readFile(extracted+'/inventory.json','utf8')).replace(/^\uFEFF/,''));
const id=g=>g?`${g.sessionID}:${g.localID}`:null;
const hash=v=>v?Buffer.from(Object.values(v)).toString('hex'):null;
const nodes=document.nodeChanges;
const byId=new Map(nodes.map(n=>[id(n.guid),n]));
const children=new Map();
for(const node of nodes){const parent=id(node.parentIndex?.guid);if(!children.has(parent))children.set(parent,[]);children.get(parent).push(node);}
for(const list of children.values())list.sort((a,b)=>(a.parentIndex?.position??'')<(b.parentIndex?.position??'')?-1:1);
const assets=new Map();
await mkdir('public/assets/gallery',{recursive:true});
async function convert(node){
 const fills=[];
 for(const paint of node.fillPaints??[]){
  if(paint.visible===false)continue;
  if(paint.type==='IMAGE'){
   const imageHash=hash(paint.image?.hash),source=inventory.find(asset=>asset.id===imageHash);
   if(!source)throw Error('Missing Figma image: '+imageHash);
   const name=(paint.image.name||'artwork').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
   const path=`assets/gallery/${name}-${imageHash.slice(0,8)}.${source.format}`;
   if(!assets.has(imageHash)){await copyFile(extracted+'/'+source.file,'public/'+path);assets.set(imageHash,{source:source.file,path,name:paint.image.name});}
   fills.push({type:'image',path,opacity:paint.opacity??1,fit:paint.imageScaleMode==='FIT'?'contain':paint.imageScaleMode==='STRETCH'?'fill':'cover'});
  }else if(paint.type==='SOLID')fills.push({type:'solid',color:paint.color,opacity:paint.opacity??1});
 }
 const output={id:id(node.guid),name:node.name,type:node.type,size:node.size??node.derivedTextData?.layoutSize,transform:node.transform,opacity:node.opacity??1,clip:node.frameMaskDisabled===false,fills};
 if(node.type==='TEXT')Object.assign(output,{text:node.textData?.characters??node.name,font:node.fontName,fontSize:node.fontSize,align:node.textAlignHorizontal?.toLowerCase()??'left'});
 const shadow=node.effects?.find(e=>e.type==='DROP_SHADOW'&&e.visible!==false);
 if(shadow)output.shadow={x:shadow.offset.x,y:shadow.offset.y,blur:shadow.radius,color:shadow.color};
 output.children=[];
 for(const child of children.get(output.id)??[])if(child.visible!==false)output.children.push(await convert(child));
 return output;
}
const root=await convert(byId.get('114:717'));
// The Figma canvas translation in its original 1632px viewing window defines the starting camera.
const scene={sourceFrame:'27:638',canvasFrame:root.id,width:root.size.x,height:root.size.y,referenceViewportWidth:1632,centerX:1632/2-root.transform.m02,centerY:-root.transform.m12,root};
await writeFile('src/content/gallery-scene.json',JSON.stringify(scene,null,2));
await writeFile('docs/figma-gallery-assets.json',JSON.stringify([...assets.values()],null,2));
const projects=JSON.parse((await readFile('src/content/projects.json','utf8')).replace(/^\uFEFF/,''));
// Project content owns frame/plaque associations; preserve every mapping on reimport.
for(const project of projects){
 project.sceneNode??=project.sceneNodes?.[0];
 const node=byId.get(project.sceneNode);
 if(node)project.position={x:node.transform.m02,y:node.transform.m12,width:node.size.x};
}
await writeFile('src/content/projects.json',JSON.stringify(projects,null,2)+'\n');
console.log(`Imported the original ${scene.width} × ${scene.height} gallery with ${assets.size} image assets.`);
