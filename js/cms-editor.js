/* Linggau AI Studio CMS v2 — complete editorial workspace, no build tools. */
(() => {
 'use strict';
 const studio=window.STUDIO,api=studio.cmsBridge,site=studio.site;
 const admin=document.querySelector('#adminModal'),panel=document.querySelector('#adminPanel');
 if(!admin||!panel||!api||!site)return;
 const bar=document.createElement('div');bar.className='cms-tabs';bar.setAttribute('role','tablist');
 const projectsTab=document.createElement('button'),pageTab=document.createElement('button');
 [projectsTab,pageTab].forEach(b=>{b.type='button';b.className='cms-tab';b.setAttribute('role','tab');});
 projectsTab.textContent='Karya & Proyek';pageTab.textContent='Seluruh Konten Website';
 bar.append(projectsTab,pageTab);
 const projectArea=document.createElement('section');projectArea.id='cmsProjectArea';
 [panel.querySelector('.field-actions'),panel.querySelector('#adminProjectList'),panel.querySelector('#projectForm')].forEach(el=>projectArea.append(el));
 const logout=document.querySelector('#logoutAdmin');logout.classList.add('cms-logout');bar.append(logout);
 panel.prepend(bar);panel.append(projectArea);
 const area=document.createElement('section');area.id='cmsSiteArea';area.hidden=true;area.className='cms-site-area';
 area.innerHTML='<div class="cms-intro"><div><p class="cms-kicker">LIVE CONTENT EDITOR</p><h3>Konten seluruh website</h3><p>Kelola identitas, hero, tentang, proses, keahlian, kontak, SEO, tema dan karakter. Tab Karya & Proyek tetap untuk kartu portofolio.</p></div><span class="cms-connection" id="cmsConnection">Memeriksa koneksi…</span></div>'+
 '<div class="cms-editor-actions"><button type="button" class="btn btn-light" id="cmsPreview">Pratinjau halaman</button><button type="button" class="btn btn-light" id="cmsResetPreview">Batalkan pratinjau</button><button type="button" class="btn btn-light" id="cmsReload">Muat terbaru</button><button type="button" class="btn btn-dark" id="cmsPublish">Simpan & Terbitkan</button></div>'+
 '<p class="cms-site-message" id="cmsSiteMessage" role="status" aria-live="polite"></p>'+
 '<div class="cms-editor-layout"><nav id="cmsSectionNav" class="cms-section-nav" aria-label="Kelompok konten"></nav><section class="cms-fields"><div class="cms-fields-head"><h4 id="cmsFieldsHeading"></h4><span id="cmsFieldCount"></span></div><div id="cmsFieldList"></div></section></div>'+
 '<div class="cms-history"><div><strong>Riwayat versi</strong><p>Setiap publikasi menyimpan versi sebelumnya pada tab privat site_history.</p></div><button type="button" class="btn btn-light" id="cmsRestore">Pulihkan versi sebelumnya</button></div>'+
 '<p class="cms-character-help">Karakter animasi memakai peta mata dan jari khusus. Gambar yang belum terkalibrasi ditampilkan statis. Untuk animasi baru dengan pose berbeda, perlu penyesuaian koordinat.</p>';
 panel.append(area);
 const $=s=>area.querySelector(s);
 const msg=(text,bad=false)=>{$('#cmsSiteMessage').textContent=text;$('#cmsSiteMessage').classList.toggle('cms-error',bad);};
 const groups=[...new Set(site.fields.map(f=>f.group))];
 let group=groups[0],draft=site.read(),dirty=false,preview=false;
 function updateConnection(){
   const connected=api.siteEnabled(),indicator=$('#cmsConnection');
   indicator.textContent=connected?'Google Sheets CMS terhubung':'Backend CMS v2 perlu diaktifkan';
   indicator.classList.toggle('connected',connected);
   $('#cmsPublish').disabled=!connected;$('#cmsRestore').disabled=!connected;
   if(!connected)msg('Pratinjau lokal tersedia. Untuk publikasi, pasang Code.gs versi terbaru pada Apps Script dan deploy versi baru.',true);
 }
 function showTab(name){
   const content=name==='content';projectArea.hidden=content;area.hidden=!content;
   projectsTab.classList.toggle('active',!content);pageTab.classList.toggle('active',content);
   projectsTab.setAttribute('aria-selected',String(!content));pageTab.setAttribute('aria-selected',String(content));
   if(content){render();updateConnection();}
   admin.scrollTop=0;
 }
 projectsTab.onclick=()=>showTab('projects');pageTab.onclick=()=>showTab('content');
 function renderMenu(){
   const menu=$('#cmsSectionNav');menu.replaceChildren();
   for(const label of groups){
     const b=document.createElement('button');b.type='button';b.className='cms-section-button'+(label===group?' active':'');
     b.textContent=label+' · '+site.fields.filter(f=>f.group===label).length;
     b.setAttribute('aria-current',String(label===group));
     b.onclick=()=>{group=label;render();};menu.append(b);
   }
 }
 function createInput(f){
   let input;const value=draft[f.key]??'';
   if(f.type==='textarea'){input=document.createElement('textarea');input.rows=Math.min(6,Math.max(3,Math.ceil(value.length/90)));input.maxLength=6000;}
   else if(f.type==='select'||f.type==='font'){
     input=document.createElement('select');
     const options=f.type==='font'?[['Geist','Geist — Modern'],['Plus Jakarta Sans','Plus Jakarta Sans — Profesional'],['Instrument Serif','Instrument Serif — Editorial']]:[['animated','Animasi interaktif (aset terkalibrasi)'],['static','Gambar statis'],['hidden','Sembunyikan']];
     options.forEach(pair=>{
       const option=document.createElement('option');option.value=pair[0];option.textContent=pair[1];input.append(option);
     });
   }else{
     input=document.createElement('input');
     input.type=({email:'email',tel:'tel',number:'number',color:'color'}[f.type]||'text');
     input.maxLength=1500;
     if(f.type==='number'){input.min=f.key==='character.offset'?'-40':'60';input.max=f.key==='character.offset'?'40':'140';input.step='1';}
   }
   input.id='cms-'+f.key.replace(/[^a-z0-9]/ig,'-');input.name=f.key;input.value=value;
   input.addEventListener('input',()=>{
     draft[f.key]=input.value;dirty=true;
     $('#cmsPublish').classList.add('has-changes');
     msg('Perubahan belum diterbitkan. Pilih Pratinjau atau Simpan & Terbitkan.');
   });
   return input;
 }
 function render(){
   renderMenu();const fields=site.fields.filter(f=>f.group===group);
   $('#cmsFieldsHeading').textContent=group;$('#cmsFieldCount').textContent=fields.length+' pengaturan';
   const list=$('#cmsFieldList');list.replaceChildren();
   for(const f of fields){
     const label=document.createElement('label');label.className='cms-field';
     const head=document.createElement('span');head.className='cms-field-title';head.textContent=f.label;
     const input=createInput(f);label.htmlFor=input.id;label.append(head,input);
     if(f.type==='image'||f.key==='contact.whatsapp'){
       const help=document.createElement('small');help.textContent=f.type==='image'?'Gunakan URL https:// atau path assets/... dari GitHub.':'Gunakan kode negara dan nomor angka saja, contohnya 6289509016792.';
       label.append(help);
     }
     list.append(label);
   }
 }
 function refresh(){draft=site.read();dirty=false;preview=false;$('#cmsPublish').classList.remove('has-changes');render();updateConnection();}
 document.addEventListener('studio:cms-login',()=>{admin.classList.add('cms-wide');refresh();showTab('projects');});
 document.addEventListener('studio:cms-logout',()=>{site.reset();admin.classList.remove('cms-wide');preview=false;dirty=false;showTab('projects');});
 document.addEventListener('studio:cms-site-sync',()=>{if(!dirty){draft=site.read();render();}updateConnection();});
 $('#cmsPreview').onclick=()=>{
   if(!api.isAuthenticated()){msg('Sesi admin sudah berakhir.',true);return;}
   try{
     site.preview(draft);preview=true;
     const toast=document.querySelector('#toast');
     if(toast){toast.textContent='Pratinjau lokal — belum diterbitkan';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3200);}
     msg('Pratinjau lokal tampil. Buka kembali CMS dengan 3 klik badge status. Data publik belum berubah.');
     admin.close();
   }catch(e){msg(e.message||'Pratinjau gagal.',true);}
 };
 $('#cmsResetPreview').onclick=()=>{site.reset();preview=false;msg('Pratinjau dibatalkan. Versi publik dipulihkan.');};
 $('#cmsReload').onclick=async()=>{
   if(dirty&&!confirm('Buang perubahan yang belum diterbitkan, lalu muat data terbaru?'))return;
   msg('Memuat data terbaru…');
   try{await api.sync();refresh();msg('Data terbaru dimuat.');}catch(e){msg(e.message||'Gagal memuat.',true);}
 };
 $('#cmsPublish').onclick=async()=>{
   if(!api.isAuthenticated()){msg('Sesi admin sudah berakhir.',true);return;}
   const button=$('#cmsPublish');button.disabled=true;msg('Menyimpan seluruh konten…');
   try{
     const r=await api.saveSite(draft);if(!r.siteRevision)throw Error('Server tidak mengonfirmasi revisi.');
     refresh();msg('Berhasil diterbitkan ke Google Sheets. Pengunjung baru akan melihatnya saat memuat halaman.');
   }catch(e){msg(e.message||'Penyimpanan gagal.',true);}
   finally{button.disabled=!api.siteEnabled();}
 };
 $('#cmsRestore').onclick=async()=>{
   if(!api.isAuthenticated()){msg('Sesi admin sudah berakhir.',true);return;}
   if(!confirm('Kembalikan konten ke versi sebelum publikasi terakhir?'))return;
   msg('Memulihkan konten…');
   try{await api.revertSite();refresh();msg('Versi sebelumnya berhasil dipulihkan.');}catch(e){msg(e.message||'Gagal memulihkan.',true);}
 };
 admin.addEventListener('close',()=>{if(!preview)site.reset();});
 render();
})();