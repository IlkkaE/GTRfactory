import {add,mul,diskClearance,evaluate,better} from './geometry.mjs';
// Riippumaton tasajakoinen ruudukko: ei solverin siemeniä, nollakaavaa tai tarkennusta.
export const REFERENCE={class:'regular-row subset only',normalRangeMm:[7.5,24],normalStepMm:.5,pitchRangeMm:[21,29],pitchStepMm:.5,firstPositionStepMm:1,individualBoundMm:16,axialBoundMm:12};
export function denseReference(p,branch){let best=null,count=0;
 const cache=new Map(),problem={...p,washerClearanceAt(t,h){const key=t+','+h;if(!cache.has(key))cache.set(key,diskClearance(add(add(p.A,mul(p.n,h)),mul(p.e,t)),7.25,p.polygon));return cache.get(key);}};
 for(let h=7.5;h<=24;h+=.5)for(let pitch=21;pitch<=29;pitch+=.5)for(let first=0;first+(p.N-1)*pitch<=p.L;first++){
  const positions=Array.from({length:p.N},(_,i)=>first+i*pitch);let low=-12,high=12;
  for(let i=0;i<p.N;i++){low=Math.max(low,positions[i]-p.seed[i]-16);high=Math.min(high,positions[i]-p.seed[i]+16);}if(low>high)continue;
  const result=evaluate(problem,positions,h,branch);count++;if(better(result,best))best=result;
 }
 return {best,evaluations:count,search:REFERENCE};
}
