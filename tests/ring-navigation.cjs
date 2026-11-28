const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root='http://127.0.0.1:8765/';
const config='https://script.google.com/macros/s/TEST_FIXTURE/exec';
const dest='https://portfolio-test.invalid/';
const fixtures=Array.from({length:6},(_,i)=>({id:'test-project-'+i,nama:'Proyek '+i,kategori:'QA',peek_text:'Ring QA',deskripsi:'Fixture for direct link',thumbnail:'assets/char.webp',link:dest+'project-'+i,featured_ring:i<5}));
(async()=>{const browser=await chromium.launch();try{
 for(const width of [1440,360]){
  const mobile=width===360;
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',hasTouch:mobile,isMobile:mobile});
  await context.route('**/config.json',route=>route.fulfill({json:{gasUrl:config}}));
  await context.route(config+'?*',route=>route.fulfill({json:{ok:true,revision:'fixture',projects:fixtures,blocks:[]},headers:{'access-control-allow-origin':'*'}}));
  await context.route(dest+'**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Destination fixture</title>'}));
  const page=await context.newPage();
  const load=async()=>{await page.goto(root,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.STUDIO?.projects?.length===6&&document.querySelector('#ringInner .card')?.dataset.id==='test-project-0');};
  const centered=async()=>{const c=page.locator('#ringInner [data-id="test-project-0"]').first();await c.scrollIntoViewIfNeeded();return c;};
  await load();
  const rows=await page.locator('#ringInner .card').evaluateAll(nodes=>nodes.map(c=>({id:c.dataset.id,href:c.getAttribute('href'),label:c.getAttribute('aria-label')})));
  assert.equal(rows.length,20);for(const row of rows){assert.equal(row.href,fixtures.find(f=>f.id===row.id).link);assert.match(row.label,/^Buka /);}
  const card=await centered();
  if(mobile)await card.tap();else await card.click();
  await page.waitForURL(dest+'project-0');console.log('PASS direct '+(mobile?'touch':'mouse')+' '+width);
  await load();const key=await centered();await key.focus();await page.keyboard.press('Enter');await page.waitForURL(dest+'project-0');console.log('PASS keyboard '+width);
  await load();const drag=await centered();const b=await drag.boundingBox();const x=b.x+b.width/2,y=b.y+b.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+55,y,{steps:6});await page.mouse.up();assert.equal(page.url(),root);assert.equal(await page.locator('#case').evaluate(e=>e.hidden),true);console.log('PASS drag no navigation '+width);
  await page.evaluate(rows=>window.STUDIO.updateProjects(rows),fixtures.map((p,i)=>({...p,link:i===0?dest+'updated':i===1?'javascript:alert(1)':i===2?'':p.link})));
  assert.equal(await page.locator('#ringInner [data-id="test-project-0"]').first().getAttribute('href'),dest+'updated');
  for(const i of [1,2]){const invalid=page.locator('#ringInner [data-id="test-project-'+i+'"]').first();assert.equal(await invalid.getAttribute('href'),null);assert.equal(await invalid.getAttribute('aria-disabled'),'true');}
  await page.goto(root+'#case/test-project-0',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.STUDIO?.projects?.length===6);await page.evaluate(()=>{location.hash='#case/test-project-1'});await page.waitForFunction(()=>document.querySelector('#case')?.hidden===false);console.log('PASS legacy case route and CMS destination refresh '+width);
  await context.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
