
/* "Get in touch" / "Contact": scroll so the contact box shows from its badge down to the Email + LinkedIn buttons */
(()=>{
  const links=[...document.querySelectorAll('a[href="#contact"]')];
  if(!links.length) return;
  const target=()=>{
    const badge=document.querySelector('#contact .badge'), row=document.querySelector('#contact .cta-links');
    if(!badge||!row) return null;
    const nav=document.querySelector('.nav'), navB=nav?nav.getBoundingClientRect().bottom:90;
    const y=window.scrollY, top=badge.getBoundingClientRect().top+y, bottom=row.getBoundingClientRect().bottom+y;
    const vh=window.innerHeight, pad=14;
    let t=bottom+pad-vh;                 /* Email/LinkedIn row sits at the bottom edge */
    t=Math.min(t, top-navB-pad);         /* never hide the badge under the nav (short screens) */
    const max=document.documentElement.scrollHeight-vh;
    return Math.max(0, Math.min(t, max));
  };
  links.forEach(a=>a.addEventListener('click',e=>{
    const t=target(); if(t==null) return;
    e.preventDefault();
    window.scrollTo({top:t,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
    try{history.replaceState(null,'','#contact')}catch(_){}
  }));
})();

/* Backend integration. Public defaults render synchronously before any network request. */
(() => {
 const $=s=>document.querySelector(s);
 let gasURL='',loadPromise;
 const validEndpoint=s=>/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(s);
 async function request(action,payload){
  if(!validEndpoint(gasURL))throw Error('Form online belum aktif. Silakan hubungi Ferry melalui WhatsApp.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  try{
   const options={redirect:'follow',signal:controller.signal,credentials:'omit',cache:'no-store'};
   if(payload){options.method='POST';options.headers={'Content-Type':'text/plain;charset=utf-8'};options.body=JSON.stringify({action,...payload});}
   const response=await fetch(payload?gasURL:gasURL+'?action='+encodeURIComponent(action),options);
   if(!response.ok)throw Error('Layanan tidak dapat diakses. Coba lagi atau gunakan WhatsApp.');
   const result=await response.json();if(!result.ok)throw Error(result.error||'Permintaan gagal.');return result;
  }catch(err){if(err.name==='AbortError')throw Error('Respons terlalu lama. Data mungkin sudah tersimpan; coba lagi dengan pesan yang sama.');if(err instanceof SyntaxError)throw Error('Layanan belum tersedia. Silakan hubungi melalui WhatsApp.');throw err;}
  finally{clearTimeout(timer);}
 }
 async function sync(){const data=await request('projects');window.STUDIO.updateProjects(data.projects);if(Array.isArray(data.blocks))window.STUDIO.renderBlocks?.(data.blocks);if(typeof data.siteRevision==='string'&&data.content&&typeof data.content==='object')window.STUDIO.site?.publish(data.content);return data;}
 loadPromise=(async()=>{
   try{
     const r=await fetch('config.json',{cache:'no-store'});if(!r.ok)throw Error('Konfigurasi belum dapat dimuat.');
     const config=await r.json();
     if(validEndpoint(String(config.gasUrl||'').trim())){
       gasURL=String(config.gasUrl).trim();
       try{
         await sync();
         $('#leadStatus').textContent='Silakan isi formulir di atas. Anda juga dapat menghubungi saya lewat WhatsApp.';
       }catch(err){
         $('#leadStatus').textContent='Formulir sedang tidak tersedia. Silakan hubungi saya lewat WhatsApp.';
       }
     }else{
     }
   }catch(err){}
   if(!validEndpoint(gasURL))$('#leadStatus').textContent='Formulir sedang tidak tersedia. Silakan gunakan WhatsApp atau Email di atas.';
 })();
 const lead=$('#leadForm');let startedAt=Date.now(),requestId=crypto.randomUUID();
 lead.addEventListener('submit',async e=>{
  e.preventDefault();const button=lead.querySelector('button[type=submit]');button.disabled=true;$('#leadStatus').textContent='Mengirim pesan…';
  try{await loadPromise;const b=Object.fromEntries(new FormData(lead));b.consent=lead.elements.consent.checked;b.startedAt=startedAt;b.requestId=requestId;const result=await request('lead',b);if(!result.id)throw Error('Penyimpanan belum terkonfirmasi.');$('#leadStatus').textContent=String(window.STUDIO.site?.values()['form.submitStatus']||'Pesan Anda berhasil dikirim. Terima kasih, saya akan menghubungi Anda.');lead.reset();requestId=crypto.randomUUID();startedAt=Date.now();}
  catch(err){$('#leadStatus').textContent='Pesan belum dapat dikonfirmasi terkirim. Silakan coba lagi atau hubungi saya melalui WhatsApp.';}finally{button.disabled=false;}
 });
})();
