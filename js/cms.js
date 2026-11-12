
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
 const $=s=>document.querySelector(s),E=window.STUDIO.escapeHTML;
 let gasURL='',revision='',token='',loadPromise,loginExpiry=0,siteRevision='',siteSupported=false,backendReachable=false,backendError='';
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
  }catch(err){if(err.name==='AbortError')throw Error('Respons terlalu lama. Data mungkin sudah tersimpan; coba lagi dengan pesan yang sama.');if(err instanceof SyntaxError)throw Error('Respons bukan JSON. Pastikan deployment Web app dapat diakses oleh Anyone.');throw err;}
  finally{clearTimeout(timer);}
 }
 async function sync(){const data=await request('projects');backendReachable=true;backendError='';revision=data.revision;window.STUDIO.updateProjects(data.projects);siteSupported=typeof data.siteRevision==='string'&&data.content&&typeof data.content==='object';if(siteSupported){siteRevision=data.siteRevision;window.STUDIO.site?.publish(data.content);}updateConnectionNotice();document.dispatchEvent(new CustomEvent('studio:cms-site-sync',{detail:{supported:siteSupported}}));return data;}
 function updateConnectionNotice(){
   const label=document.querySelector('#backendConnectionStatus');
   if(!label)return;
   const configured=validEndpoint(gasURL);
   const settings=document.querySelector('#endpointSetup');
   if(settings)settings.hidden=configured;
   label.textContent=!configured
      ? 'URL backend belum terpasang. Gunakan pengaturan manual hanya jika Anda mengelola deployment baru.'
      : siteSupported
        ? 'Backend sudah dikonfigurasi dan CMS V2 merespons. Langsung login; tidak perlu menempel URL.'
        : backendReachable
          ? 'URL backend sudah terpasang. Jika editor seluruh halaman belum aktif, perbarui Code.gs di Apps Script lalu deploy versi baru.'
          : 'URL backend sudah tersimpan di website, tetapi respons GAS belum dapat diverifikasi. Periksa deployment Apps Script; jangan tempel URL lagi.';
   label.dataset.connection=configured?(siteSupported?'ready':backendReachable?'legacy':'pending'):'unconfigured';
 }
 loadPromise=(async()=>{
   try{
     const r=await fetch('config.json',{cache:'no-store'});if(!r.ok)throw Error('Konfigurasi belum dapat dimuat.');
     const config=await r.json();
     if(validEndpoint(String(config.gasUrl||'').trim())){
       gasURL=String(config.gasUrl).trim();
       try{
         await sync();
         $('#leadStatus').textContent='Form tersambung ke backend. Pesan akan disimpan setelah pengiriman berhasil.';
       }catch(err){
         backendError=String(err.message||'GAS tidak merespons.');
         $('#leadStatus').textContent='Form belum dapat diverifikasi. Gunakan WhatsApp sementara.';
       }
     }else{
       backendError='Alamat backend belum dikonfigurasi.';
     }
   }catch(err){backendError=String(err.message||'Konfigurasi belum tersedia.');}
   if(!validEndpoint(gasURL))$('#leadStatus').textContent='Form online belum aktif. Gunakan tombol WhatsApp atau Email di atas.';
   updateConnectionNotice();
 })();
 const lead=$('#leadForm');let startedAt=Date.now(),requestId=crypto.randomUUID();
 lead.addEventListener('submit',async e=>{
  e.preventDefault();const button=lead.querySelector('button[type=submit]');button.disabled=true;$('#leadStatus').textContent='Mengirim pesan…';
  try{await loadPromise;const b=Object.fromEntries(new FormData(lead));b.consent=lead.elements.consent.checked;b.startedAt=startedAt;b.requestId=requestId;const result=await request('lead',b);if(!result.id)throw Error('Penyimpanan belum terkonfirmasi.');$('#leadStatus').textContent=String(window.STUDIO.site?.values()['form.submitStatus']||'Pesan berhasil tersimpan. Terima kasih, Ferry akan menghubungi Anda.');lead.reset();requestId=crypto.randomUUID();startedAt=Date.now();}
  catch(err){$('#leadStatus').textContent=err.message||'Belum dapat memastikan pesan tersimpan. Silakan coba lagi.';}finally{button.disabled=false;}
 });
 const admin=document.createElement('dialog');admin.className='admin-modal';admin.id='adminModal';admin.setAttribute('aria-labelledby','adminTitle');
 admin.innerHTML=`<header><h2 id="adminTitle">Linggau Studio CMS</h2><button class="admin-close" type="button" aria-label="Tutup admin">×</button></header>
 <p>Kelola proyek dan tautan. Akses tetap memerlukan login admin.</p><p id="adminMessage" role="status" aria-live="polite"></p>
 <p id="backendConnectionStatus" class="cms-backend-status" role="status" aria-live="polite">Memeriksa konfigurasi backend…</p>
 <details id="endpointSetup" hidden><summary>Pengaturan backend manual (opsional)</summary><form id="endpointForm" class="studio-form" novalidate><label>URL Web App GAS (/exec)<input type="text" inputmode="url" name="endpoint" autocomplete="off" spellcheck="false" placeholder="https://script.google.com/macros/s/.../exec"></label><button class="btn btn-light" type="submit">Uji koneksi</button><button class="btn btn-light" type="button" id="downloadConfig" hidden>Unduh config.json</button><p>Gunakan hanya saat membuat backend baru. URL backend situs ini sudah disimpan pada config.json, sehingga tidak perlu diisi ulang untuk masuk CMS.</p></form></details>
 <form id="adminLogin" class="studio-form"><label>Email admin<input type="email" name="email" required autocomplete="username" value="peyaje531@gmail.com"></label><label>Password<input name="password" type="password" required autocomplete="current-password" maxlength="200"></label><button class="btn btn-dark" type="submit">Masuk</button></form>
 <div id="adminPanel" hidden><div class="field-actions"><button class="btn btn-light" id="newProject">Tambah proyek</button><button class="btn btn-light" id="refreshProjects">Muat ulang</button><button class="btn btn-light" id="logoutAdmin">Keluar</button></div><div id="adminProjectList" class="admin-projects"></div>
 <form id="projectForm" class="studio-form"><label>ID unik<input name="id" required pattern="[a-z0-9][a-z0-9-]{0,59}" maxlength="60"></label><label>Nama proyek<input name="nama" required maxlength="120"></label><label>Kategori<input name="kategori" required maxlength="80"></label><label>Ringkasan tooltip<input name="peek_text" required maxlength="250"></label><label>Deskripsi<textarea name="deskripsi" rows="5" required minlength="10" maxlength="6000"></textarea></label><label>URL gambar HTTPS atau assets/nama-file<input name="thumbnail" required maxlength="1500"></label><label>Link demo / WhatsApp<input name="link" type="url" required maxlength="1500"></label><label class="consent"><input name="featured_ring" type="checkbox"> Tampilkan di cincin utama (maksimal 5)</label><button class="btn btn-dark" type="submit">Simpan proyek</button></form></div>`;
 document.body.append(admin);
 const msg=text=>$('#adminMessage').textContent=text;
 function openAdmin(){window.location.assign('studio-admin.html');}
 admin.querySelector('.admin-close').onclick=()=>admin.close();admin.addEventListener('close',()=>{if(location.hash==='#/linggau-core-session')history.replaceState(null,'',location.pathname+location.search);});
 let taps=[];$('#adminTrigger').addEventListener('click',()=>{const now=Date.now();taps=taps.filter(t=>now-t<900);taps.push(now);if(taps.length>=3){taps=[];openAdmin();}});
 const route=()=>{if(location.hash==='#/linggau-core-session')openAdmin();};addEventListener('hashchange',route);route();
 $('#endpointForm').onsubmit=async e=>{e.preventDefault();const url=String(e.target.elements.endpoint.value||'').trim().replace(/[\u200B-\u200D\uFEFF]/g,'');if(!validEndpoint(url)){msg('URL tidak sesuai. Tempel hanya alamat https://script.google.com/macros/s/.../exec, bukan teks atau format tautan.');return;}const old=gasURL;gasURL=url;backendReachable=false;msg('Menguji koneksi…');try{await sync();$('#downloadConfig').hidden=false;msg('Koneksi berhasil. Jika URL ini berbeda dari backend utama, unduh config.json lalu simpan di GitHub.');$('#leadStatus').textContent='Form online terhubung pada sesi ini.';}catch(err){gasURL=old;updateConnectionNotice();msg(err.message);}};
 $('#downloadConfig').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({gasUrl:gasURL},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='config.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 function renderList(){const list=$('#adminProjectList');list.replaceChildren();window.STUDIO.projects.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='cms-project-card';const img=document.createElement('img');img.src=window.STUDIO.safeURL(p.thumbnail,true);img.alt='';img.loading='lazy';img.onerror=()=>{img.hidden=true;};const content=document.createElement('span'),title=document.createElement('strong'),category=document.createElement('small');title.textContent=p.nama;category.textContent=p.kategori+(p.featured_ring?' · Cincin utama':' · Katalog');content.append(title,category);b.append(img,content);b.onclick=()=>{editProject(p);list.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');};list.append(b);});}
 function editProject(p){const form=$('#projectForm');form.reset();for(const [key,value] of Object.entries(p)){const el=form.elements.namedItem(key);if(!el)continue;if(el.type==='checkbox')el.checked=value===true;else el.value=value;}form.elements.id.readOnly=!!p.id;}
 function clearSession(){token='';loginExpiry=0;const panel=admin.querySelector('#adminPanel'),login=admin.querySelector('#adminLogin'),form=admin.querySelector('#projectForm');if(panel)panel.hidden=true;if(login)login.hidden=false;form?.reset();window.STUDIO.site?.reset();document.dispatchEvent(new Event('studio:cms-logout'));}
 $('#adminLogin').onsubmit=async e=>{
  e.preventDefault();
  const button=e.target.querySelector('button');
  button.disabled=true;
  msg('Memeriksa login…');
  let authenticated=false;
  try{
    await loadPromise;
    const credentials=Object.fromEntries(new FormData(e.target));
    const r=await request('login',credentials);
    if(!r.token||!Number.isFinite(Number(r.expiresIn))||Number(r.expiresIn)<=0)throw Error('Respons login tidak lengkap. Periksa deployment Apps Script.');
    token=r.token;loginExpiry=Date.now()+Number(r.expiresIn)*1000;
    authenticated=true;
    e.target.elements.password.value='';
    e.target.hidden=true;
    const panel=admin.querySelector('#adminPanel');
    if(!panel)throw Error('Struktur panel CMS tidak ditemukan.');
    panel.hidden=false;
    renderList();editProject({});
    document.dispatchEvent(new Event('studio:cms-login'));
    msg('Login berhasil. Pilih Karya & Proyek atau Seluruh Konten Website.');
    try{
      await sync();
    }catch(err){
      msg('Login berhasil, tetapi pembaruan data belum tersedia: '+String(err.message||'GAS tidak merespons.'));
    }
  }catch(err){
    if(!authenticated)clearSession();
    e.target.elements.password.value='';
    msg((authenticated?'Login berhasil, tetapi editor gagal dimuat: ':'')+String(err.message||'Gagal masuk.'));
  }finally{button.disabled=false;}
 };
 $('#newProject').onclick=()=>{editProject({});$('#projectForm').elements.id.focus();};
 $('#refreshProjects').onclick=async()=>{try{await sync();renderList();editProject({});msg('Data terbaru dimuat. Pilih kembali proyek yang akan diedit.');}catch(err){msg(err.message);}};
 $('#logoutAdmin').onclick=async()=>{const t=token;clearSession();try{await request('logout',{token:t});msg('Sesi telah ditutup.');}catch{msg('Sesi lokal ditutup. Sesi server akan kedaluwarsa otomatis.');}};

 window.STUDIO.cmsBridge={
   isAuthenticated:()=>!!token&&Date.now()<loginExpiry,
   siteEnabled:()=>siteSupported,
   getSiteRevision:()=>siteRevision,
   sync,
   saveSite:async content=>{
     if(!token||Date.now()>=loginExpiry)throw Error('Sesi admin berakhir. Masuk kembali.');
     if(!siteSupported)throw Error('Backend GAS perlu diperbarui ke versi CMS terbaru, kemudian deploy ulang.');
     const r=await request('saveSite',{token,expectedSiteRevision:siteRevision,content});
     siteRevision=r.siteRevision;window.STUDIO.site.publish(r.content);
     return r;
   },
   revertSite:async()=>{
     if(!token||Date.now()>=loginExpiry)throw Error('Sesi admin berakhir. Masuk kembali.');
     if(!siteSupported)throw Error('Backend CMS terbaru belum aktif.');
     const r=await request('revertSite',{token,expectedSiteRevision:siteRevision});
     siteRevision=r.siteRevision;window.STUDIO.site.publish(r.content);
     return r;
   }
 };
 $('#projectForm').onsubmit=async e=>{e.preventDefault();if(Date.now()>=loginExpiry){clearSession();msg('Sesi berakhir. Login kembali.');return;}const button=e.target.querySelector('button');button.disabled=true;msg('Menyimpan proyek…');try{const p=Object.fromEntries(new FormData(e.target));p.featured_ring=e.target.elements.featured_ring.checked;const r=await request('saveProject',{token,expectedRevision:revision,project:p});revision=r.revision;window.STUDIO.updateProjects(r.projects);renderList();editProject(r.projects.find(x=>x.id===p.id)||p);msg('Proyek berhasil tersimpan di Google Sheets.');}catch(err){msg(err.message);}finally{button.disabled=false;}};
})();
