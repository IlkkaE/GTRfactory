// Nimellinen 2D-koneistosovitus valmistajan mittapiirustusten perusteella.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {add,sub,mul,distance,segmentDistance,segmentsCross,inside,diskClearance} from '../headstock-lab/geometry.mjs';
const sevenData=JSON.parse(fs.readFileSync('reference-analysis/seven-string-headstock-fit.json','utf8'));
const eightData=JSON.parse(fs.readFileSync('reference-analysis/eight-string-headstock-rule.json','utf8'));
const seven=sevenData.cases.find(c=>c.id==='7-7-10.5');
const eight=eightData.cases.find(c=>c.id==='8-7-10.5-anchored-bass-post');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rect=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
const drawingSources={mini:'CDR/headstock-research/schaller-m6-mini.pdf',button:'CDR/headstock-research/schaller-m6-small-button.pdf',handedness:'CDR/headstock-research/schaller-handedness.pdf'};
const profile={
  name:'Schaller M6 Mini PK1004 / Small Button 1101XX00',
  method:'Conservative 2D projection envelopes, standard metal small button. Not a manufacturing tolerance model.',
  nominalBodyWidthMm:22.7,
  bodyEnvelope:rect(-10.8,-7.3,12.0,7.3),
  shaftEnvelope:rect(2.4,-16.4,11.1,-6.7),
  screwCenter:{x:-8.1,y:4.1},screwLugEnvelopeRadiusMm:2.7,
  buttonAxisAlongRowMm:6.75,
  buttonNominalWidthMm:18.5,buttonNominalThicknessMm:7.2,
  buttonSweepHalfWidthMm:Math.hypot(18.5,7.2)/2,
  buttonNormalRangeMm:[-32.1,-16.3],
  boreRadiusMm:5,washerRadiusMm:7.25,
  note:'Body envelope includes mounting lug. Shaft is permitted to cross the wood outline in projection. Rotating button envelope must remain outside. Body and washer must remain inside. Finger clearance is measured, not assigned an unsupported acceptance threshold.'
};
profile.buttonSweepEnvelope=rect(profile.buttonAxisAlongRowMm-profile.buttonSweepHalfWidthMm,profile.buttonNormalRangeMm[0],profile.buttonAxisAlongRowMm+profile.buttonSweepHalfWidthMm,profile.buttonNormalRangeMm[1]);
function boundaryDistance(a,b){let d=Infinity;for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
  const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length];
  if(segmentsCross(p,q,r,s))return 0;
  d=Math.min(d,segmentDistance(p,r,s),segmentDistance(q,r,s),segmentDistance(r,p,q),segmentDistance(s,p,q));
}return d;}
function overlaps(a,b){return a.some(p=>inside(p,b))||b.some(p=>inside(p,a))||boundaryDistance(a,b)<1e-10;}
function insideClearance(footprint,wood){if(!footprint.every(p=>inside(p,wood)))return -1;return boundaryDistance(footprint,wood);}
function outsideClearance(footprint,wood){return overlaps(footprint,wood)?-1:boundaryDistance(footprint,wood);}
function pairDistance(a,b){return overlaps(a,b)?-1:boundaryDistance(a,b);}
function run(c,mirror){
  const layout=c.layouts.find(r=>r.branch===1&&(c.N===8||r.mode==='normalized'));
  const transform=(C,p)=>add(C,add(mul(c.e,mirror*p.x),mul(c.n,p.y)));
  const units=layout.strings.map((s,i)=>{
    const C=s.C,body=profile.bodyEnvelope.map(p=>transform(C,p)),shaft=profile.shaftEnvelope.map(p=>transform(C,p)),button=profile.buttonSweepEnvelope.map(p=>transform(C,p)),screw=transform(C,profile.screwCenter);
    return {index:i,C,body,shaft,button,screw,bodyWoodClearanceMm:insideClearance(body,c.polygon),buttonWoodClearanceMm:outsideClearance(button,c.polygon),screwCenterWoodDistanceMm:diskClearance(screw,0,c.polygon,0),screwLugWoodClearanceMm:diskClearance(screw,profile.screwLugEnvelopeRadiusMm,c.polygon,0),washerWoodClearanceMm:diskClearance(C,profile.washerRadiusMm,c.polygon,0),boreWoodClearanceMm:diskClearance(C,profile.boreRadiusMm,c.polygon,0)};
  });
  const min={bodyToBodyMm:Infinity,buttonToButtonMm:Infinity,assemblyToAssemblyMm:Infinity};
  for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){
    min.bodyToBodyMm=Math.min(min.bodyToBodyMm,pairDistance(units[i].body,units[j].body));
    min.buttonToButtonMm=Math.min(min.buttonToButtonMm,pairDistance(units[i].button,units[j].button));
    for(const a of [units[i].body,units[i].shaft,units[i].button])for(const b of [units[j].body,units[j].shaft,units[j].button])min.assemblyToAssemblyMm=Math.min(min.assemblyToAssemblyMm,pairDistance(a,b));
  }
  for(const key of ['bodyWoodClearanceMm','buttonWoodClearanceMm','screwCenterWoodDistanceMm','screwLugWoodClearanceMm','washerWoodClearanceMm','boreWoodClearanceMm'])min[key]=Math.min(...units.map(u=>u[key]));
  const valid=Object.values(min).every(v=>v>0);
  const pitch=distance(units[0].C,units[1].C);
  assert.ok(Math.abs(min.bodyToBodyMm-(pitch-22.8))<1e-8);
  assert.ok(Math.abs(min.buttonToButtonMm-(pitch-2*profile.buttonSweepHalfWidthMm))<1e-8);
  return {N:c.N,mirror,valid,min,pitchMm:pitch,nominalBodyGapMm:pitch-22.7,units,outline:c.polygon};
}
const cases=[run(seven,1),run(eight,1),run(seven,-1),run(eight,-1)];
// Synthetic negative controls must not pass.
assert.ok(overlaps(rect(0,0,2,2),rect(1,1,3,3)));
assert.equal(pairDistance(rect(0,0,2,2),rect(1,1,3,3)),-1);
assert.equal(insideClearance(rect(-1,0,1,1),rect(0,0,4,4)),-1);
assert.equal(outsideClearance(rect(1,1,2,2),rect(0,0,4,4)),-1);
const out={schema:'m6-mini-plan-fit-v1',units:'mm',profile,sourceHashes:Object.fromEntries(Object.values(drawingSources).map(p=>[p,sha(p)])),sourceInputHashes:Object.fromEntries(['reference-analysis/seven-string-headstock-fit.json','reference-analysis/eight-string-headstock-rule.json'].map(p=>[p,sha(p)])),cases};
fs.writeFileSync('reference-analysis/m6-mini-fit.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({profile,results:cases.map(({units,outline,...r})=>r)},null,2));
