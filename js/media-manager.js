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
function usedMedia(){
 const map=new Map(),put=(url,title)=>{const src=safeImage(url);if(src&&!map.has(src))map.set(src,title);};
 for(const p of state.projects)put(p.thumbnail,p.nama);
 for(const key of ['character.image','hero.waveImage','seo.ogImage'])put(state.draft[key]||state.siteContent[key],key);
 [['assets/char.webp','Karakter utama'],['assets/wave.png','Ilustrasi sapaan'],['assets/plate.png','Laptop'],['assets/grain.png','Tekstur']].forEach(([x,y])=>put(x,y));
 const root=$('#mediaUsedGrid');root.replaceChildren();
 for(const [url,title] of map){
  const card=imageCard({title,url});
  const footer=el('div','media-actions');footer.append(btn('Salin URL','button subtle small',()=>copyURL(url)));card.append(footer);
  root.append(card);
 }
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
  $('#mediaNotice').textContent='Periksa apakah Code.gs V4 sudah di-deploy dan tab media_library sudah dibuat. Login tidak perlu direset.';
 }
}
function edit(item=null){
 const form=el('form');form.id='mediaEditForm';
 form.append(makeFormField('title','Judul / nama media',item?.title||'','text'));
 form.append(makeFormField('alt_text','Alt text / deskripsi aksesibilitas',item?.alt_text||'','text',false));
 if(!item||item.kind==='external')form.append(makeFormField('url','Alamat gambar HTTPS atau path assets/',item?.url||'','text'));
 else form.append(el('p','drawer-meta','Gambar yang sudah diunggah memiliki URL tetap. Untuk mengganti gambar: upload file baru, lalu pilih pada editor konten atau proyek. Metadata dapat diedit.'));
 if(item){const img=el('img','drawer-preview');img.alt=item.title;img.src=safeImage(item.url);form.append(img);}
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
  results.replaceChildren(el('p','muted','Memuat media…'));
  try{
   const r=await request('mediaList',{token:state.token,page,limit:18,search:q,status:'active'});
   results.replaceChildren();const urls=new Set();
   const add=item=>{if(!safeImage(item.url)||urls.has(item.url))return;urls.add(item.url);
    const card=imageCard(item);card.append(btn('Pilih gambar','button secondary small',()=>{onSelect(item);back();}));results.append(card);
   };
   if(!q&&page===1){
    for(const p of state.projects)add({title:p.nama,url:p.thumbnail});
    for(const key of ['character.image','hero.waveImage','seo.ogImage'])add({title:key,url:state.draft[key]||state.siteContent[key]});
   }
   (r.items||[]).forEach(add);
   if(!results.children.length)results.append(el('p','empty-state','Belum ada media yang cocok.'));
   drawPager(pager,r.page||page,r.pages||1,n=>{page=n;render();});
  }catch(error){results.replaceChildren(el('p','empty-state','Gagal memuat media: '+error.message));}
 };
 search.addEventListener('input',()=>{clearTimeout(timeout);timeout=setTimeout(()=>{q=search.value.trim();page=1;render();},300);});
 openDrawer('Pilih Gambar','MEDIA PICKER',wrap,[btn('Kembali','button subtle',back)]);
 render();
}
window.STUDIO_MEDIA={load,edit,upload,pick};
})();