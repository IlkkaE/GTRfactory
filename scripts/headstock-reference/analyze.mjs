// Erillinen referenssikoe. Sovelluksen kaula- ja tallakontaktit pysyvät paikoillaan.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {add,sub,mul,dot,cross,unit,perp,distance,parseOutline,flattenOutline,pathString,evaluate} from '../headstock-lab/geometry.mjs';

export const SOURCE='CDR/headstock-research/seven-string-headstock.svg';
export const OUTPUT='reference-analysis/seven-string-headstock-fit.json';
export const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const numbers=s=>s.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi).map(Number);
export function arcCenter(start,v) {
  const [rx,ry,deg,large,sweep,dx,dy]=v,phi=deg*Math.PI/180,c=Math.cos(phi),s=Math.sin(phi);
  const xp=-c*dx/2-s*dy/2,yp=s*dx/2-c*dy/2;
  const f=(large===sweep?-1:1)*Math.sqrt(Math.max(0,(rx*rx*ry*ry-rx*rx*yp*yp-ry*ry*xp*xp)/(rx*rx*yp*yp+ry*ry*xp*xp)));
  const a=f*rx*yp/ry,b=-f*ry*xp/rx;
  return {x:c*a-s*b+start.x+dx/2,y:s*a+c*b+start.y+dy/2};
}
export function readReference(svg) {
  if(!/width="304mm"/.test(svg)||!/height="122mm"/.test(svg)||!/viewBox="0 0 304 122"/.test(svg)||/\btransform\s*=/.test(svg))throw Error('Unexpected reference scale or transform');
  const tags=svg.match(/<path\b[^>]*\/>/gs);
  if(tags?.length!==8)throw Error('Expected seven holes and one outline');
  const outlineTag=tags.find(s=>s.includes('id="path1797"'));
  const segments=parseOutline(outlineTag),edge=segments.filter(s=>s.kind==='L').sort((a,b)=>distance(b.start,b.end)-distance(a.start,a.end))[0];
  const holes=tags.filter(s=>s!==outlineTag).map(tag=>{
    const d=tag.match(/\bd="([^"]+)"/)[1],v=numbers(d),id=tag.match(/\bid="([^"]+)"/)[1];
    if(!/^m\s/.test(d)||!d.includes(' a ')||v.length!==16)throw Error('Unexpected hole path');
    const C=arcCenter({x:v[0],y:v[1]},v.slice(2,9));
    const C2=arcCenter({x:v[0]+v[7],y:v[1]+v[8]},v.slice(9,16));
    if(distance(C,C2)>1e-9)throw Error('Hole arc centers disagree');
    return {id,C,diametersMm:[2*v[2],2*v[3]]};
  }).sort((a,b)=>a.C.x-b.C.x);
  return {segments,holes,edge,attachment:{start:segments[0].start,end:segments.at(-1).end}};
}
export function normalizeRow(centers,A,e) {
  const n=perp(e),mid=(centers.length-1)/2,t=centers.map(C=>dot(sub(C,A),e));
  const h=centers.reduce((s,C)=>s+dot(sub(C,A),n),0)/centers.length,mean=t.reduce((a,b)=>a+b,0)/t.length;
  const denom=t.reduce((s,_,i)=>s+(i-mid)**2,0),pitch=t.reduce((s,v,i)=>s+(i-mid)*(v-mean),0)/denom;
  const positions=t.map((_,i)=>mean+(i-mid)*pitch),normalized=positions.map(t=>add(add(A,mul(n,h)),mul(e,t)));
  const corrections=normalized.map((C,i)=>({vector:sub(C,centers[i]),distanceMm:distance(C,centers[i])}));
  return {offsetMm:h,pitchMm:pitch,positions,centers:normalized,corrections,maxCorrectionMm:Math.max(...corrections.map(c=>c.distanceMm)),rmsCorrectionMm:Math.sqrt(corrections.reduce((s,c)=>s+c.distanceMm**2,0)/centers.length)};
}
export function zeroPositions(strings,A,e,offset,branch,r=3) {
  const sigma=-branch,base=add(A,mul(perp(e),offset));
  return strings.map(({S,B})=>{
    const u=unit(sub(S,B)),denominator=cross(u,e);
    if(Math.abs(denominator)<1e-10)throw Error('Tuner row is parallel to an ideal string ray');
    return (sigma*r-cross(u,sub(base,S)))/denominator;
  });
}
export async function loadAdapter() {
  const b=await build({entryPoints:['src/neck/fretfactoryGeometry.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
  return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
}
export function makeCase(adapter,reference,nutGap,bridgeGap) {
  const params={...adapter.DEFAULT_NECK,strings:7,stringSpanNut:6*nutGap,stringSpanBridge:6*bridgeGap};
  const snap=adapter.calculateNeck(params,10,16.35),datum=adapter.joinIntersection({...snap,frets:[{n:0,points:snap.nut}]},0);
  const view=p=>({x:datum.y-p.y,y:p.x}),nut=snap.nut.map(view),bridge=snap.bridge.map(view),strings=nut.slice(1,-1).map((S,i)=>({S,B:bridge[i+1]}));
  const source=reference.attachment,sv=sub(source.end,source.start),tv=sub(nut.at(-1),nut[0]);
  const scale=distance(nut[0],nut.at(-1))/distance(source.start,source.end),theta=Math.atan2(tv.y,tv.x)-Math.atan2(sv.y,sv.x);
  const rotate=q=>({x:Math.cos(theta)*q.x-Math.sin(theta)*q.y,y:Math.sin(theta)*q.x+Math.cos(theta)*q.y});
  const transform=p=>add(nut[0],mul(rotate(sub(p,source.start)),scale));
  const segments=reference.segments.map(s=>({kind:s.kind,start:transform(s.start),control:s.control.map(transform),end:transform(s.end)}));
  const A=transform(reference.edge.start),end=transform(reference.edge.end),e=unit(sub(end,A)),n=perp(e),L=distance(A,end);
  const rawCenters=reference.holes.map(h=>transform(h.C)),normalized=normalizeRow(rawCenters,A,e);
  const problem={A,e,n,L,polygon:flattenOutline(segments),strings,seed:normalized.positions},layouts=[];
  for(const branch of [-1,1])for(const mode of ['normalized','straight']) {
    const positions=mode==='normalized'?normalized.positions:zeroPositions(strings,A,e,normalized.offsetMm,branch);
    const r=evaluate(problem,positions,normalized.offsetMm,branch);
    if(positions.some(t=>t<0||t>L)){r.valid=false;r.errors.push('Post center is beyond straight edge endpoints');}
    const pitches=positions.slice(1).map((t,i)=>t-positions[i]);
    const details=r.strings.map((s,i)=>{
      const u=unit(sub(s.S,s.B)),q=sub(s.C,s.S),w=s.T?unit(sub(s.T,s.S)):null;
      return {...s,normalizationShiftMm:normalized.corrections[i].distanceMm,rowShiftMm:positions[i]-normalized.positions[i],tangentLocusResidualMm:cross(u,q)+branch*3,forwardDistanceMm:dot(u,q),signedAngleDeg:w?Math.atan2(cross(u,w),dot(u,w))*180/Math.PI:null};
    });
    layouts.push({...r,mode,strings:details,pitchesMm:pitches,pitchRangeMm:[Math.min(...pitches),Math.max(...pitches)],maxRowShiftMm:Math.max(...details.map(s=>Math.abs(s.rowShiftMm))),maxTangentLocusResidualMm:Math.max(...details.map(s=>Math.abs(s.tangentLocusResidualMm))),equalPitch:mode==='normalized',edgeEndMarginsMm:[positions[0],L-positions.at(-1)]});
  }
  return {id:`7-${nutGap}-${bridgeGap}`,N:7,params,datum,nut,bridge,strings,segments,path:pathString(segments),polygon:problem.polygon,A,e,n,L,rawCenters,normalization:normalized,alignment:{scale,rotationDeg:theta*180/Math.PI,sourceWidthMm:distance(source.start,source.end),targetWidthMm:distance(nut[0],nut.at(-1)),translation:transform({x:0,y:0}),joinPositionErrorMm:Math.max(distance(segments[0].start,nut[0]),distance(segments.at(-1).end,nut.at(-1))),edgeAngleDeg:Math.atan2(e.y,e.x)*180/Math.PI},layouts};
}
export async function generate() {
  const reference=readReference(fs.readFileSync(SOURCE,'utf8')),adapter=await loadAdapter(),cases=[];
  for(const nut of [6.5,7,7.5])for(const bridge of [10,10.5,11])cases.push(makeCase(adapter,reference,nut,bridge));
  const hashPaths=[SOURCE,'src/neck/fretfactoryGeometry.ts','src/neck/vendor/core.ts','src/neck/vendor/curved.ts','src/neck/vendor/pchip.ts','src/neck/vendor/naming.ts'];
  return {schema:'seven-string-reference-fit-v1',units:'mm',sourcePath:SOURCE,sourceHashes:Object.fromEntries(hashPaths.map(p=>[p,sha(p)])),reference,baselineId:'7-7-10.5',displayBranch:1,branchConvention:'evaluate tangent branch; sigma = -branch; one shared branch per layout',hardware:{postRadiusMm:3,boreRadiusMm:5,washerRadiusMm:7.25,fullM6FitStatus:'unverified'},scope:'Fixed edge direction and least-squares normalized edge offset per neck. Straight mode relaxes equal pitch only as a research comparison; no global minimization claim.',cases};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const result=await generate();fs.writeFileSync(OUTPUT,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result.cases.map(c=>({id:c.id,scale:c.alignment.scale,normalizationMaxMm:c.normalization.maxCorrectionMm,layouts:c.layouts.map(r=>({mode:r.mode,branch:r.branch,maxAngleDeg:r.objective[0],maxLocusResidualMm:r.maxTangentLocusResidualMm,pitchRangeMm:r.pitchRangeMm,maxRowShiftMm:r.maxRowShiftMm,valid:r.valid,errors:r.errors}))})),null,2));
}
