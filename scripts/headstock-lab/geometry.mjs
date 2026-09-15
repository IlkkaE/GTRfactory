// Geometriakoe: kaikki koordinaatit millimetreinä. Sin trucos.
export const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
export const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
export const mul=(a,k)=>({x:a.x*k,y:a.y*k});
export const dot=(a,b)=>a.x*b.x+a.y*b.y;
export const cross=(a,b)=>a.x*b.y-a.y*b.x;
export const length=a=>Math.hypot(a.x,a.y);
export const unit=a=>mul(a,1/length(a));
export const perp=a=>({x:-a.y,y:a.x});
export const distance=(a,b)=>length(sub(a,b));
export const GEOMETRY_TOL=0.005;
export const HARDWARE={postRadiusMm:3,boreRadiusMm:5,washerRadiusMm:7.25,fullM6FitStatus:'unverified'};
export function segmentDistance(p,a,b){const d=sub(b,a),n=dot(d,d);return distance(p,add(a,mul(d,n?Math.max(0,Math.min(1,dot(sub(p,a),d)/n)):0)));}
export function inside(p,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if(((a.y>p.y)!==(b.y>p.y))&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
export function diskClearance(c,r,polygon,tolerance=GEOMETRY_TOL){let d=Infinity;for(let i=0;i<polygon.length;i++)d=Math.min(d,segmentDistance(c,polygon[i],polygon[(i+1)%polygon.length]));return (inside(c,polygon)?d:-d)-r-tolerance;}
export function segmentsCross(a,b,c,d){const u=sub(b,a),v=sub(d,c),det=cross(u,v),w=sub(c,a);if(Math.abs(det)<1e-10){if(Math.abs(cross(w,u))>1e-8)return false;const len=dot(u,u);if(!len)return segmentDistance(a,c,d)<1e-8;const lo=dot(w,u)/len,hi=dot(sub(d,a),u)/len;return Math.min(1,Math.max(lo,hi))-Math.max(0,Math.min(lo,hi))>1e-9;}const t=cross(w,v)/det,s=cross(w,u)/det;return t>=-1e-9&&t<=1+1e-9&&s>=-1e-9&&s<=1+1e-9;}
export function tangent(S,C,branch,r=3){const q=sub(C,S),d2=dot(q,q);if(![1,-1].includes(branch)||d2<=r*r)return null;return add(S,add(mul(q,1-r*r/d2),mul(perp(q),branch*r*Math.sqrt(d2-r*r)/d2)));}
export function angleDeg(u,v){return Math.abs(Math.atan2(cross(u,v),dot(u,v)))*180/Math.PI;}
export function flattenCubic(p0,c1,c2,p1,tol=GEOMETRY_TOL){const out=[p0];function recurse(a,b,c,d,depth){if(Math.max(segmentDistance(b,a,d),segmentDistance(c,a,d))<=tol){out.push(d);return;}if(depth>24)throw new Error('Bézier ei supistunut toleranssiin');const ab=mul(add(a,b),.5),bc=mul(add(b,c),.5),cd=mul(add(c,d),.5),abc=mul(add(ab,bc),.5),bcd=mul(add(bc,cd),.5),m=mul(add(abc,bcd),.5);recurse(a,ab,abc,m,depth+1);recurse(m,bcd,cd,d,depth+1);}recurse(p0,c1,c2,p1,0);return out;}
export function parseOutline(source){const d=source.match(/<path\s[^>]*?\bd="([^"]+)"/s)?.[1];if(!d)throw new Error('Templaten polku puuttuu');const t=d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g);let i=0,cmd='',p={x:0,y:0};const segments=[];while(i<t.length){if(/^[a-zA-Z]$/.test(t[i]))cmd=t[i++];const kind=cmd.toUpperCase(),n=kind==='C'?6:['M','L'].includes(kind)?2:0;if(!n)throw new Error('Tuntematon lähdekomento '+cmd);const v=t.slice(i,i+n).map(Number);i+=n;const pts=[];for(let j=0;j<n;j+=2)pts.push({x:v[j]+(cmd===kind?0:p.x),y:v[j+1]+(cmd===kind?0:p.y)});const end=pts.at(-1);if(kind!=='M')segments.push({kind,start:p,control:pts.slice(0,-1),end});p=end;if(kind==='M')cmd=cmd==='M'?'L':'l';}return segments;}
export function flattenOutline(segments){const points=[segments[0].start];for(const s of segments)points.push(...(s.kind==='C'?flattenCubic(s.start,...s.control,s.end).slice(1):[s.end]));return points;}
export function pathString(segments){const p=segments[0].start;return `M ${p.x} ${p.y} `+segments.map(s=>s.kind+' '+[...s.control,s.end].map(q=>q.x+' '+q.y).join(' ')).join(' ');}

export function evaluate(problem,positions,offset,branch){
 const {A,e,n,polygon,strings,seed}=problem,centers=positions.map(t=>add(add(A,mul(n,offset)),mul(e,t))),errors=[];
 if(positions.length!==strings.length||positions.some(t=>!Number.isFinite(t))||!Number.isFinite(offset))return {valid:false,errors:['Ei äärellinen sijoittelu'],strings:[],objective:[Infinity,Infinity,Infinity],positions,offset};
 let minPitch=Infinity,minWasherClearance=Infinity,minBoreClearance=Infinity,minOtherPostClearance=Infinity,maxRadiusResidual=0,maxTangencyResidual=0;
 const results=strings.map(({S,B},i)=>{const C=centers[i],T=tangent(S,C,branch),u=unit(sub(S,B));if(!T){errors.push('Tangenttia ei ole');return {S,B,C,T:null,angleDeg:null};}const v=sub(T,S),r=sub(T,C),theta=angleDeg(u,v);if(dot(u,v)<=0)errors.push('Kieli kulkee taaksepäin');maxRadiusResidual=Math.max(maxRadiusResidual,Math.abs(length(r)-3));maxTangencyResidual=Math.max(maxTangencyResidual,Math.abs(dot(unit(v),r)));const wc=problem.washerClearanceAt?problem.washerClearanceAt(positions[i],offset):diskClearance(C,7.25,polygon),bc=wc+2.25;minWasherClearance=Math.min(minWasherClearance,wc);minBoreClearance=Math.min(minBoreClearance,bc);if(wc<0)errors.push('Aluslevy ylittää lavan reunan');return {index:i,S,B,C,T,angleDeg:theta,washerClearanceMm:wc,boreClearanceMm:bc};});
 for(let i=0;i<centers.length;i++){if(i&&positions[i]<=positions[i-1])errors.push('Virittimien järjestys vaihtuu');for(let j=i+1;j<centers.length;j++){const pitch=distance(centers[i],centers[j]);minPitch=Math.min(minPitch,pitch);if(pitch<14.5+GEOMETRY_TOL)errors.push('Aluslevyt osuvat toisiinsa');if(results[i].T&&results[j].T&&segmentsCross(strings[i].S,results[i].T,strings[j].S,results[j].T))errors.push('Kielet risteävät');}if(results[i].T)for(let j=0;j<centers.length;j++){if(i===j)continue;const clearance=segmentDistance(centers[j],strings[i].S,results[i].T)-3;minOtherPostClearance=Math.min(minOtherPostClearance,clearance);if(clearance<GEOMETRY_TOL)errors.push('Kieli osuu toiseen pylvääseen');}}
 const angles=results.map(s=>s.angleDeg??Infinity),pitchDeviation=positions.slice(1).reduce((sum,t,i)=>sum+Math.abs(t-positions[i]-25),0),seedDeviation=positions.reduce((sum,t,i)=>sum+Math.abs(t-seed[i]),0)+Math.abs(offset-12.7);
 return {valid:errors.length===0,errors:[...new Set(errors)],branch,positions,offset,strings:results,objective:[Math.max(...angles),angles.reduce((a,b)=>a+b,0),pitchDeviation,seedDeviation],minPitchMm:minPitch,minWasherClearanceMm:minWasherClearance,minBoreClearanceMm:minBoreClearance,minOtherPostClearanceMm:minOtherPostClearance,maxRadiusResidualMm:maxRadiusResidual,maxTangencyResidualMm:maxTangencyResidual,fullM6FitStatus:'unverified'};
}
export function better(a,b){if(!a?.valid)return false;if(!b?.valid)return true;for(let i=0;i<a.objective.length;i++){const eps=i<2?1e-8:1e-7;if(a.objective[i]<b.objective[i]-eps)return true;if(a.objective[i]>b.objective[i]+eps)return false;}return false;}
