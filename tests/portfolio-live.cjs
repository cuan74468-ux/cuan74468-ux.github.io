const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root='https://cuan74468-ux.github.io/';
const ids=['umkm-pos','ai-photo','kurir-juara','ebook-lms','zero-cost-stack','ekatalog-bakso-len-1'];
const assets=['bl-visual-bakso.jpg','Bakso-Len-Promo-Cover.jpg','logo-bakso-len.jpeg','Bakso-Len-Promo-Web.mp4','Bakso-Len-Promo-Web.webm'];
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [1440,360]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.name));page.on('console',m=>{if(m.type()==='error')errors.push('console error');});
   await page.goto(root,{waitUntil:'domcontentloaded',timeout:45000});
   const data=await page.evaluate(async()=>{
    const cfg=await (await fetch('config.json',{cache:'no-store'})).json();
    const read=async a=>{const r=await fetch(cfg.gasUrl+'?action='+a,{cache:'no-store',credentials:'omit'});return {status:r.status,data:await r.json()}};
    const health=await read('health'),projects=await read('projects'),priv=await read('leads');
    const p=await fetch(cfg.gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'workspaceLeads'}),credentials:'omit'});
    const unauthorized=await p.json();
    return {health:{status:health.status,ok:health.data.ok,ready:health.data.ready,version:health.data.version},projectStatus:projects.status,ok:projects.data.ok,projects:(projects.data.projects||[]).map(x=>({id:x.id,thumbnail:x.thumbnail,featured_ring:x.featured_ring,link:x.link})),blocks:(projects.data.blocks||[]).map(x=>({id:x.id,status:x.status})),publicKeys:Object.keys(projects.data),privateGetDenied:priv.data.ok===false,privatePostDenied:unauthorized.ok===false};
   });
   assert.equal(data.health.ok,true,'health ok');assert.equal(data.health.ready,true,'health ready');
   assert.equal(data.ok,true);assert.deepEqual(data.projects.map(x=>x.id).sort(),[...ids].sort());
   assert.equal(data.projects.filter(x=>x.featured_ring).length,5);
   assert.equal(data.blocks.some(x=>x.id==='BLK-EKATALOG-BL1'&&x.status==='active'),true,'published block');
   assert.equal(data.privateGetDenied,true);assert.equal(data.privatePostDenied,true);
   assert.equal(data.publicKeys.some(k=>/admin|password|leads|token|secret/i.test(k)),false);
   console.log('PASS API, CORS, 6 project IDs, published block and unauthorized access denial',width);
   await page.waitForFunction(()=>window.STUDIO?.projects?.length===6&&document.querySelector('#customContent')?.hidden===false,{timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#ringInner [data-id="ekatalog-bakso-len-1"]'),{timeout:30000});
   const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,ring:!!document.querySelector('#ringInner .card'),block:document.querySelector('#customContent')?.textContent.includes('Bakso Len 1')}));
   assert.ok(layout.scroll<=layout.width+1,'horizontal overflow');assert.ok(layout.ring&&layout.block);
   const results=await page.evaluate(async paths=>Promise.all(paths.map(async p=>{const r=await fetch(p,{cache:'no-store'});return {path:p,ok:r.ok,type:r.headers.get('content-type')||''}})),[...new Set([...data.projects.map(x=>x.thumbnail),...assets.map(x=>'assets/bakso-len/'+x)])]);
   for(const r of results){assert.ok(r.ok&&/^(image|video)\//i.test(r.type),'asset '+r.path);console.log('PASS asset',r.path)}
   for(const target of ['https://cuan74468-ux.github.io/bakso-len-1-menu/','https://pos-sederhana-bakso-len.vercel.app/','https://cuan74468-ux.github.io/buku-pintar-vibe-coder/']){
    const res=await page.request.get(target,{timeout:30000});assert.ok(res.ok(),'outbound '+target);console.log('PASS outbound',target);
   }
   assert.ok(data.projects.some(x=>x.link.startsWith('https://wa.me/6283160697880')),'WhatsApp destination');
   assert.deepEqual(errors,[],'browser errors');console.log('PASS layout and console',width);
   await page.close();
  }
 } finally{await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
