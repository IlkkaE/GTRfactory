// Seitsemänkielisestä johdettu tasajakoinen kahdeksankielinen tutkimusmalli.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadAdapter,sha} from './analyze.mjs';
import {add,sub,mul,unit,perp,distance,flattenOutline,pathString,evaluate} from '../headstock-lab/geometry.mjs';
const input=JSON.parse(fs.readFileSync('reference-analysis/seven-string-headstock-fit.json','utf8'));
for(const [path,hash] of Object.entries(input.sourceHashes))assert.equal(sha(path),hash,path);
const ref=input.cases.find(c=>c.id===input.baselineId),adapter=await loadAdapter();
const p=ref.normalization.pitchMm,h=ref.normalization.offsetMm,m0=ref.normalization.positions[0],m1=ref.L-ref.normalization.positions.at(-1);
const cases=[];
for(const s of [6.5,7,7.5])for(const b of [10,10.5,11]) {
  const params={...ref.params,strings:8,stringSpanNut:7*s,stringSpanBridge:7*b};
  const snap=adapter.calculateNeck(params,10,16.35),datum=adapter.joinIntersection({...snap,frets:[{n:0,points:snap.nut}]},0);
  const view=q=>({x:datum.y-q.y,y:q.x}),nut=snap.nut.map(view),bridge=snap.bridge.map(view),strings=nut.slice(1,-1).map((S,i)=>({S,B:bridge[i+1]}));
  const L=m0+m1+7*p,k=L/ref.L;
  for(const mode of ['uniform-origin','anchored-bass-post']) {
    const q0=add(add(mul(ref.A,k),mul(ref.n,h)),mul(ref.e,m0));
    const desired=add(ref.normalization.centers[0],sub(strings[0].S,ref.strings[0].S));
    const shift=mode==='anchored-bass-post'?sub(desired,q0):{x:0,y:0};
    const transform=q=>add(mul(q,k),shift);
    const segments=ref.segments.map(seg=>({kind:seg.kind,start:transform(seg.start),end:transform(seg.end),control:seg.control.map(transform)}));
    const first=segments[0],last=segments.at(-1),firstLen=distance(first.start,first.control[0]),lastLen=distance(last.end,last.control.at(-1));
    first.start=nut[0];first.control[0]=add(nut[0],mul(unit(sub(nut[0],bridge[0])),firstLen));
    last.end=nut.at(-1);last.control[1]=add(nut.at(-1),mul(unit(sub(nut.at(-1),bridge.at(-1))),lastLen));
    const A=transform(ref.A),positions=Array.from({length:8},(_,i)=>m0+i*p),polygon=flattenOutline(segments),problem={A,e:ref.e,n:ref.n,L,polygon,strings,seed:positions};
    const layouts=[1,-1].map(branch=>evaluate(problem,positions,h,branch));
    for(const r of layouts){
      assert.equal(r.strings.length,8);assert.ok(r.strings.every(q=>Number.isFinite(q.angleDeg)));
      for(let i=1;i<8;i++)assert.ok(Math.abs(distance(r.strings[i].C,r.strings[i-1].C)-p)<1e-9);
      for(const q of r.strings){const v=sub(q.C,A);assert.ok(Math.abs(v.x*ref.n.x+v.y*ref.n.y-h)<1e-9);}
    }
    assert.ok(distance(first.start,nut[0])<1e-9&&distance(last.end,nut.at(-1))<1e-9);
    assert.ok(Math.abs(L-positions.at(-1)-m1)<1e-9);
    cases.push({id:`8-${s}-${b}-${mode}`,N:8,s,b,mode,params,datum,nut,bridge,strings,A,e:ref.e,n:ref.n,L,p,h,m0,m1,scale:k,translation:shift,segments,path:pathString(segments),polygon,layouts});
  }
}
const strict=JSON.parse(fs.readFileSync('reference-analysis/headstock-strict-inputs.json','utf8'));
for(const c of cases)assert.deepEqual(c.strings,strict.cases.find(s=>s.id===`8-${c.s}-${c.b}-equal`).strings);
const baseline=JSON.parse(fs.readFileSync('reference-analysis/headstock-strict-app-baseline.json','utf8').replace(/^\uFEFF/,''));
for(const [path,hash] of Object.entries(baseline))assert.equal(sha(path),hash,path);
const output={schema:'eight-string-equal-pitch-rule-v1',units:'mm',sourceHashes:input.sourceHashes,referenceId:ref.id,referenceFileHash:sha('reference-analysis/seven-string-headstock-fit.json'),rule:{pitchMm:p,edgeOffsetMm:h,startMarginMm:m0,endMarginMm:m1,referenceEdgeLengthMm:ref.L,edgeAngleDeg:Math.atan2(ref.e.y,ref.e.x)*180/Math.PI,referenceNutGapMm:7,nutEdgeAllowanceMm:ref.params.overhang,postRadiusMm:3,boreRadiusMm:5,washerRadiusMm:7.25,fullM6FitStatus:'unverified'},cases};
fs.writeFileSync('reference-analysis/eight-string-headstock-rule.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({assertions:'PASS: 8 strings, constant pitch/edge offset/end margin, both joins, original contacts, 56 app-file hashes',layouts:cases.length*2,results:cases.map(c=>({id:c.id,scale:c.scale,L:c.L,layouts:c.layouts.map(r=>({branch:r.branch,maxAngleDeg:r.objective[0],valid:r.valid,errors:r.errors}))}))},null,2));
