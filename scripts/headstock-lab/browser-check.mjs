import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
// Anna skillin render.py:n luoma väliaikainen iframe-kääre, ei sovelluksen URL:ia.
const layoutOnly=process.argv.includes('--layout-only');const wrapper=process.argv[2];if(!wrapper)throw new Error('Anna renderöity testikääre');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(wrapper));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
try {for(const width of [736,390])for(const theme of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height:950},colorScheme:theme,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(url);const frame=page.frameLocator('iframe'),root=frame.locator('#headstock-straightness-lab');await root.locator('svg circle').first().waitFor();
 let scenarios=0;
 for(const N of (layoutOnly?[]:[6,7,8]))for(const spacing of ['fixed-total','fixed-gap'])for(const neck of ['equal','multiscale'])for(const branch of ['1','-1']){
  for(const [key,value] of Object.entries({strings:String(N),spacing,neck,branch}))await root.locator('[data-control="'+key+'"]').selectOption(value);
  assert.equal(await root.locator('[data-control="selected"] option').count(),N);
  await root.locator('[data-control="selected"]').selectOption({value:String(N-1)});assert.match(await root.locator('[data-metrics]').innerText(),new RegExp('Valittu kieli '+N));assert.match(await root.locator('[data-status]').innerText(),/läpäisty/);
  assert.equal(await root.locator('svg circle').count(),N*4+1);
  await root.locator('[data-control="layout"]').selectOption('baseline');assert.ok((await root.locator('[data-metrics]').innerText()).includes('°'));
  await root.locator('[data-control="layout"]').selectOption('solution');scenarios++;
 }
 await root.locator('[data-control="neck"]').selectOption('invalid');assert.match(await root.locator('[data-error]').innerText(),/lavan reunan/);assert.ok(await root.locator('[data-control="strings"]').isDisabled());
 await root.locator('[data-control="neck"]').selectOption('equal');assert.equal(await root.locator('[data-control="strings"]').isDisabled(),false);
 await root.locator('[data-control="strings"]').selectOption('6');await root.locator('[data-control="spacing"]').selectOption('fixed-total');await root.locator('[data-control="branch"]').selectOption('1');await root.locator('[data-control="selected"]').selectOption('0');
 await page.waitForTimeout(100);
 const measurements=await root.evaluate(el=>{const r=el.getBoundingClientRect(),s=el.querySelector('svg').getBoundingClientRect(),controls=[...el.querySelectorAll('select')].map(c=>c.getBoundingClientRect());return {width:r.width,documentWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,svgWidth:s.width,overflowingControls:controls.filter(c=>c.left<r.left-1||c.right>r.right+1).length,textFontSizes:[...el.querySelectorAll('svg text')].map(c=>getComputedStyle(c).fontSize)};});
 assert.ok(measurements.scrollWidth<=measurements.documentWidth+1,JSON.stringify(measurements));assert.equal(measurements.overflowingControls,0);assert.ok(measurements.textFontSizes.every(s=>parseFloat(s)>=11));assert.deepEqual(errors,[]);
 const screenshot=`tmp/headstock-lab-${layoutOnly?'layout-':''}${width}-${theme}.png`;await page.screenshot({path:screenshot,fullPage:true});results.push({width,theme,scenarios,invalidCase:'PASS',errors,measurements,screenshot});await page.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
fs.writeFileSync(layoutOnly?'tmp/headstock-lab-browser-layout-results.json':'tmp/headstock-lab-browser-results.json',JSON.stringify({url,browser:'local Edge',physicalDevice:false,results},null,2)+'\n');console.log(JSON.stringify(results,null,2));
