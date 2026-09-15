import {add,sub,mul,cross,unit,diskClearance,evaluate,better} from './geometry.mjs';
export const SEARCH={normalMinMm:7.5,normalMaxMm:24,normalStepMm:1.5,axialMinMm:-12,axialMaxMm:12,axialStepMm:3,individualBoundMm:16,refinementStepsMm:[2,.5,.125],fitProjectionGridMm:{normal:.5,along:.25},objective:'lexicographic max angle, sum angle, pitch deviation, seed deviation',globalOptimality:'not claimed'};
export function withinBounds(p,positions){let low=-12,high=12;for(let i=0;i<positions.length;i++){if(!Number.isFinite(positions[i])||positions[i]<0||positions[i]>p.L)return false;low=Math.max(low,positions[i]-p.seed[i]-16);high=Math.min(high,positions[i]-p.seed[i]+16);}return low<=high+1e-9;}
export function zeroPositions(p,offset,branch){const row=add(p.A,mul(p.n,offset));return p.strings.map(({S,B})=>{const u=unit(sub(S,B)),den=cross(p.e,u);return Math.abs(den)<1e-10?NaN:(branch*3-cross(sub(row,S),u))/den;});}
export function solve(p,branch){
 const baseline=evaluate(p,p.seed,12.7,branch);let best=baseline.valid?baseline:null,evaluations=0;
 const consider=(t,h)=>{evaluations++;if(!withinBounds(p,t))return null;const v=evaluate(p,t,h,branch);if(better(v,best))best=v;return v;};
 for(let h=7.5;h<=24+1e-9;h+=1.5){const zero=zeroPositions(p,h,branch);consider(zero,h);for(let shift=-12;shift<=12;shift+=3){const start=p.seed.map(t=>t+shift);consider(start,h);consider(zero.map((t,i)=>Math.max(0,start[i]-16,Math.min(p.L,start[i]+16,t))),h);}}
 // Mahtumiseen projisoitu nollasiemen auttaa ahdasta olkapäätä; koko ja kulma säilyvät.
 if(!best||best.objective[0]>1e-8){
  for(let h=7.5;h<=24;h+=.5){
   const zero=zeroPositions(p,h,branch),fits=[];
   for(let t=0;t<=p.L;t+=.25){const C=add(add(p.A,mul(p.n,h)),mul(p.e,t));if(diskClearance(C,7.25,p.polygon)>=0)fits.push(t);}
   for(let shift=-12;shift<=12;shift+=1){
    const projected=zero.map((z,i)=>{let found=NaN,bestDistance=Infinity;for(const t of fits){if(Math.abs(t-p.seed[i]-shift)>16)continue;const d=Math.abs(t-z);if(d<bestDistance){bestDistance=d;found=t;}}return found;});
    consider(projected,h);
   }
  }
 }
 // Rajattu koordinaattihaku kelvollisesta ehdotuksesta. Muoto ja rivikulma pysyvät.
 if(best)for(const step of SEARCH.refinementStepsMm){for(let round=0;round<4;round++){const before=best;for(const shift of [-step,step])consider(best.positions.map(t=>t+shift),best.offset);for(const pitchDelta of [-step/2,step/2])consider(best.positions.map((t,i)=>t+pitchDelta*(i-(p.N-1)/2)),best.offset);for(const dh of [-step,step])if(best.offset+dh>=7.5&&best.offset+dh<=24)consider(best.positions,best.offset+dh);for(let i=0;i<p.N;i++)for(const sign of [-1,1]){const t=[...best.positions];t[i]+=sign*step;consider(t,best.offset);}if(best===before)break;}}
 return {baseline,solution:best??baseline,status:best?'found':'no-feasible-layout-found',evaluations,search:SEARCH};
}
