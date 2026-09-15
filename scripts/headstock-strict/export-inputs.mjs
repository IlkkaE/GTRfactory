// Erillinen yhteensopivuuskoe. Sovellusgeometria pysyy ennallaan. Sin trucos.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { build } from 'esbuild';

const entry='src/neck/fretfactoryGeometry.ts';
const bundled=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const adapter=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const cases=[];
function add(id,N,nut,bridge,neck,group){
  const params={...adapter.DEFAULT_NECK,strings:N,stringSpanNut:nut*(N-1),stringSpanBridge:bridge*(N-1),
    ...(neck==='multiscale'?{scaleBass:673.1,curvedExponent:1.6}:{})};
  const snap=adapter.calculateNeck(params,10,16.35);
  // Rigid transform: headstock +x, transverse +y; origin at central nut datum.
  const datum=adapter.joinIntersection({...snap,frets:[{n:0,points:snap.nut}]},0);
  const view=p=>({x:datum.y-p.y,y:p.x});
  const strings=snap.nut.slice(1,-1).map((S,i)=>({S:view(S),B:view(snap.bridge[i+1])}));
  if(strings.length!==N||snap.nut.length!==N+2||snap.bridge.length!==N+2)throw Error('Contact count');
  cases.push({id,N,group,neck,params,datum,strings,nutAdjacentMm:nut,bridgeAdjacentMm:bridge});
}
add('6-current-default',6,adapter.DEFAULT_NECK.stringSpanNut/5,adapter.DEFAULT_NECK.stringSpanBridge/5,'equal','current-default');
for(const neck of ['equal','multiscale']){
  add(`6-reference-${neck}`,6,7,10.5,neck,'reference');
  for(const N of [7,8])for(const nut of [6.5,7,7.5])for(const bridge of [10,10.5,11]){
    add(`${N}-${nut}-${bridge}-${neck}`,N,nut,bridge,neck,nut===7&&bridge===10.5?'reference':'boundary-grid');
  }
}
// Positive controls use parallel strings only. They are not proposed guitar presets.
for(const N of [6,7,8])cases.push({id:`oracle-parallel-${N}`,N,group:'positive-control',neck:'synthetic',
  strings:Array.from({length:N},(_,i)=>({S:{x:0,y:7*i},B:{x:-600,y:7*i}}))});
cases.push({id:'oracle-uneven-parallel',N:6,group:'negative-control',neck:'synthetic',strings:[0,7,14.25,21,28,35].map(y=>({S:{x:0,y},B:{x:-600,y}}))});
const files=[entry,'src/neck/vendor/core.ts','src/neck/vendor/curved.ts','src/neck/vendor/pchip.ts','src/neck/vendor/naming.ts'];
const sourceHashes=Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const input={version:1,units:'mm',postRadiusMm:3,washerRadiusMm:7.25,wireModel:'zero-thickness 2D centerline; no windings',
  coordinateSystem:'headstock-positive-x-transverse-y',index:'bass to treble, unchanged',sourceHashes,cases};
fs.mkdirSync('reference-analysis',{recursive:true});
fs.writeFileSync('reference-analysis/headstock-strict-inputs.json',JSON.stringify(input,null,2)+'\n');
console.log(`Exported ${cases.length} cases (39 actual-neck, 3 positive controls, 1 negative control).`);
