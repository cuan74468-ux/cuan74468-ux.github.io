/* Dynamic Content CRUD V4; independent of the static field editor. */
(()=>{'use strict';
const A=window.STUDIO_ADMIN;if(!A)throw Error('Content manager requires CMS workspace.');
const {state,request,toast,el,btn,openDrawer,closeDrawer,drawPager,makeFormField,safeImage,friendlyDate}=A;
const $=q=>document.querySelector(q);
let items=[],page=1,pages=1,search='',status='all',pending=0,searchTimer=null;
function pill(text){const node=el('span','chip-badge '+(text==='active'?'green':text==='archived'?'gray':'orange'),text==='active'?'Diterbitkan':text==='draft'?'Draft':'Arsip');return node;}
function render(){
 const root=$('#contentBlockList');if(!root)return;root.replaceChildren();
 if(!items.length)root.append(el('p','empty-state','Belum ada blok konten. Klik Tambah konten untuk membuat artikel singkat dengan foto dan tautan.'));
 for(const item of items){
  const row=el('article','content-item');
  const image=safeImage(item.image_url);if(image){const img=el('img','content-thumb');img.src=image;img.alt=item.title;img.loading='lazy';row.append(img);}
  const main=el('div','content-item-body');
  const meta=el('div','content-item-meta');meta.append(pill(item.status),el('small','',friendlyDate(item.updated_at)),el('small','','Urutan '+item.sort_order));
  main.append(meta,el('h3','',item.title),el('p','',item.body));row.append(main);
  const actions=el('div','content-item-actions');
  if(item.status==='archived')actions.append(btn('Pulihkan','button secondary small',()=>restore(item)));
  else{
   actions.append(btn('Edit','button secondary small',()=>edit(item)));
   actions.append(btn('Hapus','button danger small',()=>archive(item)));
  }
  row.append(actions);root.append(row);
 }
 drawPager($('#contentBlockPager'),page,pages,n=>{page=n;load();});
}
async function load(){
 if(!state.token)return;const seq=++pending;
 $('#contentBlockList').replaceChildren(el('p','empty-state','Memuat konten…'));
 try{
  const r=await request('contentList',{token:state.token,page,limit:8,status,search});
  if(seq!==pending)return;items=r.items||[];page=r.page||1;pages=r.pages||1;render();
 }catch(error){
  if(seq!==pending)return;$('#contentBlockList').replaceChildren(el('p','empty-state','CRUD konten belum siap: '+error.message+' Pastikan GAS V4 sudah di-deploy.'));
 }
}
function edit(item=null){
 const form=el('form');form.id='contentEditForm';
 form.append(makeFormField('title','Judul konten',item?.title||''));
 form.append(makeFormField('body','Isi / narasi',item?.body||'','textarea'));
 form.append(makeFormField('image_url','Gambar (HTTPS atau path assets/) — opsional',item?.image_url||'','text',false));
 const tools=el('div','editor-tools'),picker=btn('▣ Pilih dari Pustaka Media','button secondary small',()=>window.STUDIO_MEDIA?.pick(media=>{form.elements.image_url.value=media.url;form.elements.image_url.dispatchEvent(new Event('input'));}));
 tools.append(picker);form.append(tools);
 const preview=el('img','drawer-preview');preview.alt='Pratinjau konten';preview.hidden=true;form.append(preview);
 const update=()=>{const image=safeImage(form.elements.image_url.value);preview.hidden=!image;if(image)preview.src=image;};
 form.elements.image_url.addEventListener('input',update);update();
 form.append(makeFormField('button_text','Teks tombol / CTA (opsional)',item?.button_text||'','text',false));
 form.append(makeFormField('button_url','URL tombol HTTPS atau #contact (opsional)',item?.button_url||'','text',false));
 form.append(makeFormField('sort_order','Urutan tampil (0–999)',item?.sort_order||'100','number'));
 form.elements.sort_order.min='0';form.elements.sort_order.max='999';form.elements.sort_order.step='1';
 const stateLabel=el('label');stateLabel.textContent='Status publikasi';
 const select=el('select');select.name='status';
 for(const [v,label] of [['draft','Simpan sebagai Draft'],['active','Terbitkan di Website']]){const opt=el('option','',label);opt.value=v;select.append(opt);}
 select.value=item?.status==='active'?'active':'draft';stateLabel.append(select);form.append(stateLabel);
 const save=btn(item?'Simpan Konten':'Buat Konten','button primary',async()=>{
  if(!form.reportValidity())return;
  save.disabled=true;
  try{
   const data=Object.fromEntries(new FormData(form));
   if(item){data.id=item.id;data.expectedUpdatedAt=item.updated_at;}
   const response=await request('contentSave',{token:state.token,...data});
   closeDrawer();page=1;await load();
   toast(response.item.status==='active'?'Konten diterbitkan. Refresh halaman publik untuk melihat hasilnya.':'Konten tersimpan sebagai draft.');
  }catch(error){toast(error.message,true);}finally{save.disabled=false;}
 });
 openDrawer(item?'Edit Blok Konten':'Tambah Blok Konten',item?'CONTENT EDITOR':'NEW CONTENT',form,[btn('Batal','button subtle',closeDrawer),save]);
}
async function archive(item){
 if(!confirm('Hapus "'+item.title+'" dari konten aktif? Data akan dipindahkan ke arsip dan dapat dipulihkan.'))return;
 try{await request('contentArchive',{token:state.token,id:item.id,expectedUpdatedAt:item.updated_at});page=1;await load();toast('Konten dipindahkan ke arsip.');}
 catch(error){toast(error.message,true);}
}
async function restore(item){
 try{await request('contentRestore',{token:state.token,id:item.id,expectedUpdatedAt:item.updated_at});status='all';$('#contentFilter').value='all';page=1;await load();toast('Konten dipulihkan sebagai draft. Edit untuk menerbitkan kembali.');}
 catch(error){toast(error.message,true);}
}
const bind=()=>{
 $('#newContentBlock').addEventListener('click',()=>edit());
 $('#refreshContents').addEventListener('click',load);
 $('#contentFilter').addEventListener('change',e=>{status=e.target.value;page=1;load();});
 $('#contentSearch').addEventListener('input',e=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{search=e.target.value.trim();page=1;load();},300);});
};
bind();
window.STUDIO_CONTENT={load,edit};
})();