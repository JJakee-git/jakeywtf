import {readFile,writeFile} from 'node:fs/promises';
import {inflateRawSync,zstdDecompressSync} from 'node:zlib';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {decodeBinarySchema,compileSchema}=require('../.local/figma-tools/node_modules/kiwi-schema');
const root='original-assets/figma-export/extracted';
const source=await readFile(root+'/canvas.fig');
if(source.subarray(0,8).toString()!=='fig-kiwi')throw Error('Unexpected Figma document header');
const schemaLength=source.readUInt32LE(12);
const schema=decodeBinarySchema(inflateRawSync(source.subarray(16,16+schemaLength)));
const dataStart=20+schemaLength,dataLength=source.readUInt32LE(16+schemaLength);
const compressed=source.subarray(dataStart,dataStart+dataLength);
const data=compressed.readUInt32LE(0)===0xfd2fb528?zstdDecompressSync(compressed):inflateRawSync(compressed);
const document=compileSchema(schema).decodeMessage(data);
const id=guid=>guid?`${guid.sessionID}:${guid.localID}`:null;
const hash=value=>value?Buffer.from(Object.values(value)).toString('hex'):null;
const nodes=document.nodeChanges;
const summary=nodes.map(node=>({
 id:id(node.guid),parent:id(node.parentIndex?.guid),order:node.parentIndex?.position,
 name:node.name,type:node.type,visible:node.visible,opacity:node.opacity,
 size:node.size,transform:node.transform,clipsContent:node.frameMaskDisabled===false,
 images:node.fillPaints?.filter(p=>p.type==='IMAGE').map(p=>({name:p.image?.name,hash:hash(p.image?.hash),thumbnail:hash(p.imageThumbnail?.hash),mode:p.imageScaleMode,opacity:p.opacity,transform:p.transform})),
 text:node.textData?.characters,font:node.fontName,fontSize:node.fontSize,
}));
await writeFile(root+'/layout.json',JSON.stringify(summary,null,2));
await writeFile(root+'/document.json',JSON.stringify(document,(_,v)=>typeof v==='bigint'?String(v):v));
const pages=summary.filter(n=>n.type==='CANVAS'&&n.visible!==false);
const frames=summary.filter(n=>pages.some(p=>p.id===n.parent)&&n.type==='FRAME');
const images=new Map();
for(const node of summary)for(const paint of node.images??[]){if(paint.hash)images.set(paint.hash,{hash:paint.hash,name:paint.name});}
await writeFile('docs/figma-design-map.json',JSON.stringify({pages,frames,imageReferences:[...images.values()]},null,2));
console.log(`Decoded ${nodes.length} layers, ${pages.length} visible pages and ${images.size} original image references.`);
for(const n of summary.filter(n=>n.parent==='1:4'&&n.type==='FRAME'))console.log(`${n.id} ${n.name} (${n.size?.x} × ${n.size?.y})`);
