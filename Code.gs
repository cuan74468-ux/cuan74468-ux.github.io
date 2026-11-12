/** Linggau AI Studio. Paste into the NEW portfolio Sheet's bound Apps Script project. */
const STUDIO_DB_ID = '1VOJV8zmSJXc3afnh6ly34_8Rguue5R2t4EXemjouYeM';
const PROJECT_HEADERS = ['id','nama','kategori','peek_text','deskripsi','thumbnail','link','featured_ring'];
const LEAD_HEADERS = ['id','nama','whatsapp','kebutuhan','pesan','tanggal'];
const ADMIN_HEADERS = ['email','password','nama'];
function database_(){return SpreadsheetApp.openById(STUDIO_DB_ID);}
function hex_(bytes){return bytes.map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function digest_(s){return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8));}
function pepper_(){const p=PropertiesService.getScriptProperties().getProperty('ADMIN_PEPPER');if(!p)throw Error('Jalankan setupDatabase terlebih dahulu.');return p;}
function sign_(s){return hex_(Utilities.computeHmacSha256Signature(s,pepper_(),Utilities.Charset.UTF_8));}
function equal_(a,b){a=String(a);b=String(b);let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function sheet_(name,headers){const sh=database_().getSheetByName(name);if(!sh)throw Error('Database belum siap.');if(JSON.stringify(sh.getRange(1,1,1,headers.length).getValues()[0])!==JSON.stringify(headers))throw Error('Header database tidak sesuai.');return sh;}
function rows_(name,headers){const sh=sheet_(name,headers),n=sh.getLastRow();return n>1?sh.getRange(2,1,n-1,headers.length).getValues():[];}
function literal_(value){const s=String(value==null?'':value);return /^[=+@\-\t\r\n]/.test(s)?"'"+s:s;}
function text_(v,min,max,label){if(typeof v!=='string')throw Error(label+' tidak valid.');const s=v.trim();if(s.length<min||s.length>max)throw Error(label+' tidak valid.');return s;}
function validUrl_(s,relative){
 if(relative&&/^(?:\.\/)?assets\/[a-zA-Z0-9._/-]+$/.test(s)&&!s.includes('..'))return s;
 if(!/^https:\/\/[^\s<>"'\\]+$/i.test(s))throw Error('URL harus HTTPS.');return s;
}
function projects_(){return rows_('projects',PROJECT_HEADERS).filter(r=>r[0]).map(r=>Object.fromEntries(PROJECT_HEADERS.map((k,i)=>[k,k==='featured_ring'?(r[i]===true||String(r[i]).toLowerCase()==='true'):String(r[i])])));}
function siteState_(){
 const tab=database_().getSheetByName('site_content');
 const rows=tab&&tab.getLastRow()>1?tab.getRange(2,1,tab.getLastRow()-1,2).getValues().filter(r=>r[0]):[];
 const content={};rows.forEach(r=>{const key=String(r[0]);if(/^[a-z][a-zA-Z0-9_.-]{1,79}$/.test(key))content[key]=String(r[1]??'');});
 return {content:content,siteRevision:digest_(JSON.stringify(content))};
}
function publicData_(){const projects=projects_();return {ok:true,projects:projects,revision:digest_(JSON.stringify(projects)),blocks:publishedBlocks_(),...siteState_()};}
/** Idempotent: create missing headers and seeds, never clear leads or overwrite existing projects. */
function setupDatabase(){
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const db=database_(),props=PropertiesService.getScriptProperties();
  if(!props.getProperty('ADMIN_PEPPER'))props.setProperty('ADMIN_PEPPER',Utilities.getUuid()+Utilities.getUuid());
  [['projects',PROJECT_HEADERS],['leads',LEAD_HEADERS],['admin',ADMIN_HEADERS],['site_content',['key','value','updated_at']],['site_history',['id','tanggal','admin','snapshot_json']],['lead_meta',['lead_id','status','catatan','updated_at']],['project_archive',PROJECT_HEADERS.concat(['archived_at','archived_by'])],['media_library',['id','title','kind','url','alt_text','github_path','github_sha','created_at','updated_at','status']],['content_blocks',['id','title','body','image_url','button_text','button_url','sort_order','status','created_at','updated_at']]].forEach(([name,headers])=>{
   let sh=db.getSheetByName(name);if(!sh)sh=db.insertSheet(name);
   if(sh.getLastRow()===0)sh.getRange(1,1,1,headers.length).setValues([headers]);
   if(JSON.stringify(sh.getRange(1,1,1,headers.length).getValues()[0])!==JSON.stringify(headers))throw Error('Header '+name+' berbeda; tidak diubah.');
   sh.setFrozenRows(1);sh.getRange(1,1,1,headers.length).setBackground('#eeeeee').setFontWeight('bold');
  });
  const ps=sheet_('projects',PROJECT_HEADERS),ids=rows_('projects',PROJECT_HEADERS).map(r=>String(r[0]));
  // Seed initial portfolio only on a truly new empty database. An intentionally
  // archived default project must never be recreated by a later setup run.
  const archivedIds=rows_('project_archive',PROJECT_HEADERS.concat(['archived_at','archived_by'])).map(r=>String(r[0]));
  const missing=ps.getLastRow()===1&&!archivedIds.length?DEFAULT_PROJECTS.filter(p=>!ids.includes(p.id)):[];
  if(missing.length)ps.getRange(ps.getLastRow()+1,1,missing.length,8).setValues(missing.map(p=>PROJECT_HEADERS.map(k=>p[k])));
  const adm=sheet_('admin',ADMIN_HEADERS);
  if(adm.getLastRow()<2){
   const initial=props.getProperty('ADMIN_INITIAL_PASSWORD');if(!initial||initial.length<12)throw Error('Isi Script Property ADMIN_INITIAL_PASSWORD (minimal 12 karakter), lalu ulang setup.');
   const salt=Utilities.getUuid();adm.appendRow(['peyaje531@gmail.com','pending$'+salt+'$'+digest_(salt+'\0'+initial),'Ferry (Founder)']);props.deleteProperty('ADMIN_INITIAL_PASSWORD');
  }
  rows_('admin',ADMIN_HEADERS).forEach((r,i)=>{
   const value=String(r[1]);if(value.startsWith('hmac-sha256$'))return;
   let salt,hash;if(value.startsWith('pending$')){const a=value.split('$');salt=a[1];hash=a[2];if(!salt||!/^[a-f0-9]{64}$/.test(hash))throw Error('Verifier admin tidak valid.');}
   else{if(value.length<12)throw Error('Password admin minimal 12 karakter.');salt=Utilities.getUuid();hash=digest_(salt+'\0'+value);}
   adm.getRange(i+2,2).setValue('hmac-sha256$'+salt+'$'+sign_(hash));
  });
  SpreadsheetApp.flush();return {ok:true,projects:projects_().length,spreadsheet:db.getUrl()};
 }finally{lock.releaseLock();}
}
function health_(){let ready=false;try{const pepper=PropertiesService.getScriptProperties().getProperty('ADMIN_PEPPER');const admins=rows_('admin',ADMIN_HEADERS);ready=!!pepper&&admins.some(r=>/^hmac-sha256\$[a-f0-9-]+\$[a-f0-9]{64}$/.test(String(r[1]||'')))&&projects_().length>=5&&!!database_().getSheetByName('site_content');}catch(_){ready=false;}return json_({ok:true,service:'Linggau AI Studio',version:4,features:['mediaLibrary','mediaExternalUrl','mediaUploadGitHub','mediaArchive','mediaRestore'],ready:ready});}
function doGet(e){try{const action=(e&&e.parameter&&e.parameter.action)||'projects';if(action==='projects')return json_(publicData_());if(action==='health')return health_();return json_({ok:false,error:'Aksi tidak tersedia.'});}catch(err){return json_({ok:false,error:'Database belum siap. Jalankan setupDatabase.'});}}
function session_(token){if(typeof token!=='string'||token.length>200)throw Error('Sesi berakhir. Login kembali.');const s=CacheService.getScriptCache().get('session:'+digest_(token));if(!s)throw Error('Sesi berakhir. Login kembali.');return JSON.parse(s);}
function login_(b){
 const props=PropertiesService.getScriptProperties(),now=Date.now();
 let state=JSON.parse(props.getProperty('LOGIN_RATE')||'{"since":0,"count":0}');if(now-state.since>900000)state={since:now,count:0};
 if(state.count>=10)throw Error('Terlalu banyak percobaan. Coba lagi dalam 15 menit.');state.count++;props.setProperty('LOGIN_RATE',JSON.stringify(state));
 const email=typeof b.email==='string'?b.email.toLowerCase().trim():'';const pass=typeof b.password==='string'?b.password:'';
 if(pass.length>200)throw Error('Email atau password salah.');
 const row=rows_('admin',ADMIN_HEADERS).find(r=>String(r[0]).toLowerCase()===email);const a=String(row?row[1]:'').split('$');
 if(a[0]!=='hmac-sha256'||!equal_(sign_(digest_((a[1]||'invalid')+'\0'+pass)),a[2]||''))throw Error('Email atau password salah.');
 props.deleteProperty('LOGIN_RATE');const token=Utilities.getUuid()+Utilities.getUuid();
 CacheService.getScriptCache().put('session:'+digest_(token),JSON.stringify({email:email}),7200);
 return {ok:true,token:token,name:String(row[2]),expiresIn:7200};
}
function saveProject_(b){
 session_(b.token);const current=publicData_();if(b.expectedRevision!==current.revision)throw Error('Data telah berubah. Muat ulang daftar proyek sebelum menyimpan.');
 const p=b.project||{};const id=text_(p.id,1,60,'ID');if(!/^[a-z0-9][a-z0-9-]*$/.test(id))throw Error('ID hanya huruf kecil, angka, dan tanda hubung.');
 const clean={id:id,nama:text_(p.nama,2,120,'Nama'),kategori:text_(p.kategori,2,80,'Kategori'),peek_text:text_(p.peek_text,3,250,'Ringkasan'),deskripsi:text_(p.deskripsi,10,6000,'Deskripsi'),thumbnail:validUrl_(text_(p.thumbnail,1,1500,'Gambar'),true),link:validUrl_(text_(p.link,1,1500,'Link'),false),featured_ring:p.featured_ring===true};
 if(clean.featured_ring&&current.projects.filter(x=>x.id!==id&&x.featured_ring).length>=5)throw Error('Maksimal lima proyek utama. Nonaktifkan salah satunya terlebih dahulu.');
 const index=current.projects.findIndex(x=>x.id===id);if(index<0&&current.projects.length>=500)throw Error('Batas 500 proyek tercapai.');
 const sh=sheet_('projects',PROJECT_HEADERS),row=PROJECT_HEADERS.map(k=>k==='featured_ring'?clean[k]:literal_(clean[k]));
 // Resolve actual row, including blank rows, instead of relying on a filtered index.
 const actual=rows_('projects',PROJECT_HEADERS).findIndex(r=>String(r[0])===id);
 sh.getRange(actual<0?sh.getLastRow()+1:actual+2,1,1,8).setValues([row]);SpreadsheetApp.flush();return publicData_();
}
function lead_(b){
 if(b.website)throw Error('Permintaan tidak valid.');if(b.consent!==true)throw Error('Persetujuan penyimpanan diperlukan.');
 const id=text_(b.requestId,20,80,'ID pesan');if(!/^[a-zA-Z0-9-]+$/.test(id))throw Error('ID pesan tidak valid.');
 const sh=sheet_('leads',LEAD_HEADERS);if(sh.getLastRow()>1&&sh.getRange(2,1,sh.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext())return {ok:true,id:id,duplicate:true};
 const nama=text_(b.nama,2,100,'Nama'),wa=text_(b.whatsapp,8,25,'WhatsApp'),need=text_(b.kebutuhan,2,100,'Kebutuhan'),pesan=text_(b.pesan,10,3000,'Pesan');if(!/^[+0-9 ()-]+$/.test(wa))throw Error('Nomor WhatsApp tidak valid.');
 const now=Date.now();if(!Number.isFinite(b.startedAt)||now-b.startedAt<2000||now-b.startedAt>86400000)throw Error('Muat ulang halaman, kemudian kirim pesan kembali.');
 const cache=CacheService.getScriptCache(),phoneKey='lead:'+digest_(wa.replace(/\D/g,''));if(cache.get(phoneKey))throw Error('Mohon tunggu satu menit sebelum mengirim pesan berikutnya.');
 const props=PropertiesService.getScriptProperties(),day=Utilities.formatDate(new Date(),'Asia/Jakarta','yyyy-MM-dd');let quota=JSON.parse(props.getProperty('LEAD_QUOTA')||'{}');if(quota.day!==day)quota={day:day,count:0};if(quota.count>=100)throw Error('Form sedang penuh. Hubungi melalui WhatsApp.');
 sh.appendRow([id,literal_(nama),literal_(wa),literal_(need),literal_(pesan),new Date().toISOString()]);quota.count++;props.setProperty('LEAD_QUOTA',JSON.stringify(quota));cache.put(phoneKey,'1',60);SpreadsheetApp.flush();return {ok:true,id:id};
}

/** CMS v2: public content is plain text; HTML, scripts and executable templates are not accepted. */
function checkSiteContent_(input){
 if(!input||Array.isArray(input)||typeof input!=='object')throw Error('Konten tidak valid.');
 const allowed=/^(seo|nav|hero|about|process|skills|contact|form|footer|case|character|theme)\.[a-zA-Z0-9_.-]{1,70}$/;
 const entries=Object.entries(input);
 if(entries.length>180)throw Error('Jumlah field melebihi batas.');
 const result={};let total=0;
 for(const [key,raw] of entries){
  if(!allowed.test(key)||typeof raw!=='string')throw Error('Field konten tidak dikenal.');
  const value=raw.trim(),max=key.includes('paragraph')||key.includes('.bio')||key.includes('.desc')||key.includes('.body')?6000:1500;
  if(value.length>max)throw Error('Teks terlalu panjang: '+key);
  if((key.startsWith('theme.')&&!['theme.bodyFont','theme.headingFont'].includes(key)||/^skills\.color\d+$/.test(key))&&!/^#[0-9a-fA-F]{6}$/.test(value))throw Error('Format warna harus #RRGGBB.');
  if(['theme.bodyFont','theme.headingFont'].includes(key)&&!['Geist','Plus Jakarta Sans','Instrument Serif'].includes(value))throw Error('Pilihan font tidak didukung.');
  if(key==='character.mode'&&!['animated','static','hidden'].includes(value))throw Error('Mode karakter tidak dikenal.');
  if(key==='character.scale'&&(!/^\d{2,3}$/.test(value)||+value<60||+value>140))throw Error('Ukuran karakter 60–140%.');
  if(key==='character.offset'&&(!/^-?\d{1,2}$/.test(value)||+value< -40||+value>40))throw Error('Posisi karakter -40 hingga 40.');
  if(/^contact\.tile[1-5]Icon$/.test(key)&&!/^#i-(claude|figma|perplexity|codex|notebooklm|openai|midjourney|gmail|linkedin)$/.test(value))throw Error('Pilihan ikon tidak dikenal.');
  if(key==='contact.email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw Error('Email tidak valid.');
  if(key==='contact.whatsapp'&&!/^\d{9,16}$/.test(value))throw Error('Nomor WhatsApp harus kode negara dan angka saja.');
  if(key.endsWith('.image')||key.endsWith('.thumbnail')||key==='hero.waveImage'||key==='seo.ogImage'){
   if(key!=='seo.ogImage'&&!value)throw Error('URL gambar wajib diisi.');if(value)validUrl_(value,true);
   if(key==='character.image'&&!/^(?:\.\/)?assets\/[a-zA-Z0-9._/-]+$/.test(value)&&!/^https:\/\//.test(value))throw Error('Gambar karakter tidak valid.');
  }
  if(key.endsWith('.url')||key.endsWith('.link')||key==='hero.ctaUrl'){
   if(!value)throw Error('URL tautan wajib diisi.');
   if(key==='hero.ctaUrl'&&/^#(?:contact|about|work)$/.test(value)){}
   else validUrl_(value,false);
  }
  total+=key.length+value.length;if(total>38000)throw Error('Ukuran konten terlalu besar.');
  result[key]=value;
 }
 return result;
}
function writeSite_(content,editor){
 const sh=sheet_('site_content',['key','value','updated_at']);
 const prior=siteState_(),history=sheet_('site_history',['id','tanggal','admin','snapshot_json']);
 const snapshot=JSON.stringify(prior.content);
 if(snapshot.length>49000)throw Error('Riwayat konten terlalu besar untuk satu sel.');
 const timestamp=new Date().toISOString();
 history.appendRow([Utilities.getUuid(),timestamp,literal_(editor),literal_(snapshot)]);
 const rows=Object.entries(content).sort((a,b)=>a[0].localeCompare(b[0])).map(([key,value])=>[literal_(key),literal_(value),timestamp]);
 const oldCount=Math.max(0,sh.getLastRow()-1);
 if(rows.length>0)sh.getRange(2,1,rows.length,3).setValues(rows);
 if(oldCount>rows.length)sh.getRange(rows.length+2,1,oldCount-rows.length,3).clearContent();
 SpreadsheetApp.flush();
 return publicData_();
}
function saveSite_(b){
 const editor=session_(b.token);
 const current=siteState_();
 if(typeof b.expectedSiteRevision!=='string'||b.expectedSiteRevision!==current.siteRevision)throw Error('Konten telah berubah di perangkat lain. Muat ulang dahulu.');
 return writeSite_(checkSiteContent_(b.content),editor.email);
}
function revertSite_(b){
 const editor=session_(b.token),cur=siteState_();
 if(b.expectedSiteRevision!==cur.siteRevision)throw Error('Konten telah berubah. Muat ulang dahulu.');
 const history=sheet_('site_history',['id','tanggal','admin','snapshot_json']);
 if(history.getLastRow()<2)throw Error('Belum ada versi sebelumnya.');
 const last=history.getRange(history.getLastRow(),1,1,4).getValues()[0];
 const restored=checkSiteContent_(JSON.parse(String(last[3])));
 history.deleteRow(history.getLastRow());
 // Store the current version as the new rollback target.
 return writeSite_(restored,editor.email);
}

function doPost(e){
 let lock;
 try{
  if(!e||!e.postData||e.postData.contents.length>1450000)throw Error('Permintaan terlalu besar.');const b=JSON.parse(e.postData.contents);if(b.action!=='mediaUpload'&&e.postData.contents.length>100000)throw Error('Permintaan tidak valid.');
  lock=LockService.getScriptLock();lock.waitLock(15000);let result;
  switch(b.action){case 'login':result=login_(b);break;case 'saveProject':result=saveProject_(b);break;case 'workspaceOverview':result=workspaceOverview_(b);break;case 'workspaceLeads':result=workspaceLeads_(b);break;case 'workspaceSaveLead':result=workspaceSaveLead_(b);break;case 'workspaceArchiveProject':result=workspaceArchiveProject_(b);break;case 'workspaceArchivedProjects':result=workspaceArchivedProjects_(b);break;case 'workspaceRestoreProject':result=workspaceRestoreProject_(b);break;case 'workspaceHistory':result=workspaceHistory_(b);break;case 'workspaceRestoreHistory':result=workspaceRestoreHistory_(b);break;case 'mediaList':result=mediaList_(b);break;case 'mediaSave':result=mediaSave_(b);break;case 'mediaArchive':result=mediaArchive_(b);break;case 'mediaRestore':result=mediaRestore_(b);break;case 'mediaUpload':result=mediaUpload_(b);break;case 'contentList':result=contentList_(b);break;case 'contentSave':result=contentSave_(b);break;case 'contentArchive':result=contentArchive_(b);break;case 'contentRestore':result=contentRestore_(b);break;case 'saveSite':result=saveSite_(b);break;case 'revertSite':result=revertSite_(b);break;case 'lead':result=lead_(b);break;case 'logout':session_(b.token);CacheService.getScriptCache().remove('session:'+digest_(b.token));result={ok:true};break;default:throw Error('Aksi tidak tersedia.');}
  return json_(result);
 }catch(err){return json_({ok:false,error:String(err.message||'Permintaan gagal.').slice(0,200)});}finally{if(lock)lock.releaseLock();}
}

/** Admin workspace API v3. All handlers require an active server-side session. */
const LEAD_META_HEADERS=['lead_id','status','catatan','updated_at'];
const ARCHIVE_HEADERS=PROJECT_HEADERS.concat(['archived_at','archived_by']);
const WORKSPACE_STATUSES=['baru','diproses','selesai','arsip'];

function workspaceMeta_(){
 const rows=rows_('lead_meta',LEAD_META_HEADERS),result={};
 rows.filter(row=>row[0]).forEach(row=>{
  const status=String(row[1]);
  result[String(row[0])]={status:WORKSPACE_STATUSES.includes(status)?status:'baru',catatan:String(row[2]||''),updated_at:String(row[3]||'')};
 });
 return result;
}
function workspaceOverview_(b){
 const account=session_(b.token),meta=workspaceMeta_();
 const leads=rows_('leads',LEAD_HEADERS).filter(r=>r[0]);
 const stats={baru:0,diproses:0,selesai:0,arsip:0};
 leads.forEach(r=>{const status=meta[String(r[0])]?.status||'baru';stats[status]++;});
 const projects=projects_();
 return {ok:true,account:{email:account.email},projects:projects.length,featured:projects.filter(p=>p.featured_ring).length,leads:leads.length,leadStats:stats,archivedProjects:rows_('project_archive',ARCHIVE_HEADERS).filter(r=>r[0]).length,siteRevision:siteState_().siteRevision};
}
function workspaceLeads_(b){
 session_(b.token);
 const page=Math.max(1,Math.min(100000,Number.parseInt(b.page,10)||1));
 const limit=Math.max(5,Math.min(30,Number.parseInt(b.limit,10)||12));
 const status=String(b.status||'semua');
 if(status!=='semua'&&!WORKSPACE_STATUSES.includes(status))throw Error('Status tidak valid.');
 const q=String(b.search||'').trim().toLowerCase().slice(0,100),meta=workspaceMeta_();
 const matches=rows_('leads',LEAD_HEADERS).filter(r=>r[0]).reverse().map(r=>{
  const entry=meta[String(r[0])]||{status:'baru',catatan:'',updated_at:''};
  return {id:String(r[0]),nama:String(r[1]||''),whatsapp:String(r[2]||''),kebutuhan:String(r[3]||''),pesan:String(r[4]||''),tanggal:String(r[5]||''),status:entry.status,catatan:entry.catatan,updated_at:entry.updated_at};
 }).filter(x=>(status==='semua'||x.status===status)&&(!q||[x.nama,x.whatsapp,x.kebutuhan,x.pesan].some(v=>v.toLowerCase().includes(q))));
 const total=matches.length,pages=Math.max(1,Math.ceil(total/limit)),current=Math.min(page,pages);
 return {ok:true,items:matches.slice((current-1)*limit,current*limit),page:current,pages,total,limit};
}
function workspaceSaveLead_(b){
 const account=session_(b.token),id=text_(b.id,8,100,'ID pesan'),status=String(b.status||'');
 if(!WORKSPACE_STATUSES.includes(status))throw Error('Status tidak valid.');
 const note=text_(String(b.catatan||''),0,2000,'Catatan');
 if(!rows_('leads',LEAD_HEADERS).some(r=>String(r[0])===id))throw Error('Pesan tidak ditemukan.');
 const sh=sheet_('lead_meta',LEAD_META_HEADERS);
 const existing=rows_('lead_meta',LEAD_META_HEADERS).findIndex(r=>String(r[0])===id);
 const row=existing<0?sh.getLastRow()+1:existing+2;
 sh.getRange(row,1,1,4).setValues([[id,status,literal_(note),new Date().toISOString()]]);
 SpreadsheetApp.flush();return {ok:true,id,status,editor:account.email};
}
function workspaceArchiveProject_(b){
 const account=session_(b.token),id=text_(b.id,1,60,'ID'),data=publicData_();
 if(b.expectedRevision!==data.revision)throw Error('Daftar proyek berubah. Muat ulang terlebih dahulu.');
 if(data.projects.length<=1)throw Error('Simpan minimal satu proyek aktif.');
 const source=rows_('projects',PROJECT_HEADERS),idx=source.findIndex(r=>String(r[0])===id);
 if(idx<0)throw Error('Proyek tidak ditemukan.');
 const archive=sheet_('project_archive',ARCHIVE_HEADERS);
 if(rows_('project_archive',ARCHIVE_HEADERS).some(r=>String(r[0])===id))throw Error('Proyek sudah ada di arsip.');
 archive.appendRow([...source[idx],new Date().toISOString(),literal_(account.email)]);
 sheet_('projects',PROJECT_HEADERS).deleteRow(idx+2);SpreadsheetApp.flush();
 return {...publicData_(),archivedId:id};
}
function workspaceArchivedProjects_(b){
 session_(b.token);
 const page=Math.max(1,Number.parseInt(b.page,10)||1),limit=Math.min(30,Math.max(5,Number.parseInt(b.limit,10)||12));
 const q=String(b.search||'').toLowerCase().trim().slice(0,100);
 const items=rows_('project_archive',ARCHIVE_HEADERS).filter(r=>r[0]).reverse().map(r=>{
  const item=Object.fromEntries(ARCHIVE_HEADERS.map((k,i)=>[k,String(r[i]||'')]));
  item.featured_ring=item.featured_ring==='true'||item.featured_ring==='TRUE';
  return item;
 }).filter(p=>!q||p.nama.toLowerCase().includes(q)||p.id.toLowerCase().includes(q));
 const total=items.length,pages=Math.max(1,Math.ceil(total/limit)),actual=Math.min(page,pages);
 return {ok:true,items:items.slice((actual-1)*limit,actual*limit),total,page:actual,pages};
}
function workspaceRestoreProject_(b){
 session_(b.token);
 const data=publicData_(),id=text_(b.id,1,60,'ID');
 if(b.expectedRevision!==data.revision)throw Error('Daftar proyek berubah. Muat ulang terlebih dahulu.');
 if(data.projects.some(p=>p.id===id))throw Error('Proyek dengan ID tersebut sudah aktif.');
 const archive=sheet_('project_archive',ARCHIVE_HEADERS),items=rows_('project_archive',ARCHIVE_HEADERS);
 const index=items.findIndex(r=>String(r[0])===id);
 if(index<0)throw Error('Proyek tidak ditemukan dalam arsip.');
 const project=items[index].slice(0,PROJECT_HEADERS.length);
 if(project[7]===true&&data.projects.filter(p=>p.featured_ring).length>=5)project[7]=false;
 const sh=sheet_('projects',PROJECT_HEADERS);
 sh.getRange(sh.getLastRow()+1,1,1,8).setValues([project]);
 archive.deleteRow(index+2);SpreadsheetApp.flush();
 return {...publicData_(),restoredId:id};
}
function workspaceHistory_(b){
 session_(b.token);
 const rows=rows_('site_history',['id','tanggal','admin','snapshot_json']).filter(r=>r[0]).reverse();
 const limit=10,page=Math.max(1,Number.parseInt(b.page,10)||1),pages=Math.max(1,Math.ceil(rows.length/limit)),actual=Math.min(page,pages);
 return {ok:true,items:rows.slice((actual-1)*limit,actual*limit).map(r=>({id:String(r[0]),tanggal:String(r[1]),admin:String(r[2])})),total:rows.length,pages,page:actual};
}
function workspaceRestoreHistory_(b){
 const account=session_(b.token),id=text_(b.id,8,100,'ID versi'),state=siteState_();
 if(b.expectedSiteRevision!==state.siteRevision)throw Error('Halaman telah berubah. Muat ulang sebelum memulihkan.');
 const sh=sheet_('site_history',['id','tanggal','admin','snapshot_json']),rows=rows_('site_history',['id','tanggal','admin','snapshot_json']);
 const hit=rows.find(r=>String(r[0])===id);
 if(!hit)throw Error('Riwayat versi tidak ditemukan.');
 const restored=checkSiteContent_(JSON.parse(String(hit[3])));
 return writeSite_(restored,account.email);
}



/* Dynamic public content blocks: optional rows; no existing page section is
   removed or replaced. Titles, description and URLs are all text-only. */
const CONTENT_HEADERS=['id','title','body','image_url','button_text','button_url','sort_order','status','created_at','updated_at'];
function contentRows_(){return rows_('content_blocks',CONTENT_HEADERS).filter(r=>r[0]);}
function contentObject_(row){return Object.fromEntries(CONTENT_HEADERS.map((k,i)=>[k,String(row[i]??'')]));}
function publishedBlocks_(){
 return contentRows_().filter(r=>String(r[7])==='active').map(contentObject_)
  .sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)||a.created_at.localeCompare(b.created_at))
  .slice(0,60);
}
function contentList_(b){
 session_(b.token);
 const status=['all','active','draft','archived'].includes(b.status)?b.status:'all';
 const q=String(b.search||'').toLowerCase().slice(0,100);
 const page=Math.max(1,Math.min(100000,parseInt(b.page,10)||1)),limit=Math.min(25,Math.max(5,parseInt(b.limit,10)||10));
 const items=contentRows_().map(contentObject_).filter(x=>(status==='all'||x.status===status)&&(!q||[x.title,x.body,x.button_text].some(v=>v.toLowerCase().includes(q))));
 items.sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)||b.updated_at.localeCompare(a.updated_at));
 const pages=Math.max(1,Math.ceil(items.length/limit)),actual=Math.min(page,pages);
 return {ok:true,items:items.slice((actual-1)*limit,actual*limit),total:items.length,pages,page:actual};
}
function contentSave_(b){
 session_(b.token);
 const title=text_(b.title,2,150,'Judul'),body=text_(b.body,5,4000,'Isi konten');
 const image=String(b.image_url||'').trim();if(image)validUrl_(image,true);
 const buttonText=text_(String(b.button_text||''),0,80,'Label tombol');
 const buttonURL=String(b.button_url||'').trim();
 if(buttonURL){if(!buttonText)throw Error('Isi label tombol.');if(!/^#(?:about|work|contact|top)$/.test(buttonURL))validUrl_(buttonURL,false);}
 else if(buttonText)throw Error('Isi URL tombol atau kosongkan label.');
 const status=['active','draft'].includes(b.status)?b.status:'draft';
 const order=Number(b.sort_order);
 if(!Number.isInteger(order)||order<0||order>999)throw Error('Urutan harus angka 0–999.');
 const now=new Date().toISOString(),sh=sheet_('content_blocks',CONTENT_HEADERS),rows=contentRows_();
 const id=b.id?text_(b.id,8,100,'ID konten'):Utilities.getUuid();
 let old=null,idx=-1;
 if(b.id){idx=rows.findIndex(r=>String(r[0])===id);if(idx<0)throw Error('Blok konten tidak ditemukan.');old=rows[idx];
  if(String(old[7])==='archived')throw Error('Pulihkan blok konten terlebih dahulu.');
  if(b.expectedUpdatedAt!==String(old[9]))throw Error('Konten berubah, muat ulang.');}
 if(!old&&rows.length>=500)throw Error('Maksimum 500 blok konten.');
 const row=[id,literal_(title),literal_(body),literal_(image),literal_(buttonText),literal_(buttonURL),order,status,old?old[8]:now,now];
 const oldIndex=b.id?rows_('content_blocks',CONTENT_HEADERS).findIndex(r=>String(r[0])===id):-1;
 sh.getRange(oldIndex<0?sh.getLastRow()+1:oldIndex+2,1,1,10).setValues([row]);SpreadsheetApp.flush();
 return {ok:true,item:contentObject_(row)};
}
function contentArchive_(b){
 session_(b.token);
 const id=text_(b.id,8,100,'ID konten'),all=rows_('content_blocks',CONTENT_HEADERS),idx=all.findIndex(r=>String(r[0])===id);
 if(idx<0||all[idx][7]==='archived')throw Error('Konten tidak ditemukan atau sudah diarsipkan.');
 if(b.expectedUpdatedAt!==String(all[idx][9]))throw Error('Konten berubah, muat ulang.');
 sheet_('content_blocks',CONTENT_HEADERS).getRange(idx+2,8,1,3).setValues([['archived',all[idx][8],new Date().toISOString()]]);
 SpreadsheetApp.flush();return {ok:true,id};
}
function contentRestore_(b){
 session_(b.token);
 const id=text_(b.id,8,100,'ID konten'),all=rows_('content_blocks',CONTENT_HEADERS),idx=all.findIndex(r=>String(r[0])===id);
 if(idx<0||all[idx][7]!=='archived')throw Error('Arsip konten tidak ditemukan.');
 if(b.expectedUpdatedAt!==String(all[idx][9]))throw Error('Konten berubah, muat ulang.');
 sheet_('content_blocks',CONTENT_HEADERS).getRange(idx+2,8,1,3).setValues([['draft',all[idx][8],new Date().toISOString()]]);
 SpreadsheetApp.flush();return {ok:true,id,status:'draft'};
}

/* CMS MEDIA LIBRARY V4.
   GitHub is the canonical public image host. Store the fine-grained GitHub PAT
   only in GAS Script Properties under MEDIA_GITHUB_TOKEN.
   Repository contents permissions: Read and write, this repository only. */
const MEDIA_HEADERS=['id','title','kind','url','alt_text','github_path','github_sha','created_at','updated_at','status'];
const MEDIA_REPO='cuan74468-ux/cuan74468-ux.github.io';
const MEDIA_UPLOAD_LIMIT=900000; // decoded bytes: small thumbnails/portraits only
function mediaRows_(){return rows_('media_library',MEDIA_HEADERS);}
function mediaPublic_(row){return Object.fromEntries(MEDIA_HEADERS.filter(k=>k!=='github_sha').map(k=>[k,String(row[MEDIA_HEADERS.indexOf(k)]||'')]));}
function mediaLive_(row){return row&&String(row[9])==='active';}
function mediaList_(b){
 session_(b.token);
 const page=Math.max(1,Math.min(10000,parseInt(b.page,10)||1));
 const limit=Math.max(6,Math.min(30,parseInt(b.limit,10)||12));
 const search=String(b.search||'').trim().toLowerCase().slice(0,120);
 const status=['active','archived','all'].includes(b.status)?b.status:'active';
 const rows=mediaRows_().filter(r=>r[0]).reverse().filter(r=>(status==='all'||r[9]===status)&&(!search||[r[1],r[3],r[4]].some(v=>String(v||'').toLowerCase().includes(search))));
 const total=rows.length,pages=Math.max(1,Math.ceil(total/limit)),current=Math.min(page,pages);
 return {ok:true,items:rows.slice((current-1)*limit,current*limit).map(mediaPublic_),total,pages,page:current,limit,
  uploadConfigured:!!PropertiesService.getScriptProperties().getProperty('MEDIA_GITHUB_TOKEN')};
}
function mediaSave_(b){
 session_(b.token);
 const title=text_(b.title,2,120,'Judul media');
 const alt=text_(typeof b.alt_text==='string'?b.alt_text:'',0,250,'Teks alternatif');
 const sh=sheet_('media_library',MEDIA_HEADERS),rows=mediaRows_();
 const now=new Date().toISOString();
 if(!b.id){
  const url=validUrl_(text_(b.url,8,1500,'URL media'),true);
  if(!/^https:\/\//.test(url)&&!/^(?:\.\/)?assets\//.test(url))throw Error('Gunakan URL HTTPS atau aset lokal.');
  const id=Utilities.getUuid();
  sh.appendRow([id,literal_(title),'external',literal_(url),literal_(alt),'','',now,now,'active']);
  SpreadsheetApp.flush();return {ok:true,item:mediaPublic_(rows_('media_library',MEDIA_HEADERS).slice(-1)[0])};
 }
 const id=text_(b.id,8,100,'ID media'),idx=rows.findIndex(r=>String(r[0])===id);
 if(idx<0)throw Error('Media tidak ditemukan.');
 const row=rows[idx];if(row[9]!=='active')throw Error('Pulihkan media sebelum mengedit.');
 if(b.expectedUpdatedAt!==String(row[8]))throw Error('Media sudah berubah. Muat ulang daftar.');
 let url=String(row[3]);
 if(row[2]==='external')url=validUrl_(text_(b.url,8,1500,'URL media'),true);
 const updated=[row[0],literal_(title),row[2],literal_(url),literal_(alt),row[5],row[6],row[7],now,'active'];
 sh.getRange(idx+2,1,1,MEDIA_HEADERS.length).setValues([updated]);
 SpreadsheetApp.flush();return {ok:true,item:mediaPublic_(updated)};
}
function mediaUsedBy_(url){
 const usage=[];
 const current=projects_(),archived=rows_('project_archive',ARCHIVE_HEADERS);
 if(current.some(p=>p.thumbnail===url))usage.push('proyek aktif');
 if(archived.some(r=>String(r[5])===url))usage.push('arsip proyek');
 const state=siteState_();
 if(Object.values(state.content).includes(url))usage.push('konten website');
 if(contentRows_().some(r=>String(r[3])===url&&r[7]!=='archived'))usage.push('blok konten');
 return usage;
}
function mediaArchive_(b){
 session_(b.token);
 const id=text_(b.id,8,100,'ID media'),sh=sheet_('media_library',MEDIA_HEADERS);
 const rows=mediaRows_(),idx=rows.findIndex(r=>String(r[0])===id);
 if(idx<0)throw Error('Media tidak ditemukan.');
 const row=rows[idx];if(row[9]!=='active')throw Error('Media sudah diarsipkan.');
 if(b.expectedUpdatedAt!==String(row[8]))throw Error('Daftar media berubah. Muat ulang.');
 const usage=mediaUsedBy_(String(row[3]));
 if(usage.length)throw Error('Media masih dipakai di '+usage.join(', ')+'. Ganti referensinya lalu arsipkan.');
 sh.getRange(idx+2,9,1,2).setValues([[new Date().toISOString(),'archived']]);
 SpreadsheetApp.flush();return {ok:true,id,archived:true};
}
function mediaRestore_(b){
 session_(b.token);
 const id=text_(b.id,8,100,'ID media'),sh=sheet_('media_library',MEDIA_HEADERS);
 const rows=mediaRows_(),idx=rows.findIndex(r=>String(r[0])===id);
 if(idx<0||rows[idx][9]!=='archived')throw Error('Media arsip tidak ditemukan.');
 if(b.expectedUpdatedAt!==String(rows[idx][8]))throw Error('Daftar media berubah. Muat ulang.');
 sh.getRange(idx+2,9,1,2).setValues([[new Date().toISOString(),'active']]);
 SpreadsheetApp.flush();return {ok:true,id,restored:true};
}
function mediaGitHub_ (method,path,body,token){
 const api='https://api.github.com/repos/'+MEDIA_REPO+'/contents/'+path;
 const options={method,contentType:'application/json',muteHttpExceptions:true,headers:{
  'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,
  'X-GitHub-Api-Version':'2022-11-28','User-Agent':'linggau-ai-studio-gas'
 }};
 if(body)options.payload=JSON.stringify(body);
 const response=UrlFetchApp.fetch(api,options),status=response.getResponseCode();
 let data={};try{data=JSON.parse(response.getContentText());}catch(_){}
 if(status<200||status>=300)throw Error(status===401||status===403?'GitHub menolak akses. Periksa MEDIA_GITHUB_TOKEN dan izin Contents: Read and write.':'Upload GitHub gagal (HTTP '+status+').');
 return data;
}
function mediaUpload_(b){
 session_(b.token);
 const token=PropertiesService.getScriptProperties().getProperty('MEDIA_GITHUB_TOKEN');
 if(!token)throw Error('Upload belum diaktifkan. Isi Script Property MEDIA_GITHUB_TOKEN dengan fine-grained token GitHub.');
 const title=text_(b.title,2,120,'Judul media'),alt=text_(String(b.alt_text||''),0,250,'Teks alternatif');
 const mime=String(b.mime||''),extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
 const ext=extensions[mime];if(!ext)throw Error('Hanya JPG, PNG, WebP, atau GIF yang diizinkan. SVG tidak diterima lewat upload.');
 const base64=String(b.base64||'');
 if(!base64||base64.length>Math.ceil(MEDIA_UPLOAD_LIMIT/3)*4+8||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))throw Error('Ukuran/format unggahan tidak valid (maksimal 900 KB).');
 const bytes=Utilities.base64Decode(base64);
 if(bytes.length<32||bytes.length>MEDIA_UPLOAD_LIMIT)throw Error('Gambar maksimal 900 KB.');
 const first=bytes.slice(0,16).map(x=>x&255);
 const correct=(mime==='image/png'&&first.slice(0,8).join(',')==='137,80,78,71,13,10,26,10')||
  (mime==='image/jpeg'&&first[0]===255&&first[1]===216&&first[2]===255)||
  (mime==='image/gif'&&String.fromCharCode(...first.slice(0,3))==='GIF')||
  (mime==='image/webp'&&String.fromCharCode(...first.slice(0,4))==='RIFF'&&String.fromCharCode(...first.slice(8,12))==='WEBP');
 if(!correct)throw Error('Isi berkas tidak cocok dengan format gambar.');
 const path='assets/uploads/'+Utilities.getUuid().replace(/-/g,'')+'.'+ext;
 const data=mediaGitHub_('put',path,{message:'media: upload via protected CMS',content:base64,branch:'main'},token);
 if(!data.content||!data.content.sha)throw Error('GitHub tidak mengembalikan checksum file unggahan.');
 const now=new Date().toISOString(),id=Utilities.getUuid(),url=path;
 const row=[id,literal_(title),'upload',url,literal_(alt),path,String(data.content.sha),now,now,'active'];
 sheet_('media_library',MEDIA_HEADERS).appendRow(row);SpreadsheetApp.flush();
 return {ok:true,item:mediaPublic_(row),publication:'GitHub menerima file. Tunggu deployment Pages sebelum gambar tampil di website.'};
}

/** Run in the editor after deployment. Copy the printed JSON into the repository's config.json. */
function getFrontendConfig(){const url=ScriptApp.getService().getUrl();if(!url)throw Error('Deploy sebagai Web app terlebih dahulu.');console.log(JSON.stringify({gasUrl:url,spreadsheetUrl:database_().getUrl()},null,2));}

const DEFAULT_PROJECTS = [{"id": "umkm-pos", "nama": "UMKM Juara POS (Kasir Sederhana)", "kategori": "WebApp UMKM", "peek_text": "Aplikasi Kasir Ringan • Supabase & Cetak Struk Thermal Bluetooth", "deskripsi": "Aplikasi Point of Sale yang telah dibersihkan total dari over-engineering desktop menjadi POS sederhana yang super ringan, stabil di HP/Tablet Android, dan terhubung langsung ke printer thermal Bluetooth (Smartcom RPP02N via RawBT).", "thumbnail": "assets/proyek-pos-sederhana.jpg", "link": "https://wa.me/6289509016792?text=Halo%20Bang%20Ferry,%20saya%20ingin%20coba%20demo%20UMKM%20Juara%20POS", "featured_ring": true}, {"id": "ai-photo", "nama": "AI Commercial Product Photography", "kategori": "AI Creative", "peek_text": "Visual Produk F&B & Kemasan UMKM Sekelas Studio Profesional", "deskripsi": "Mengubah foto produk UMKM sederhana dari kamera HP menjadi visual iklan komersial dramatis (seperti efek splash madu sinematik dan roti keju hangat) siap tayang untuk katalog digital dan media sosial.", "thumbnail": "assets/ai-photography-cover.svg", "link": "https://wa.me/6289509016792?text=Halo%20Bang%20Ferry,%20saya%20tertarik%20layanan%20Foto%20Produk%20AI", "featured_ring": true}, {"id": "kurir-juara", "nama": "Kurir Juara & Katalog Merchant", "kategori": "Logistik Lokal", "peek_text": "Platform Pengiriman Lokal, Katalog Kuliner, & Jastip Terintegrasi WA", "deskripsi": "Ekosistem katalog digital merchant lokal dan layanan pengantaran/jastip daerah yang memudahkan warga memesan produk UMKM langsung terhubung ke WhatsApp kurir dan toko.", "thumbnail": "assets/kurir-juara.jpg", "link": "https://wa.me/6289509016792?text=Halo%20Bang%20Ferry,%20mau%20tanya%20sistem%20Kurir%20Juara%20%26%20Katalog", "featured_ring": true}, {"id": "ebook-lms", "nama": "Ebook Vibe Coder & 1-Page LMS", "kategori": "Edukasi Digital", "peek_text": "Panduan Praktis Merakit WebApp Modern Tanpa Latar Belakang IT", "deskripsi": "Kurikulum belajar mandiri, Ebook Vibe Coder Otodidak, dan modul Komunitas Ngulik Digital untuk membantu pemilik usaha menguasai kolaborasi Multi-AI dan arsitektur aplikasi gratis.", "thumbnail": "assets/ebook-lms.jpg", "link": "https://wa.me/6289509016792?text=Halo%20Bang%20Ferry,%20saya%20mau%20akses%20Ebook%20Vibe%20Coder%20%26%20LMS", "featured_ring": true}, {"id": "zero-cost-stack", "nama": "40+ Demo WebApp & Template GAS", "kategori": "Template WebApp", "peek_text": "Katalog Aplikasi Kasir, Absensi WA Fonnte, & Template Siap Duplikasi", "deskripsi": "Koleksi 40+ aplikasi web siap pakai dan 4 Blueprint Skill AI (GitHub Pages + GAS, Full GAS PWA, Supabase, Firebase) yang membebaskan UMKM dari tagihan server bulanan.", "thumbnail": "assets/proyek-smartlink.jpg", "link": "https://wa.me/6289509016792?text=Halo%20Bang%20Ferry,%20saya%20ingin%20lihat%2040%2B%20Demo%20WebApp%20%26%20Template", "featured_ring": true}];
