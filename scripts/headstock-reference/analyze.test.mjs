import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readReference,normalizeRow,zeroPositions,generate,SOURCE,OUTPUT,sha} from './analyze.mjs';
const data=JSON.parse(fs.readFileSync(OUTPUT,'utf8'));
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
const hypot=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

test('Lähdeskaala, seitsemän reikää ja kaulaliitos ovat yksiselitteisiä',()=>{
  const r=readReference(fs.readFileSync(SOURCE,'utf8'));
  assert.equal(r.holes.length,7);near(hypot(r.attachment.start,r.attachment.end),47.90295682383851);
  for(const h of r.holes){near(h.diametersMm[0],9.9553886);near(h.diametersMm[1],10.1388332);}
  assert.throws(()=>readReference(fs.readFileSync(SOURCE,'utf8').replace('304mm','304px')),/scale/);
});
test('Kohdistus säilyttää 9 kaulan kontaktit ja osuu molempiin lautareunoihin',()=>{
  const strict=JSON.parse(fs.readFileSync('reference-analysis/headstock-strict-inputs.json','utf8'));
  assert.equal(data.cases.length,9);
  for(const c of data.cases){
    const old=strict.cases.find(s=>s.id===`${c.id}-equal`);assert.deepEqual(c.strings,old.strings);
    assert.ok(c.alignment.joinPositionErrorMm<1e-9);
    near(c.alignment.targetWidthMm,c.params.stringSpanNut+2*c.params.overhang);
    for(const r of c.layouts)for(const [i,s] of r.strings.entries()){assert.deepEqual(s.S,c.strings[i].S);assert.deepEqual(s.B,c.strings[i].B);}
  }
});
test('Normalisointi on tasajakoinen, reunan suuntainen ja pienimmän neliösumman ratkaisu',()=>{
  for(const c of data.cases){
    const norm=c.normalization;
    let tangentSum=0,normalSum=0,indexWeightedSum=0;
    for(let i=0;i<7;i++){
      const C=norm.centers[i],q={x:C.x-c.A.x,y:C.y-c.A.y};
      near(q.x*c.n.x+q.y*c.n.y,norm.offsetMm);
      if(i)near(hypot(C,norm.centers[i-1]),norm.pitchMm);
      const d={x:C.x-c.rawCenters[i].x,y:C.y-c.rawCenters[i].y},dt=d.x*c.e.x+d.y*c.e.y;
      tangentSum+=dt;normalSum+=d.x*c.n.x+d.y*c.n.y;indexWeightedSum+=(i-3)*dt;
    }
    near(tangentSum,0);near(normalSum,0);near(indexWeightedSum,0);
    const again=normalizeRow(norm.centers,c.A,c.e);assert.ok(again.maxCorrectionMm<1e-10);
  }
});
test('Kaikki 36 tangenttisijoittelua: riippumaton tangentti-, kulma- ja suuntatarkistus',()=>{
  let count=0;
  for(const c of data.cases)for(const r of c.layouts){count++;
    for(const s of r.strings){
      const dx=s.S.x-s.B.x,dy=s.S.y-s.B.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
      const vx=s.T.x-s.S.x,vy=s.T.y-s.S.y,V=Math.hypot(vx,vy),wx=vx/V,wy=vy/V;
      const rx=s.T.x-s.C.x,ry=s.T.y-s.C.y;
      near(Math.hypot(rx,ry),3);near(wx*rx+wy*ry,0);
      near(wx*(s.C.y-s.S.y)-wy*(s.C.x-s.S.x),-r.branch*3);
      assert.ok(ux*vx+uy*vy>0);
      const angle=Math.atan2(ux*wy-uy*wx,ux*wx+uy*wy)*180/Math.PI;
      near(angle,s.signedAngleDeg);near(Math.abs(angle),s.angleDeg);
      if(r.mode==='straight'){
        const foot={x:s.S.x+ux*s.forwardDistanceMm,y:s.S.y+uy*s.forwardDistanceMm};
        assert.ok(hypot(foot,s.T)<1e-9);assert.ok(Math.abs(angle)<1e-9);assert.ok(Math.abs(s.tangentLocusResidualMm)<1e-9);
      }
    }
  }assert.equal(count,36);
});
test('Kolme vastapuolen törmäystä hylätään; esitetyn haaran kaikki yhdeksän tapausta läpäisevät osatarkistukset',()=>{
  const bad=data.cases.flatMap(c=>c.layouts.filter(r=>!r.valid).map(r=>({id:c.id,mode:r.mode,branch:r.branch,errors:r.errors})));
  assert.deepEqual(bad.map(r=>r.id),['7-6.5-10','7-6.5-10.5','7-6.5-11']);
  for(const r of bad){assert.equal(r.mode,'straight');assert.equal(r.branch,-1);assert.deepEqual(r.errors,['Kieli osuu toiseen pylvääseen']);}
  for(const c of data.cases)for(const r of c.layouts.filter(r=>r.branch===1)){
    assert.equal(r.valid,true);assert.ok(r.minPitchMm>=14.505);assert.ok(r.minWasherClearanceMm>=0);assert.ok(r.minOtherPostClearanceMm>=.005);
    assert.equal(r.fullM6FitStatus,'unverified');
  }
});
test('Rinnakkainen viritinrivi ei tuota keinotekoista nollaratkaisua',()=>{
  assert.throws(()=>zeroPositions([{S:{x:0,y:0},B:{x:-600,y:0}}],{x:0,y:10},{x:1,y:0},10,1),/parallel/);
});
test('Uudelleenlaskenta ja lähdehashit: sama tulos, sovelluksen 56 tiedostoa ennallaan',async()=>{
  for(const [p,h] of Object.entries(data.sourceHashes))assert.equal(sha(p),h,p);
  assert.deepEqual(await generate(),data);
  const baseline=JSON.parse(fs.readFileSync('reference-analysis/headstock-strict-app-baseline.json','utf8').replace(/^\uFEFF/,''));
  assert.equal(Object.keys(baseline).length,56);for(const [p,h] of Object.entries(baseline))assert.equal(sha(p),h,p);
});
