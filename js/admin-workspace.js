/* Linggau AI Studio — independent, browser-only CMS workspace.
   No third-party UI framework, auth tokens are kept in memory only. */
(()=>{
'use strict';
const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const VALID_GAS=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
const SCHEMA=window.STUDIO_SCHEMA||[];
const groups=[...new Set(SCHEMA.map(f=>f.group))];
const state={gas:'',token:'',expires:0,email:'',projects:[],revision:'',siteContent:{},siteRevision:'',defaults:{},draft:{},dirty:false,group:groups[0]||'',fieldPage:1,projectPage:1,projectSearch:'',projectTab:'active',archive:[],archiveTotal:0,archivePages:1,leadPage:1,leadStatus:'semua',leadSearch:'',leads:[],leadPages:1,leadTotal:0,historyPage:1,historyPages:1,history:[],overview:null,previewReady:false,view:'overview',media:[],mediaPage:1,mediaPages:1,mediaTotal:0,mediaFilter:'active',mediaSearch:'',mediaUploadConfigured:false};
let toastTimer=null,leadTimer=null;
const toast=(message,bad=false)=>{
 const el=$('#toast');el.textContent=String(message||'Terjadi kesalahan');el.classList.toggle('error',bad);el.classList.add('show');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),5000);
};
function setStatus(element,text){if(element)element.textContent=String(text||'');}
function safeImage(url){
 const val=String(url||'').trim();
 return /^(?:\.\/)?assets\/[A-Za-z0-9._/-]+$/.test(val)&&!val.includes('..')?val:
  /^https:\/\/[^\s<>"'\\]+$/i.test(val)?val:'';
}
function friendlyDate(value){
 const d=new Date(value);return Number.isNaN(d.getTime())?String(value||'—'):new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(d);
}
function el(tag,className,text){
 const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);
 return node;
}
function btn(label,className,fn){
 const b=el('button',className,label);b.type='button';if(fn)b.addEventListener('click',fn);return b;
}
function emptyRow(cols,message){
 const tr=el('tr'),cell=el('td','empty-state',message);cell.colSpan=cols;tr.append(cell);return tr;
}
function isLoggedIn(){return !!state.token&&Date.now()<state.expires;}
function needLogin(){if(!isLoggedIn())throw Error('Sesi admin berakhir. Masuk kembali.');}
async function request(action,body=null){
 if(!VALID_GAS.test(state.gas))throw Error('URL Google Apps Script belum terkonfigurasi. Periksa config.json.');
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),action==='mediaUpload'?90000:30000);
 try{
  const options={redirect:'follow',credentials:'omit',cache:'no-store',signal:ctl.signal};
  if(body!==null){options.method='POST';options.headers={'Content-Type':'text/plain;charset=utf-8'};options.body=JSON.stringify({action,...body});}
  const url=body!==null?state.gas:state.gas+'?action='+encodeURIComponent(action);
  const response=await fetch(url,options);
  if(!response.ok)throw Error('HTTP '+response.status+' — GAS tidak dapat diakses.');
  const result=await response.json();
  if(!result||result.ok!==true)throw Error(result?.error||'Permintaan ditolak oleh backend.');
  return result;
 }catch(error){
  if(error?.name==='AbortError')throw Error('Waktu respons GAS habis. Periksa koneksi atau Execution log.');
  if(error instanceof SyntaxError)throw Error('Respons GAS bukan JSON. Periksa akses Web App dan deployment versi baru.');
  throw error;
 }finally{clearTimeout(timer);}
}
async function configure(){
 const r=await fetch('config.json',{cache:'no-store'});if(!r.ok)throw Error('config.json tidak tersedia.');
 const c=await r.json(),url=String(c.gasUrl||'').trim();
 if(!VALID_GAS.test(url))throw Error('URL Google Apps Script belum valid di config.json.');
 state.gas=url;
 setStatus($('#settingsBackend'),url);
}
function loggedOut(message){
 state.token='';state.expires=0;
 $('#loginScreen').hidden=false;$('#workspace').hidden=true;closeDrawer();
 if(message)setStatus($('#loginMessage'),message);
}
function setView(name){
 if(!['overview','pages','projects','leads','media','history','settings'].includes(name))return;
 if(!isLoggedIn()){loggedOut('Sesi admin berakhir. Silakan masuk kembali.');return;}
 if(state.dirty&&state.view==='pages'&&name!=='pages'&&!confirm('Ada perubahan halaman yang belum diterbitkan. Tetap berpindah menu?'))return;
 state.view=name;$$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));
 $$('.nav-link').forEach(b=>b.classList.toggle('is-current',b.dataset.view===name));
 const titles={overview:'Ringkasan',pages:'Editor Halaman',projects:'Karya & Proyek',leads:'Inbox Pesan',media:'Media & Gambar',history:'Riwayat Publikasi',settings:'Pengaturan'};
 setStatus($('#crumb'),titles[name]);$('#sidebar').classList.remove('open');
 if(name==='overview')loadOverview();
 if(name==='pages'){renderGroups();renderFields();window.STUDIO_CONTENT?.load();}
 if(name==='projects')refreshProjects();
 if(name==='leads')loadLeads();
 if(name==='media')window.STUDIO_MEDIA?.load();
 if(name==='history')loadHistory();
 if(name==='settings')checkConnection(false);
}
async function login(e){
 e.preventDefault();
 const form=e.currentTarget,button=$('button[type=submit]',form);button.disabled=true;
 setStatus($('#loginMessage'),'Memverifikasi akun…');
 try{
  if(!state.gas)await configure();
  const values=Object.fromEntries(new FormData(form));
  const r=await request('login',{email:values.email,password:values.password});
  if(!r.token||!Number.isFinite(+r.expiresIn))throw Error('Sesi dari server tidak lengkap.');
  state.token=r.token;state.expires=Date.now()+Number(r.expiresIn)*1000;state.email=String(values.email);
  form.elements.password.value='';
  $('#loginScreen').hidden=true;$('#workspace').hidden=false;
  setStatus($('#accountEmail'),state.email);
  toast('Selamat datang kembali. Sesi admin berhasil dibuat.');
  try{await reloadPublic();}catch(error){toast('Login berhasil, tetapi data publik belum dapat dimuat: '+error.message,true);}
  setView('overview');
 }catch(error){
  setStatus($('#loginMessage'),error.message||'Login gagal. Periksa akses backend.');
 }finally{button.disabled=false;}
}
async function reloadPublic(){
 const data=await request('projects');
 state.projects=Array.isArray(data.projects)?data.projects:[];
 state.revision=String(data.revision||'');
 state.siteContent=data.content&&typeof data.content==='object'?data.content:{};
 state.siteRevision=String(data.siteRevision||'');
 if(!state.dirty)resetDraft(false);
 setStatus($('#syncLabel'),state.siteRevision?'Konten publik terhubung · cek fitur lanjut':'CMS halaman belum tersedia');
 return data;
}

/** Save a single live visual asset using existing V2-compatible content actions.
    This does not require the optional V4 media library or GitHub upload token. */
async function saveUsageImage(usage,rawUrl){
 needLogin();
 const url=safeImage(String(rawUrl||'').trim());
 if(!url)throw Error('Masukkan path assets/nama-file.webp atau URL gambar HTTPS yang valid.');
 if(usage.kind==='project'){
   const project=state.projects.find(p=>p.id===usage.id);
   if(!project)throw Error('Proyek tidak tersedia. Muat ulang daftar proyek.');
   if(!state.revision)throw Error('Revisi proyek tidak tersedia. Sinkronkan kembali data publik.');
   const result=await request('saveProject',{token:state.token,expectedRevision:state.revision,project:{...project,thumbnail:url}});
   if(!Array.isArray(result.projects)||typeof result.revision!=='string')throw Error('Respons simpan proyek tidak lengkap.');
   state.projects=result.projects;state.revision=result.revision;
   if(state.view==='projects')renderProjects();
   return {message:'Thumbnail proyek berhasil diperbarui. Periksa website publik setelah memuat ulang.'};
 }
 if(usage.kind==='site'){
   if(!['character.image','hero.waveImage','seo.ogImage'].includes(usage.key))throw Error('Aset ini belum memiliki editor gambar langsung.');
   if(state.dirty)throw Error('Ada perubahan Editor Halaman yang belum diterbitkan. Simpan atau batalkan perubahan itu terlebih dahulu.');
   if(!state.siteRevision)throw Error('Editor gambar membutuhkan dukungan CMS halaman pada GAS. Deployment backend mungkin masih terlalu lama.');
   const values={...state.siteContent,[usage.key]:url};
   if(usage.key==='character.image')values['character.mode']='static';
   const result=await request('saveSite',{token:state.token,expectedSiteRevision:state.siteRevision,content:values});
   if(typeof result.siteRevision!=='string'||!result.content)throw Error('Respons simpan halaman tidak lengkap.');
   state.siteContent=result.content;state.siteRevision=result.siteRevision;
   const preview=$('#pagePreview')?.contentWindow?.STUDIO?.site;
   preview?.publish(state.siteContent);
   resetDraft(state.view==='pages');
   return {message:usage.key==='character.image'
      ?'Karakter diganti dalam mode gambar statis. Gerakan mata dan tangan memerlukan kalibrasi aset tersendiri.'
      :'Gambar halaman berhasil diterbitkan. Muat ulang website publik untuk memeriksanya.'};
 }
 throw Error('Jenis aset tidak dikenal.');
}

async function logout(){
 const token=state.token;loggedOut('Anda telah keluar dari workspace.');
 if(token)try{await request('logout',{token});}catch{}
}
function renderOverview(data){
 state.overview=data;
 setStatus($('#metricProjects'),data.projects??state.projects.length);
 setStatus($('#metricFeatured'),data.featured??state.projects.filter(p=>p.featured_ring).length);
 setStatus($('#metricLeads'),data.leads??'—');
 const open=(data.leadStats?.baru||0)+(data.leadStats?.diproses||0);
 setStatus($('#metricOpen'),open);
 const unread=$('#unreadCount');unread.hidden=!open;unread.textContent=String(open);
 const health=$('#overviewHealth');health.replaceChildren();
 [['Status autentikasi','Terhubung sebagai '+state.email],
  ['Revisi konten',state.siteRevision?'Siap sinkronisasi':'Perlu Code.gs terbaru'],
  ['Proyek diarsipkan',String(data.archivedProjects??0)],
  ['Proses publikasi','Setelah Simpan & Terbitkan, pengunjung memuat ulang halaman']].forEach(([a,b])=>{
    const p=el('p');p.append(el('strong','',a+' — '),document.createTextNode(b));health.append(p);
  });
}
async function loadOverview(){
 if(!isLoggedIn())return;
 try{renderOverview(await request('workspaceOverview',{token:state.token}));}
 catch(error){
   // A legacy backend may still support editing public projects and site images.
   renderOverview({projects:state.projects.length,featured:state.projects.filter(p=>p.featured_ring).length,leads:'—',leadStats:{},archivedProjects:'—'});
   const health=$('#overviewHealth');
   health.append(el('p','muted','Statistik pesan dan arsip membutuhkan API GAS V3/V4. Ganti thumbnail proyek tetap dapat dicoba melalui menu Gambar yang sedang digunakan.'));
   health.append(el('p','muted','Detail backend: '+String(error.message||'Permintaan tidak tersedia.')));
 }
}
function resetDraft(repaint=true){
 state.draft={...state.defaults,...state.siteContent};state.dirty=false;
 setStatus($('#draftStatus'),'Semua perubahan yang diterbitkan telah dimuat.');
 if(repaint)renderFields();
 const frame=$('#pagePreview');if(frame?.contentWindow?.STUDIO?.site)frame.contentWindow.STUDIO.site.reset();
}
function onIframeReady(){
 const frame=$('#pagePreview'),site=frame?.contentWindow?.STUDIO?.site;
 if(!site)return;
 state.defaults={...site.defaults};state.previewReady=true;
 if(!state.dirty)resetDraft();
}
function renderGroups(){
 const menu=$('#fieldGroups');menu.replaceChildren();
 const q=$('#searchFields').value.toLowerCase().trim();
 for(const name of groups){
  const n=SCHEMA.filter(f=>f.group===name&&(!q||f.label.toLowerCase().includes(q)||f.key.toLowerCase().includes(q)));
  if(q&&!n.length)continue;
  const button=btn(name+' · '+n.length,'',()=>{state.group=name;state.fieldPage=1;renderGroups();renderFields();});
  button.classList.toggle('active',name===state.group);
  menu.append(button);
 }
}
function textInputFor(f,val){
 let input;
 if(f.type==='textarea'){input=el('textarea');input.rows=Math.max(3,Math.min(7,Math.ceil(val.length/110)));input.maxLength=6000;}
 else if(f.type==='select'||f.type==='font'||f.type==='icon'){
  input=el('select');const choices=f.type==='font'?[['Geist','Geist — modern'],['Plus Jakarta Sans','Plus Jakarta Sans — profesional'],['Instrument Serif','Instrument Serif — editorial']]:f.type==='icon'?[['#i-claude','Claude'],['#i-figma','Figma'],['#i-perplexity','Perplexity'],['#i-codex','Codex'],['#i-notebooklm','NotebookLM'],['#i-openai','OpenAI'],['#i-midjourney','Midjourney'],['#i-gmail','Gmail'],['#i-linkedin','LinkedIn']]:[['animated','Animasi sesuai pose asli'],['static','Gambar statis'],['hidden','Sembunyikan karakter']];
  for(const [value,label] of choices){const option=el('option','',label);option.value=value;input.append(option);}
 }else{
  input=el('input');input.type=f.key==='hero.ctaUrl'?'text':({color:'color',number:'number',email:'email',tel:'tel',link:'url',image:'text'}[f.type]||'text');
  input.maxLength=1500;
  if(f.type==='number'){input.min=f.key==='character.offset'?-40:60;input.max=f.key==='character.offset'?40:140;input.step='1';}
 }
 input.name=f.key;input.value=val||'';input.setAttribute('aria-label',f.label);
 input.addEventListener('input',()=>{
  state.draft[f.key]=input.value;state.dirty=true;
  setStatus($('#draftStatus'),'Ada perubahan belum diterbitkan. Gunakan pratinjau atau Simpan & Terbitkan.');
 });
 return input;
}
function renderFields(){
 const q=$('#searchFields').value.trim().toLowerCase();
 const options=SCHEMA.filter(f=>f.group===state.group&&(!q||f.label.toLowerCase().includes(q)||f.key.toLowerCase().includes(q)));
 const perPage=9,pages=Math.max(1,Math.ceil(options.length/perPage));state.fieldPage=Math.min(state.fieldPage,pages);
 setStatus($('#fieldGroupTitle'),state.group);setStatus($('#fieldGroupCount'),options.length+' field');
 const area=$('#siteFields');area.replaceChildren();
 if(!options.length)area.append(el('p','empty-state','Tidak ada field yang cocok.'));
 for(const f of options.slice((state.fieldPage-1)*perPage,state.fieldPage*perPage)){
  const lab=el('label','editor-field');lab.append(el('span','',f.label));
  const val=String(state.draft[f.key]??state.defaults[f.key]??'');
  const inp=textInputFor(f,val);
  if(f.type==='color'){const wrap=el('div','field-row');wrap.append(inp,el('span','field-preview',val));inp.addEventListener('input',()=>setStatus($('.field-preview',wrap),inp.value));lab.append(wrap);}
  else lab.append(inp);
  const actions=el('div','editor-tools');
  if(f.type==='image'){
    actions.append(btn('▣ Dari Pustaka Media','button secondary small',()=>window.STUDIO_MEDIA?.pick(item=>{
      inp.value=item.url;inp.dispatchEvent(new Event('input',{bubbles:true}));
      if(f.key==='character.image'){state.draft['character.mode']='static';toast('Gambar baru dipilih. Karakter dialihkan ke mode static hingga animasi dikalibrasi.');}
    })));
    const preview=el('img','media-input-preview');preview.alt='Pratinjau '+f.label;preview.loading='lazy';
    const update=()=>{const path=safeImage(inp.value);preview.hidden=!path;if(path)preview.src=path;};
    inp.addEventListener('input',update);update();lab.append(preview);
  }else if(!['color','font','icon','select','number'].includes(f.type)&&!['contact.email','contact.whatsapp','hero.ctaUrl'].includes(f.key)){
    actions.append(btn('Kosongkan','button subtle small',()=>{inp.value='';inp.dispatchEvent(new Event('input',{bubbles:true}));}));
  }
  actions.append(btn('↺ Kembalikan default','button subtle small',()=>{delete state.draft[f.key];state.dirty=true;renderFields();setStatus($('#draftStatus'),'Konten akan kembali ke default setelah disimpan.');}));
  lab.append(actions);
  const details=(f.type==='image'?'Gunakan URL https:// atau path assets/… pada GitHub.':f.key==='contact.whatsapp'?'Kode negara + nomor, tanpa spasi dan tanpa tanda +.':f.key==='character.mode'?'Aset berbeda pose akan ditampilkan statis tanpa animasi.':f.key==='hero.ctaUrl'?'URL https:// atau #contact / #about / #work.':'');
  if(details)lab.append(el('small','field-help',details));
  area.append(lab);
 }
 drawPager($('#fieldPager'),state.fieldPage,pages,p=>{state.fieldPage=p;renderFields();});
}
function validateDraft(){
 for(const f of SCHEMA){
  const v=String(state.draft[f.key]??'');
  if(f.type==='color'&&v&&!/^#[a-f0-9]{6}$/i.test(v))throw Error('Warna '+f.label+' harus format #RRGGBB.');
  if(f.type==='image'&&v&&!safeImage(v))throw Error('URL gambar tidak valid pada '+f.label);
  if(f.type==='email'&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw Error('Email kontak tidak valid.');
  if(f.key==='contact.whatsapp'&&v&&!/^\d{9,16}$/.test(v))throw Error('Nomor WhatsApp harus angka dan kode negara.');
  if(f.key==='hero.ctaUrl'&&v&&!/^https:\/\/[^\s<>\"']+$/.test(v)&&!/^#(?:contact|work|about)$/.test(v))throw Error('URL tombol hero harus HTTPS atau tautan internal.');
 }
}
function previewSite(){
 if(!state.previewReady)throw Error('Pratinjau sedang dimuat. Buka kembali editor jika belum tampil.');
 validateDraft();const frame=$('#pagePreview');
 frame.contentWindow.STUDIO.site.preview(state.draft);
 frame.scrollIntoView({behavior:'smooth',block:'start'});
 toast('Pratinjau lokal aktif. Belum mengubah website publik.');
}
async function saveSite(){
 const button=$('#saveSite');button.disabled=true;
 try{
  needLogin();validateDraft();
  setStatus($('#draftStatus'),'Menyimpan konten ke Google Sheets…');
  const data=await request('saveSite',{token:state.token,expectedSiteRevision:state.siteRevision,content:state.draft});
  state.siteContent=data.content||{};state.siteRevision=String(data.siteRevision||'');
  state.dirty=false;
  const liveSite=$('#pagePreview')?.contentWindow?.STUDIO?.site;
  if(liveSite)liveSite.publish(state.siteContent);
  resetDraft();toast('Konten berhasil diterbitkan. Pengunjung melihat perubahan saat memuat halaman.');
 }catch(error){setStatus($('#draftStatus'),'Belum tersimpan: '+error.message);toast(error.message,true);}
 finally{button.disabled=false;}
}
function drawPager(holder,page,pages,onPage){
 holder.replaceChildren();
 if(pages<2){holder.append(el('span','',pages===1?'Halaman 1 dari 1':''));return;}
 holder.append(btn('‹','',()=>onPage(Math.max(1,page-1))));
 let start=Math.max(1,page-2),end=Math.min(pages,start+4);start=Math.max(1,end-4);
 for(let i=start;i<=end;i++){const b=btn(String(i),i===page?'current':'',()=>onPage(i));if(i===page)b.setAttribute('aria-current','page');holder.append(b);}
 holder.append(btn('›','',()=>onPage(Math.min(pages,page+1))));
 holder.append(el('span','',page+' / '+pages));
}
function pill(text,kind=''){return el('span','chip-badge '+kind,text);}
function renderProjects(){
 const records=state.projectTab==='active'?state.projects:state.archive;
 const q=state.projectSearch.trim().toLowerCase();
 const visible=state.projectTab==='archive'?records:records.filter(p=>[p.nama,p.kategori,p.id].some(v=>String(v||'').toLowerCase().includes(q)));
 const size=8,pages=state.projectTab==='archive'?state.archivePages:Math.max(1,Math.ceil(visible.length/size)),page=Math.max(1,Math.min(state.projectPage,pages));
 state.projectPage=page;
 const tbody=$('#projectRows');tbody.replaceChildren();
 if(!visible.length)tbody.append(emptyRow(4,state.projectTab==='active'?'Belum ada proyek yang cocok.':'Arsip proyek kosong.'));
 for(const p of state.projectTab==='archive'?visible:visible.slice((page-1)*size,page*size)){
  const tr=el('tr'),identity=el('td'),wrap=el('div','project-identity');
  const picture=el('img','thumb');const source=safeImage(p.thumbnail);if(source){picture.src=source;picture.loading='lazy';picture.alt='';}else picture.hidden=true;
  const info=el('div');info.append(el('strong','',p.nama),el('small','',p.id));wrap.append(picture,info);identity.append(wrap);
  const category=el('td');category.append(pill(p.kategori||'—'));
  const feat=el('td');feat.append(pill(p.featured_ring?'Utama':'Katalog',p.featured_ring?'green':'gray'));
  const actions=el('td');
  actions.append(btn(state.projectTab==='active'?'Edit':'Pulihkan','table-action',()=>state.projectTab==='active'?openProject(p):restoreProject(p)));
  tr.append(identity,category,feat,actions);tbody.append(tr);
 }
 drawPager($('#projectPager'),page,pages,p=>{state.projectPage=p;if(state.projectTab==='archive')refreshProjects();else renderProjects();});
}
async function refreshProjects(){
 if(state.projectTab==='archive'){
  try{
   const result=await request('workspaceArchivedProjects',{token:state.token,page:state.projectPage,limit:8,search:state.projectSearch});
   state.archive=result.items||[];state.archiveTotal=result.total||0;state.archivePages=result.pages||1;state.projectPage=result.page||1;renderProjects();
  }catch(error){toast(error.message,true);}
 }else renderProjects();
}
function makeFormField(name,label,value,kind='text',mandatory=true){
 const item=el('label');item.append(document.createTextNode(label));
 const input=kind==='textarea'?el('textarea'):el('input');
 input.name=name;if(kind!=='textarea')input.type=kind==='url'?'url':kind;
 input.value=String(value??'');input.required=mandatory;
 if(kind==='textarea')input.rows=5;
 if(name==='id')input.pattern='[a-z0-9][a-z0-9-]{0,59}';
 item.append(input);return item;
}
function openDrawer(title,subtitle,body,actions){
 $('#drawerTitle').textContent=title;$('#drawerEyebrow').textContent=subtitle;
 const root=$('#drawerBody'),foot=$('#drawerFooter');root.replaceChildren();foot.replaceChildren();
 if(body)root.append(body);if(actions)actions.forEach(a=>foot.append(a));
 $('#detailDrawer').hidden=false;$('#drawerBackdrop').hidden=false;
}
function closeDrawer(){$('#detailDrawer').hidden=true;$('#drawerBackdrop').hidden=true;}
function projectFormData(p={}){
 const form=el('form');form.id='editProjectForm';
 const fields=[['id','ID unik',p.id||''],['nama','Nama proyek',p.nama||''],['kategori','Kategori',p.kategori||''],['peek_text','Ringkasan tooltip',p.peek_text||''],['deskripsi','Deskripsi lengkap',p.deskripsi||'','textarea'],['thumbnail','URL thumbnail / path assets',p.thumbnail||''],['link','URL demo / WhatsApp HTTPS',p.link||'','url']];
 for(const [name,label,value,kind] of fields)form.append(makeFormField(name,label,value,kind||'text'));
 const id=form.elements.id;id.readOnly=!!p.id;
 const check=el('label','check'),input=el('input');input.type='checkbox';input.name='featured_ring';input.checked=!!p.featured_ring;
 check.append(input,document.createTextNode(' Tampilkan di cincin utama (maksimal 5)'));form.append(check);
 const img=el('img','drawer-preview');img.alt='Pratinjau thumbnail';const src=safeImage(p.thumbnail);if(src)img.src=src;else img.hidden=true;
 form.append(img);form.elements.thumbnail.addEventListener('input',()=>{const src=safeImage(form.elements.thumbnail.value);img.hidden=!src;if(src)img.src=src;});
 const tools=el('div','editor-tools');tools.append(btn('▣ Pilih dari Pustaka Media','button secondary small',()=>window.STUDIO_MEDIA?.pick(item=>{form.elements.thumbnail.value=item.url;form.elements.thumbnail.dispatchEvent(new Event('input',{bubbles:true}));})));form.append(tools);
 return form;
}
function openProject(p={}){
 const editing=!!p.id,form=projectFormData(p);
 const save=btn(editing?'Simpan Perubahan':'Buat Proyek','button primary',async()=>{
  if(!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));data.featured_ring=form.elements.featured_ring.checked;
  const b=save;b.disabled=true;
  try{
   const r=await request('saveProject',{token:state.token,expectedRevision:state.revision,project:data});
   state.projects=r.projects||[];state.revision=r.revision;closeDrawer();renderProjects();toast(editing?'Proyek berhasil diperbarui.':'Proyek baru berhasil dibuat.');
  }catch(error){toast(error.message,true);}finally{b.disabled=false;}
 });
 const cancel=btn('Batal','button subtle',closeDrawer);
 const actions=[cancel];
 if(editing)actions.push(btn('Arsipkan','button danger',()=>archiveProject(p)));
 actions.push(save);
 openDrawer(editing?'Edit proyek':'Tambah proyek',editing?'PROJECT EDITOR':'NEW PROJECT',form,actions);
}
async function archiveProject(p){
 if(!confirm('Arsipkan proyek "'+p.nama+'"? Kartu tidak lagi tampil di daftar aktif. Data dapat dipulihkan.'))return;
 try{
  const r=await request('workspaceArchiveProject',{token:state.token,expectedRevision:state.revision,id:p.id});
  state.projects=r.projects||[];state.revision=r.revision;closeDrawer();renderProjects();toast('Proyek dipindahkan ke arsip.');
 }catch(error){toast(error.message,true);}
}
async function restoreProject(p){
 if(!confirm('Pulihkan proyek "'+p.nama+'" ke portofolio aktif?'))return;
 try{
  const r=await request('workspaceRestoreProject',{token:state.token,expectedRevision:state.revision,id:p.id});
  state.projects=r.projects||[];state.revision=r.revision;
  state.projectTab='active';state.projectPage=1;
  $$('[data-project-tab]').forEach(b=>b.classList.toggle('is-on',b.dataset.projectTab==='active'));
  renderProjects();toast('Proyek berhasil dipulihkan.');
 }catch(error){toast(error.message,true);}
}
async function loadLeads(){
 if(!isLoggedIn())return;const tbody=$('#leadRows');tbody.replaceChildren(emptyRow(5,'Mengambil pesan…'));
 try{
  const r=await request('workspaceLeads',{token:state.token,page:state.leadPage,limit:12,status:state.leadStatus,search:state.leadSearch});
  state.leads=r.items||[];state.leadPages=r.pages||1;state.leadTotal=r.total||0;state.leadPage=r.page||1;
  tbody.replaceChildren();if(!state.leads.length)tbody.append(emptyRow(5,'Tidak ada pesan pada filter ini.'));
  for(const p of state.leads){
   const tr=el('tr'),name=el('td');name.append(el('strong','',p.nama),el('div','muted',p.whatsapp));
   const cat=el('td','',p.kebutuhan),date=el('td','',friendlyDate(p.tanggal));
   const status=el('td');const style=p.status==='selesai'?'green':p.status==='baru'?'orange':'gray';status.append(pill(p.status,style));
   const action=el('td');action.append(btn('Buka','table-action',()=>openLead(p)));
   tr.append(name,cat,date,status,action);tbody.append(tr);
  }
  drawPager($('#leadPager'),state.leadPage,state.leadPages,p=>{state.leadPage=p;loadLeads();});
 }catch(error){tbody.replaceChildren(emptyRow(5,'Backend inbox belum aktif: '+error.message));toast(error.message,true);}
}
function openLead(p){
 const body=el('div');body.append(el('p','drawer-meta',friendlyDate(p.tanggal)),el('h3','',p.nama),el('p','drawer-meta','WhatsApp '+p.whatsapp+' · '+p.kebutuhan));
 const message=el('div','lead-message',p.pesan);body.append(message);
 if(/^[+0-9 ()-]{8,25}$/.test(p.whatsapp)){
  const number=p.whatsapp.replace(/\D/g,''),wa=el('a','button secondary','Hubungi via WhatsApp ↗');
  wa.href='https://wa.me/'+number;wa.target='_blank';wa.rel='noopener noreferrer';wa.style.marginTop='14px';body.append(wa);
 }
 const form=el('form');
 const status=el('label');status.append(document.createTextNode('Status tindak lanjut'));const select=el('select');select.name='status';
 [['baru','Baru'],['diproses','Diproses'],['selesai','Selesai'],['arsip','Arsip']].forEach(([v,t])=>{const o=el('option','',t);o.value=v;select.append(o);});select.value=p.status;status.append(select);
 const notes=el('label');notes.append(document.createTextNode('Catatan internal'));const area=el('textarea');area.name='catatan';area.maxLength=2000;area.rows=5;area.value=p.catatan||'';notes.append(area);
 form.append(status,notes);body.append(form);
 const save=btn('Simpan Tindak Lanjut','button primary',async()=>{
  save.disabled=true;
  try{
   await request('workspaceSaveLead',{token:state.token,id:p.id,status:select.value,catatan:area.value});
   closeDrawer();await loadLeads();await loadOverview();toast('Status dan catatan pesan berhasil disimpan.');
  }catch(error){toast(error.message,true);}finally{save.disabled=false;}
 });
 openDrawer('Pesan dari '+p.nama,'CONTACT INBOX',body,[btn('Tutup','button subtle',closeDrawer),save]);
}
async function loadHistory(){
 const body=$('#historyRows');body.replaceChildren(emptyRow(4,'Memuat riwayat…'));
 try{
  const r=await request('workspaceHistory',{token:state.token,page:state.historyPage});
  state.history=r.items||[];state.historyPages=r.pages||1;state.historyPage=r.page||1;
  body.replaceChildren();if(!state.history.length)body.append(emptyRow(4,'Belum ada publikasi yang tercatat.'));
  for(const p of state.history){
   const tr=el('tr'),time=el('td','',friendlyDate(p.tanggal)),who=el('td','',p.admin),id=el('td','',p.id.slice(0,12)+'…'),action=el('td');
   action.append(btn('Pulihkan versi ini','table-action',()=>restoreHistory(p)));
   tr.append(time,who,id,action);body.append(tr);
  }
  drawPager($('#historyPager'),state.historyPage,state.historyPages,p=>{state.historyPage=p;loadHistory();});
 }catch(error){body.replaceChildren(emptyRow(4,'Tidak dapat memuat riwayat: '+error.message));}
}
async function restoreHistory(p){
 if(!confirm('Pulihkan isi halaman ke snapshot pada '+friendlyDate(p.tanggal)+'? Versi saat ini akan dicadangkan.'))return;
 try{
  const r=await request('workspaceRestoreHistory',{token:state.token,id:p.id,expectedSiteRevision:state.siteRevision});
  state.siteRevision=r.siteRevision;state.siteContent=r.content||{};
  const liveSite=$('#pagePreview')?.contentWindow?.STUDIO?.site;
  if(liveSite)liveSite.publish(state.siteContent);
  resetDraft();
  await loadHistory();toast('Versi halaman berhasil dipulihkan.');
 }catch(error){toast(error.message,true);}
}

async function diagnoseModules(){
 const button=$('#diagnoseModules'),target=$('#diagnosticResults');
 if(!button||!target)return;
 button.disabled=true;button.textContent='Memeriksa modul…';
 target.replaceChildren();
 const checks=[
   {name:'Data proyek dan halaman publik',action:'projects',body:null,verify:r=>Array.isArray(r.projects)},
   {name:'Editor konten halaman',action:'projects',body:null,verify:r=>typeof r.siteRevision==='string'&&r.content&&typeof r.content==='object'},
   {name:'Ringkasan admin',action:'workspaceOverview',body:{token:state.token},verify:r=>r.account&&typeof r.projects==='number'},
   {name:'Inbox pesan',action:'workspaceLeads',body:{token:state.token,page:1,limit:5,status:'semua'},verify:r=>Array.isArray(r.items)},
   {name:'Riwayat publikasi',action:'workspaceHistory',body:{token:state.token,page:1},verify:r=>Array.isArray(r.items)},
   {name:'Pustaka Media',action:'mediaList',body:{token:state.token,page:1,limit:6,status:'active'},verify:r=>Array.isArray(r.items)},
   {name:'Blok konten dinamis',action:'contentList',body:{token:state.token,page:1,limit:5,status:'all'},verify:r=>Array.isArray(r.items)}
 ];
 try{
   for(const item of checks){
     const line=el('div','diagnostic-row'),label=el('strong','',item.name),value=el('span','diagnostic-pending','Memeriksa…');
     line.append(label,value);target.append(line);
     try{
       const response=await request(item.action,item.body);
       if(item.verify(response)){value.textContent='Tersambung';value.className='diagnostic-ok';}
       else{value.textContent='Respons belum lengkap';value.className='diagnostic-warn';}
     }catch(error){
       const message=String(error.message||'Akses gagal');
       value.textContent=message.includes('Aksi tidak tersedia')?'Belum didukung deployment GAS':message;
       value.className='diagnostic-warn';
     }
   }
 }finally{button.disabled=false;button.textContent='Periksa Semua Modul';}
}

async function checkConnection(show=true){
 try{
  if(!state.gas)await configure();
  const response=await request('health');
  const version=Number(response.version)||0;
  const features=Array.isArray(response.features)?response.features:[];
  const isV4=version>=4&&features.includes('mediaLibrary')&&features.includes('contentBlocks');
  const canEditSite=!!state.siteRevision;
  const notice=isV4
    ?'GAS V4 dikenali: Pustaka Media dan CRUD konten tersedia. Upload langsung masih memerlukan MEDIA_GITHUB_TOKEN.'
    :'GAS versi '+(version||'tidak diketahui')+' terdeteksi. Pustaka Media/CRUD lanjutan memerlukan deployment V4. Anda tetap dapat mencoba Ganti Gambar untuk thumbnail proyek'+(canEditSite?' maupun aset halaman':'')+'.';
  setStatus($('#settingsBackend'),state.gas+'\n'+notice+'\nStatus konfigurasi: '+(response.ready?'siap':'perlu pemeriksaan'));
  setStatus($('#syncLabel'),isV4?'Backend V4 dikenali':'Fitur lanjutan belum aktif');
  if(show)toast(notice,!isV4);
 }catch(error){
  const note=state.projects.length
    ?'Backend publik mengirim data proyek, tetapi endpoint pemeriksaan versi tidak tersedia. Ganti Gambar proyek tetap dapat dicoba. Untuk Pustaka Media dan CRUD baru, perlu deploy GAS V4.'
    :'Versi backend belum dapat dibuktikan. Periksa akses GAS atau konfigurasi deployment.';
  setStatus($('#settingsBackend'),state.gas+'\n'+note+'\nDetail: '+String(error.message||'Koneksi gagal.'));
  setStatus($('#syncLabel'),'Periksa versi API GAS');
  if(show)toast(note,true);
 }
}
function bindEvents(){
 $('#loginForm').addEventListener('submit',login);
 $('#logoutButton').addEventListener('click',logout);
 $('#sideNav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)setView(b.dataset.view);});
 $('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
 $$('[data-go]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.go)));
 $('#refreshOverview').addEventListener('click',loadOverview);
 $('#saveSite').addEventListener('click',saveSite);
 $('#resetDraft').addEventListener('click',()=>{if(!state.dirty||confirm('Batalkan seluruh perubahan yang belum diterbitkan?'))resetDraft();});
 $('#searchFields').addEventListener('input',()=>{state.fieldPage=1;renderGroups();renderFields();});
 $('#previewChanges').addEventListener('click',()=>{try{previewSite();}catch(error){toast(error.message,true);}});
 $('#resetPreview').addEventListener('click',()=>{const site=$('#pagePreview').contentWindow?.STUDIO?.site;if(site)site.reset();toast('Pratinjau dikembalikan ke konten publik.');});
 $$('[data-device]').forEach(b=>b.addEventListener('click',()=>{$$('[data-device]').forEach(n=>n.classList.toggle('is-on',n===b));$('#pagePreview').classList.toggle('mobile',b.dataset.device==='mobile');}));
 $('#pagePreview').addEventListener('load',onIframeReady);
 $('#projectSearch').addEventListener('input',e=>{state.projectSearch=e.target.value;state.projectPage=1;if(state.projectTab==='archive')refreshProjects();else renderProjects();});
 $$('[data-project-tab]').forEach(b=>b.addEventListener('click',()=>{state.projectTab=b.dataset.projectTab;state.projectPage=1;$$('[data-project-tab]').forEach(n=>n.classList.toggle('is-on',n===b));refreshProjects();}));
 $('#newProject').addEventListener('click',()=>openProject());
 $('#refreshLeads').addEventListener('click',loadLeads);
 $('#leadFilter').addEventListener('change',e=>{state.leadStatus=e.target.value;state.leadPage=1;loadLeads();});
 $('#leadSearch').addEventListener('input',e=>{clearTimeout(leadTimer);leadTimer=setTimeout(()=>{state.leadSearch=e.target.value;state.leadPage=1;loadLeads();},350);});
 $('#refreshHistory').addEventListener('click',loadHistory);
 $('#addMediaLink').addEventListener('click',()=>window.STUDIO_MEDIA?.edit());
 $('#uploadMedia').addEventListener('click',()=>window.STUDIO_MEDIA?.upload());
 $('#refreshMedia').addEventListener('click',()=>window.STUDIO_MEDIA?.load());
 $('#mediaFilter').addEventListener('change',e=>{state.mediaFilter=e.target.value;state.mediaPage=1;window.STUDIO_MEDIA?.load();});
 let mediaTimer=null;$('#mediaSearch').addEventListener('input',e=>{clearTimeout(mediaTimer);mediaTimer=setTimeout(()=>{state.mediaSearch=e.target.value.trim();state.mediaPage=1;window.STUDIO_MEDIA?.load();},300);});
 $('#checkConnection').addEventListener('click',()=>checkConnection(true));
 $('#diagnoseModules').addEventListener('click',diagnoseModules);
 $('#closeDrawer').addEventListener('click',closeDrawer);$('#drawerBackdrop').addEventListener('click',closeDrawer);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});
 window.addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue='';}});
}
window.STUDIO_ADMIN={state,request,toast,el,btn,openDrawer,closeDrawer,drawPager,makeFormField,safeImage,friendlyDate,saveUsageImage};
bindEvents();
configure().then(()=>{setStatus($('#loginMessage'),'');}).catch(error=>setStatus($('#loginMessage'),error.message));
})();