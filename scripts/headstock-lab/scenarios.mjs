import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from 'esbuild';
import {add,sub,mul,unit,perp,distance,parseOutline,flattenOutline,pathString,flattenCubic} from './geometry.mjs';
export const SOURCE='CDR/headstock-research/lapamalli.svg';
export const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
async function bundle(entry){const b=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));}
export async function loadInputs(){return {adapter:await bundle('src/neck/fretfactoryGeometry.ts'),pchip:await bundle('src/neck/vendor/pchip.ts'),outline:parseOutline(fs.readFileSync(SOURCE,'utf8'))};}
export function makeScenario(inputs,N,spacing,neck){
 const {adapter,pchip,outline}=inputs,factor=spacing==='fixed-gap'?(N-1)/5:1;
 const params={...adapter.DEFAULT_NECK,strings:N,stringSpanNut:35.814*factor,stringSpanBridge:49.784*factor,...(neck==='multiscale'?{scaleBass:673.1,curvedExponent:1.6}:{})};
 const snapshot=adapter.calculateNeck(params,10,16.35),nutSegments=pchip.pchipToBezierSegments(snapshot.nut);
 // Sama tarkka PCHIP-keskileikkaus kuin adapterissa, nyt satulariville.
 const datum=adapter.joinIntersection({...snapshot,frets:[{n:0,points:snapshot.nut}]},0);
 const display=p=>({x:datum.y-p.y,y:p.x});
 const nut= snapshot.nut.map(display),bridge=snapshot.bridge.map(display),strings=nut.slice(1,-1).map((S,i)=>({S,B:bridge[i+1]}));
 const sourceOrigin=mul(add(outline[0].start,outline.at(-1).end),.5),edge=outline.filter(s=>s.kind==='L').sort((a,b)=>distance(b.start,b.end)-distance(a.start,a.end))[0];
 const L6=distance(edge.start,edge.end),referenceAngle=Math.atan2(edge.end.y-edge.start.y,edge.end.x-edge.start.x),k=(L6+(N-6)*25)/L6,alpha=Math.asin(params.stringSpanNut/((N-1)*25)),rotation=alpha-referenceAngle;
 const transform=p=>{const q=mul(sub(p,sourceOrigin),k);return {x:q.x*Math.cos(rotation)-q.y*Math.sin(rotation),y:q.x*Math.sin(rotation)+q.y*Math.cos(rotation)};};
 const physical=outline.map(s=>({kind:s.kind,start:transform(s.start),control:s.control.map(transform),end:transform(s.end)}));
 const top=nut[0],bottom=nut.at(-1),dirTop=unit(sub(top,bridge[0])),dirBottom=unit(sub(bottom,bridge.at(-1)));
 const first=physical[0],last=physical.at(-1),firstLen=distance(first.start,first.control[0]),lastLen=distance(last.end,last.control.at(-1));
 first.start=top;first.control[0]=add(top,mul(dirTop,firstLen));last.end=bottom;last.control[1]=add(bottom,mul(dirBottom,lastLen));
 const nutCurve=nutSegments.flatMap((s,i)=>flattenCubic(display(s.p0),display(s.c1),display(s.c2),display(s.p1)).slice(i?1:0));
 const polygon=[...flattenOutline(physical),...nutCurve.slice(1,-1).reverse()],A=transform(edge.start),end=transform(edge.end),e=unit(sub(end,A)),n=perp(e),L=distance(A,end),seed=Array.from({length:N},(_,i)=>(L-25*(N-1))/2+25*i);
 return {id:`${N}-${spacing}-${neck}`,N,spacing,neck,params,datum,sourceOrigin,rawContacts:{nut:snapshot.nut,bridge:snapshot.bridge},nut,bridge,nutCurve,strings,segments:physical,path:pathString(physical),originalPath:pathString(outline.map(s=>({kind:s.kind,start:sub(s.start,sourceOrigin),control:s.control.map(p=>sub(p,sourceOrigin)),end:sub(s.end,sourceOrigin)}))),polygon,A,e,n,L,seed,transform:{shapeScale:k,rotationDeltaDeg:rotation*180/Math.PI,edgeAngleDeg:alpha*180/Math.PI,edgeLengthMm:L,referenceEdgeLengthMm:L6},join:{top,bottom,dirTop,dirBottom}};
}
