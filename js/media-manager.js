/* Media Library V4 — loaded after admin-workspace.js.
   No tokens or GitHub credentials enter this browser module. */
(()=>{
'use strict';
const A=window.STUDIO_ADMIN;if(!A)throw Error('Admin workspace bridge missing.');
const {state,request,toast,el,btn,openDrawer,closeDrawer,drawPager,makeFormField,safeImage,friendlyDate}=A;
const $=selector=>document.querySelector(selector);
let lastSeq=0;
function imageCard(item){
 const c=el('article','media-card'),img=el('img');
 img.alt=item.alt_text||item.title||'Gambar portofolio';img.loading='lazy';
 const src=safeImage(item.url);
 if(src){img.src=src;img.addEventListener('error',()=>{img.hidden=true;c.classList.add('media-broken');});}
 else img.hidden=true;
 c.append(img,el('strong','',item.title||'Gambar tanpa nama'),el('small','',item.url||''));
 return c;
}
async function copyURL(url){
 try{await navigator.clipboard.writeText(url);toast('Alamat gambar disalin.');}
 catch{toast('Salin manual: '+url,true);}
}

/** Inventory by place of use, rather than de-duplicating by file URL.
    This section intentionally works even if the V4 media library is unavailable. */
function usedMedia(){
 const root=$('#mediaUsedGrid');root.replaceChildren();
 const slots=state.projects.map(p=>({
   kind:'project',id:p.id,title:p.nama,location:'Thumbnail karya / cincin portofolio',url:p.thumbnail
 }));
 slots.push({
   kind:'site',key:'character.image',title:'Karakter utama',
   location:'Hero · figur di sebelah judul',
   url:state.siteContent['character.image']||state.defaults['character.image']||'assets/char.webp'
 },{
   kind:'site',key:'hero.waveImage',title:'Ikon sapaan',
   location:'Hero · gambar lambaian',
   url:state.siteContent['hero.waveImage']||state.defaults['hero.waveImage']||'assets/wave.png'
 },{
   kind:'site',key:'seo.ogImage',title:'Gambar pratinjau sosial',
   location:'SEO · media sosial (opsional)',
   url:state.siteContent['seo.ogImage']||state.defaults['seo.ogImage']||''
 });
 for(const item of slots){
   const card=imageCard({...item,alt_text:item.location});
   const badge=el('p','media-type',item.location);
   const actions=el('div','media-actions');
   actions.append(btn(item.url?'Ganti Gambar':'Pasang Gambar','button primary small',()=>replaceActive(item)));
   if(item.url)actions.append(btn('Salin alamat','button subtle small',()=>copyURL(item.url)));
   card.append(badge,actions);
   root.append(card);
 }
 const note=el('p','media-system-heading','Aset sistem lainnya');
 root.append(note);
 for(const [title,url,description] of [
   ['Lapisan laptop','assets/plate.png','Bagian dari animasi Canvas; perubahan file memerlukan pemeriksaan koordinat'],
   ['Tekstur latar','assets/grain.png','Efek dekoratif pada CSS; belum mempunyai pengaturan CMS']
 ]){
   const card=imageCard({title,url});
   card.append(el('p','media-type',description));
   const footer=el('div','media-actions'),link=el('a','button secondary small','Kelola file di GitHub ↗');
   link.href='https://github.com/cuan74468-ux/cuan74468-ux.github.io/tree/main/assets';
   link.target='_blank';link.rel='noopener noreferrer';footer.append(link);card.append(footer);root.append(card);
 }
}
function replaceActive(slot){
 const form=el('form');form.id='replaceActiveImageForm';
 const intro=el('p','drawer-meta','Lokasi penggunaan: '+slot.location);
 const image=imageCard({...slot,title:'Gambar saat ini'});
 image.classList.add('active-image-current');
 form.append(intro,image);
 const label=el('label');label.append(document.createTextNode('Gambar pengganti — URL HTTPS atau path assets/'));
 const input=el('input');input.name='imageURL';input.type='text';input.required=true;
 input.maxLength=1500;input.autocomplete='off';input.value=slot.url||'';
 input.placeholder='assets/gambar-baru.webp atau https://…';
 label.append(input);form.append(label);
 const hint=el('p','drawer-meta',
   'Cara paling sederhana: unggah gambar baru melalui GitHub Web → folder assets → salin path assets/nama-file.webp → tempel di sini. Tidak memerlukan fitur upload GAS V4.');
 form.append(hint);
 const preview=el('img','drawer-preview');preview.alt='Pratinjau gambar pengganti';preview.hidden=true;
 const feedback=el('p','drawer-meta','');
 let imageVerified=false;
 const draw=()=>{
   imageVerified=false;
   const src=safeImage(input.value.trim());preview.hidden=!src;
   if(src){preview.src=src;feedback.textContent='Memeriksa pratinjau gambar…';}
   else feedback.textContent='Masukkan URL gambar HTTPS atau path assets/ yang valid.';
 };
 preview.onload=()=>{imageVerified=true;feedback.textContent='Pratinjau tersedia. Konfirmasi untuk mengganti gambar pada lokasi ini.';};
 preview.onerror=()=>{imageVerified=false;preview.hidden=true;feedback.textContent='Pratinjau gagal. Pastikan URL langsung menuju gambar dan file sudah tersedia di GitHub Pages.';};
 input.addEventListener('input',draw);form.append(preview,feedback);draw();
 if(slot.key==='character.image'){
   const notice=el('p','inline-notice','Karakter pengganti otomatis menggunakan mode statis. Gerakan mata/jari membutuhkan kalibrasi khusus.');
   form.append(notice);
 }
 const github=el('a','button subtle small','Unggah file via GitHub Web ↗');
 github.href='https://github.com/cuan74468-ux/cuan74468-ux.github.io/tree/main/assets';
 github.target='_blank';github.rel='noopener noreferrer';form.append(github);
 const cancel=btn('Batal','button subtle',closeDrawer);
 const choose=btn('Pilih Gambar Lain','button secondary',()=>{
   pick(item=>{input.value=item.url;input.dispatchEvent(new Event('input'));});
 });
 const save=btn('Simpan Gambar','button primary',async()=>{
   if(!form.reportValidity())return;
   const candidate=input.value.trim();
   if(candidate===String(slot.url||'')){toast('Belum ada perubahan gambar.');return;}
   if(!imageVerified&&!confirm('Pratinjau gambar baru belum berhasil dimuat. Jika tetap disimpan, gambar publik mungkin rusak. Lanjutkan?'))return;
   save.disabled=true;
   try{
     const result=await A.saveUsageImage(slot,input.value);
     closeDrawer();usedMedia();
     toast(result.message);
   }catch(error){
     feedback.textContent='Belum tersimpan: '+String(error.message||'Gagal menyimpan gambar.');
     toast(error.message,true);
   }finally{save.disabled=false;}
 });
 openDrawer('Ganti Gambar — '+slot.title,'ASET YANG DIPAKAI',form,[cancel,choose,save]);
}

function card(item){
 const c=imageCard(item);
 c.append(el('div','media-type',(item.kind==='upload'?'GitHub upload':'URL eksternal')+' · '+friendlyDate(item.updated_at)));
 const actions=el('div','media-actions');
 if(item.status==='archived')actions.append(btn('Pulihkan','button secondary small',()=>restore(item)));
 else{
  actions.append(btn('Edit','button secondary small',()=>edit(item)));
  actions.append(btn('Salin','button subtle small',()=>copyURL(item.url)));
  actions.append(btn('Hapus','button danger small',()=>archive(item)));
 }
 c.append(actions);return c;
}
async function load(){
 if(!state.token)return;
 const grid=$('#mediaGrid');if(!grid)return;
 const seq=++lastSeq;
 grid.replaceChildren(el('p','empty-state','Memuat gambar…'));
 usedMedia();
 try{
  const r=await request('mediaList',{token:state.token,page:state.mediaPage,limit:12,search:state.mediaSearch,status:state.mediaFilter});
  if(seq!==lastSeq)return;
  state.media=r.items||[];state.mediaPage=r.page||1;state.mediaPages=r.pages||1;state.mediaTotal=r.total||0;state.mediaUploadConfigured=!!r.uploadConfigured;
  $('#mediaNotice').textContent=state.mediaUploadConfigured
   ?'Upload aktif: JPG, PNG, WebP, GIF hingga 900 KB. Gambar disimpan dalam repository GitHub dan perlu deployment Pages sebelum tampil publik. Hapus dari pustaka = arsip aman, bukan penghapusan permanen file.'
   :'Tambah/edit URL siap digunakan. Untuk upload langsung dari komputer, atur MEDIA_GITHUB_TOKEN pada GAS Script Properties (fine-grained PAT, akses Contents: Read and write khusus repository ini), lalu deploy backend V4.';
  grid.replaceChildren();
  if(!state.media.length)grid.append(el('p','empty-state','Belum ada gambar di pustaka. Tambahkan tautan atau upload gambar pertama.'));
  else state.media.forEach(x=>grid.append(card(x)));
  drawPager($('#mediaPager'),state.mediaPage,state.mediaPages,page=>{state.mediaPage=page;load();});
 }catch(error){
  if(seq!==lastSeq)return;
  grid.replaceChildren(el('p','empty-state','Pustaka media belum aktif: '+error.message));
  $('#mediaNotice').textContent='Pustaka Media V4 belum aktif. Penggantian gambar di bagian “Gambar yang sedang digunakan” tetap bisa dilakukan melalui tautan gambar baru jika API proyek/editor halaman tersedia. Anda tidak perlu reset password.';
 }
}
function edit(item=null){
 const form=el('form');form.id='mediaEditForm';
 form.append(makeFormField('title','Judul / nama media',item?.title||'','text'));
 form.append(makeFormField('alt_text','Alt text / deskripsi aksesibilitas',item?.alt_text||'','text',false));
 if(!item||item.kind==='external')form.append(makeFormField('url','Alamat gambar HTTPS atau path assets/',item?.url||'','text'));
 else form.append(el('p','drawer-meta','Gambar yang sudah diunggah memiliki URL tetap. Untuk mengganti gambar: upload file baru, lalu pilih pada editor konten atau proyek. Metadata dapat diedit.'));
 if(form.elements.url){
  const img=el('img','drawer-preview');img.alt='Pratinjau URL gambar';img.hidden=true;
  const notice=el('p','drawer-meta','Gunakan URL file gambar HTTPS langsung, bukan halaman berbagi Google Drive. Pratinjau akan memeriksa apakah gambar dapat tampil.');
  const check=()=>{const src=safeImage(form.elements.url.value);img.hidden=!src;if(!src){notice.textContent='Masukkan URL HTTPS atau path assets/.';return;}
    notice.textContent='Memeriksa gambar…';img.src=src;};
  img.onload=()=>{notice.textContent='Gambar dapat ditampilkan. Pastikan memiliki izin penggunaan.';};
  img.onerror=()=>{img.hidden=true;notice.textContent='Gambar tidak dapat ditampilkan. Periksa link langsung, izin akses, atau batasan hotlink.';};
  form.elements.url.addEventListener('input',check);form.append(img,notice);check();
 }else if(item){const img=el('img','drawer-preview');img.alt=item.title;img.src=safeImage(item.url);form.append(img);}
 const save=btn(item?'Simpan Perubahan':'Simpan Media URL','button primary',async()=>{
  if(!form.reportValidity())return;save.disabled=true;
  try{
   const data=Object.fromEntries(new FormData(form)),body={token:state.token,title:data.title,alt_text:data.alt_text||''};
   if(!item||item.kind==='external')body.url=data.url;
   if(item){body.id=item.id;body.expectedUpdatedAt=item.updated_at;}
   await request('mediaSave',body);closeDrawer();state.mediaPage=1;await load();
   toast(item?'Media berhasil diperbarui.':'URL media berhasil didaftarkan. Gunakan tombol pilih gambar dalam editor untuk memakainya.');
  }catch(error){toast(error.message,true);}finally{save.disabled=false;}
 });
 openDrawer(item?'Edit Media':'Tambah Link Gambar',item?'EDIT MEDIA':'EXTERNAL URL',form,[btn('Batal','button subtle',closeDrawer),save]);
}
async function archive(item){
 if(!confirm('Hapus "'+item.title+'" dari pustaka aktif?\n\nJika gambar masih dipakai pada proyek/konten yang sudah terbit, sistem akan menolak. File aslinya tidak dihapus sehingga dapat dipulihkan.'))return;
 try{
  await request('mediaArchive',{token:state.token,id:item.id,expectedUpdatedAt:item.updated_at});
  state.mediaPage=1;await load();toast('Media diarsipkan dengan aman.');
 }catch(error){toast(error.message,true);}
}
async function restore(item){
 try{
  await request('mediaRestore',{token:state.token,id:item.id,expectedUpdatedAt:item.updated_at});
  state.mediaFilter='active';$('#mediaFilter').value='active';state.mediaPage=1;await load();toast('Media berhasil dipulihkan.');
 }catch(error){toast(error.message,true);}
}
async function optimize(file){
 if(!file)throw Error('Pilih berkas gambar.');
 if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error('Format tidak didukung. Gunakan JPG, PNG, WebP atau GIF.');
 let output=file,mime=file.type;
 if(file.size>900000){
  if(file.type==='image/gif')throw Error('GIF berukuran lebih dari 900 KB. Kompres GIF secara manual untuk mempertahankan animasi.');
  let image,objectURL=null;
  try{
   if(typeof createImageBitmap==='function')image=await createImageBitmap(file);
   else{
    objectURL=URL.createObjectURL(file);image=await new Promise((resolve,reject)=>{
     const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Gagal membaca gambar.'));img.src=objectURL;
    });
   }
   const width=image.width||image.naturalWidth,height=image.height||image.naturalHeight,scale=Math.min(1,1600/Math.max(width,height));
   const cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(width*scale));cv.height=Math.max(1,Math.round(height*scale));
   const cx=cv.getContext('2d');if(!cx)throw Error('Browser tidak mendukung kompresi gambar.');
   cx.drawImage(image,0,0,cv.width,cv.height);image.close?.();
   let blob=null;
   for(const quality of [.86,.74,.62,.48]){
    blob=await new Promise(resolve=>cv.toBlob(resolve,'image/webp',quality));
    if(blob&&blob.type==='image/webp'&&blob.size<=900000)break;
   }
   if(!blob||blob.type!=='image/webp')throw Error('Gambar belum bisa dikompres. Gunakan gambar WebP < 900 KB.');
   output=blob;mime='image/webp';
  }finally{if(objectURL)URL.revokeObjectURL(objectURL);}
 }
 if(output.size>900000)throw Error('Ukuran maksimal 900 KB setelah dikompres.');
 const base64=await new Promise((resolve,reject)=>{
  const rd=new FileReader();rd.onload=()=>resolve(String(rd.result).split(',')[1]||'');rd.onerror=()=>reject(Error('Berkas gagal dibaca.'));rd.readAsDataURL(output);
 });
 return {mime,base64};
}
function upload(){
 const form=el('form');form.id='mediaUploadForm';
 form.append(makeFormField('title','Nama media','', 'text'));
 form.append(makeFormField('alt_text','Alt text / deskripsi gambar','', 'text',false));
 const lab=el('label');lab.append(document.createTextNode('Gambar dari perangkat'));
 const input=el('input');input.type='file';input.accept='image/jpeg,image/png,image/webp,image/gif';input.required=true;lab.append(input);form.append(lab);
 const message=el('p','drawer-meta','JPG, PNG, WebP, GIF · maksimum 900 KB. Gambar besar dikompres ke WebP; GIF besar harus dikompres sendiri.');
 form.append(message);
 const preview=el('img','drawer-preview');preview.alt='Preview gambar yang akan diunggah';preview.hidden=true;form.append(preview);
 let temp=null;
 input.addEventListener('change',()=>{
  if(temp)URL.revokeObjectURL(temp);
  const file=input.files?.[0];preview.hidden=!file;
  if(file){temp=URL.createObjectURL(file);preview.src=temp;if(!form.elements.title.value)form.elements.title.value=file.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ').slice(0,120);}
 });
 const release=()=>{if(temp)URL.revokeObjectURL(temp);temp=null;};
 const cancel=btn('Batal','button subtle',()=>{release();closeDrawer();});
 const save=btn('Unggah ke GitHub','button primary',async()=>{
  if(!form.reportValidity())return;
  if(!state.mediaUploadConfigured){toast('Upload belum aktif. Konfigurasikan MEDIA_GITHUB_TOKEN di GAS, lalu deploy backend.',true);return;}
  save.disabled=true;
  try{
   message.textContent='Mengoptimasi gambar, lalu mengunggah secara aman…';
   const data=await optimize(input.files?.[0]);
   const r=await request('mediaUpload',{token:state.token,title:form.elements.title.value,alt_text:form.elements.alt_text.value||'',...data});
   release();closeDrawer();state.mediaPage=1;await load();
   toast('GitHub menerima unggahan. Gambar akan tampil ketika deployment Pages selesai.');
  }catch(error){message.textContent=String(error.message||'Upload gagal.');toast(error.message,true);}
  finally{save.disabled=false;}
 });
 openDrawer('Unggah Gambar','GITHUB PAGES ASSET',form,[cancel,save]);
}
function pick(onSelect){
 const wasOpen=!$('#detailDrawer').hidden;
 const previous={title:$('#drawerTitle').textContent,subtitle:$('#drawerEyebrow').textContent,body:[...$('#drawerBody').childNodes],footer:[...$('#drawerFooter').childNodes]};
 const back=()=>{
  if(!wasOpen){closeDrawer();return;}
  openDrawer(previous.title,previous.subtitle,el('div'),[]);
  $('#drawerBody').replaceChildren(...previous.body);$('#drawerFooter').replaceChildren(...previous.footer);
 };
 const wrap=el('div'),search=el('input');search.type='search';search.placeholder='Cari gambar…';search.className='media-picker-search';
 const results=el('div','media-picker-grid'),pager=el('div','pagination');wrap.append(search,results,pager);
 let page=1,q='',timeout=null;
 const render=async()=>{
   results.replaceChildren(el('p','muted','Memuat pilihan gambar…'));
   const candidateMap=new Map();
   const add=item=>{
     if(!safeImage(item.url)||candidateMap.has(item.url))return;
     if(q&&!String(item.title||'').toLowerCase().includes(q.toLowerCase())&&!String(item.url).toLowerCase().includes(q.toLowerCase()))return;
     candidateMap.set(item.url,item);
   };
   // Previously published/project assets remain selectable even without GAS V4.
   for(const project of state.projects)add({title:project.nama,url:project.thumbnail});
   for(const [key,title,fallback] of [
     ['character.image','Karakter utama','assets/char.webp'],
     ['hero.waveImage','Ikon sapaan','assets/wave.png']
   ])add({title,url:state.siteContent[key]||state.defaults[key]||fallback});
   let error='';
   try{
     const r=await request('mediaList',{token:state.token,page,limit:18,search:q,status:'active'});
     (r.items||[]).forEach(add);
     drawPager(pager,r.page||page,r.pages||1,n=>{page=n;render();});
   }catch(e){
     error=String(e.message||'Pustaka media belum aktif.');
     pager.replaceChildren();
   }
   results.replaceChildren();
   for(const item of candidateMap.values()){
     const card=imageCard(item);
     card.append(btn('Gunakan gambar ini','button secondary small',()=>{onSelect(item);back();}));
     results.append(card);
   }
   if(!candidateMap.size)results.append(el('p','empty-state','Tidak ada gambar yang cocok. Tempel URL HTTPS/path assets secara manual.'));
   if(error)results.prepend(el('p','media-picker-note','Pustaka tambahan belum aktif. Gambar yang sudah ada tetap dapat dipilih; atau tempel URL baru. ('+error+')'));
 };
 search.addEventListener('input',()=>{clearTimeout(timeout);timeout=setTimeout(()=>{q=search.value.trim();page=1;render();},300);});
 openDrawer('Pilih Gambar','MEDIA PICKER',wrap,[btn('Kembali','button subtle',back)]);
 render();
}
window.STUDIO_MEDIA={load,edit,upload,pick,usedMedia,replaceActive};
})();