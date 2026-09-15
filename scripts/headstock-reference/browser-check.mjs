import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
const wrapper=process.argv[2];if(!wrapper)throw Error('Provide rendered preview wrapper');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(wrapper));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
try {
  for(const width of [736,320])for(const theme of ['light','dark']){
    const page=await browser.newPage({viewport:{width,height:1000},colorScheme:theme,deviceScaleFactor:1}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(url);const root=page.frameLocator('iframe').locator('#seven-string-headstock-fit');
    await root.locator('[data-detail] circle').first().waitFor();let states=0;
    for(const branch of ['1','-1'])for(const mode of ['normalized','straight']){
      await root.locator('[data-branch]').selectOption(branch);await root.locator('[data-mode]').selectOption(mode);
      for(let i=0;i<7;i++){
        await root.locator('[data-string]').selectOption({value:String(i)});
        await expect(root.locator('[data-selected]')).toContainText(`Kieli ${i+1}:`);
        await expect(root.locator('[data-metrics]')).toContainText(mode==='straight'?'0,000°':branch==='1'?'1,335°':'9,519°');
        const text=await root.locator('[data-metrics]').innerText();
        assert.ok(text.includes(mode==='straight'?'0,000°':branch==='1'?'1,335°':'9,519°'),text);states++;
      }
    }
    await root.locator('[data-branch]').selectOption('1');await root.locator('[data-mode]').selectOption('normalized');await page.waitForTimeout(60);
    const measurements=await root.evaluate(el=>{
      const box=el.getBoundingClientRect(),rects=[...el.querySelectorAll('select')].map(c=>c.getBoundingClientRect());
      const labelOverflow=[...el.querySelectorAll('svg')].flatMap(svg=>{
        const b=svg.getBoundingClientRect();return [...svg.querySelectorAll('text')].filter(t=>{const r=t.getBoundingClientRect();return r.left<b.left-1||r.right>b.right+1||r.top<b.top-1||r.bottom>b.bottom+1;}).map(t=>t.textContent);
      });
      return {rootWidth:box.width,viewportWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,controlOverflow:rects.filter(r=>r.left<box.left-1||r.right>box.right+1).length,labelOverflow,fontSizes:[...el.querySelectorAll('svg text')].map(t=>parseFloat(getComputedStyle(t).fontSize))};
    });
    assert.equal(measurements.controlOverflow,0);assert.deepEqual(measurements.labelOverflow,[]);assert.ok(measurements.fontSizes.every(n=>n>=11));assert.ok(measurements.scrollWidth<=measurements.viewportWidth+1);assert.deepEqual(errors,[]);
    const screenshot=`tmp/seven-string-fit-${width}-${theme}.png`;await page.screenshot({path:screenshot,fullPage:true});
    results.push({width,theme,states,errors,measurements,screenshot});await page.close();
  }
} finally {await browser.close();await new Promise(r=>server.close(r));}
fs.writeFileSync('tmp/seven-string-fit-browser-results.json',JSON.stringify({url,browser:'local Edge',physicalDevice:false,results},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
