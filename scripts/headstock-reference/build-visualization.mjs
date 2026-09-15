import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('reference-analysis/seven-string-headstock-fit.json','utf8'));
const c=data.cases.find(c=>c.id===data.baselineId);
const template=fs.readFileSync('scripts/headstock-reference/visualization.fragment.html','utf8');
if(template.split('__SEVEN_STRING_FIT_DATA__').length!==2)throw Error('Missing unique data marker');
const fragment=template.replace('__SEVEN_STRING_FIT_DATA__',JSON.stringify(c).replaceAll('<','\\u003c'));
if(Buffer.byteLength(fragment)>1e6)throw Error('Visualization exceeds 1 MB');
const destination=process.argv[2];if(!destination)throw Error('Provide absolute visualization output path');
fs.writeFileSync(destination,fragment);console.log(JSON.stringify({destination,bytes:Buffer.byteLength(fragment)}));
