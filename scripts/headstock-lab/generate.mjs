import fs from 'node:fs';
import {loadInputs,makeScenario,sha,SOURCE} from './scenarios.mjs';
import {solve} from './solver.mjs';
import {denseReference} from './reference.mjs';
import {HARDWARE,GEOMETRY_TOL,evaluate} from './geometry.mjs';
export const RESULT_PATH='reference-analysis/headstock-lab-results.json';
export async function generate(){
 const inputs=await loadInputs(),cases=[];
 for(const N of [6,7,8])for(const spacing of ['fixed-total','fixed-gap'])for(const neck of ['equal','multiscale']){
  const p=makeScenario(inputs,N,spacing,neck),layouts=[];
  for(const branch of [1,-1]){const result=solve(p,branch),reference=denseReference(p,branch);layouts.push({branch,...result,reference});}
  cases.push({...p,layouts});
 }
 const small={...cases[0],id:'infeasible-small',polygon:[{x:0,y:-5},{x:15,y:-5},{x:15,y:5},{x:0,y:5}]};
 const invalid=evaluate(small,small.seed,12.7,1);
 const hashPaths=[SOURCE,'src/neck/fretfactoryGeometry.ts',...fs.readdirSync('src/neck/vendor').filter(p=>p.endsWith('.ts')).map(p=>'src/neck/vendor/'+p)];
 return {schema:'headstock-lab-v1',units:'mm',branchConvention:'T = S + (1-r²/d²)(C-S) + branch*r*sqrt(d²-r²)/d²*perp(C-S); + means counterclockwise mathematical tangent, not verified M6 handedness',hardware:HARDWARE,geometryFlattenToleranceMm:GEOMETRY_TOL,sourceHashes:Object.fromEntries(hashPaths.map(p=>[p,sha(p)])),fullM6FitStatus:'unverified',searchInterpretation:'Best found in bounded straight-row search. Dense reference covers only regular-pitch row subset; no global optimum claimed.',cases,negativeCase:{id:small.id,polygon:small.polygon,result:invalid}};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/generate.mjs')){const data=await generate();fs.writeFileSync(RESULT_PATH,JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data.cases.flatMap(c=>c.layouts.map(l=>({id:c.id,branch:l.branch,status:l.status,maxAngle:l.solution.objective[0],sumAngle:l.solution.objective[1],minPitch:l.solution.minPitchMm,reference:l.reference.best?.objective[0],errors:l.solution.errors}))),null,2));}
