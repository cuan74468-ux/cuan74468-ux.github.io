(() => {
'use strict';
const $=id=>document.getElementById(id),grid=$('library-items'),status=$('library-status'),network=$('library-network'),retry=$('library-retry'),search=$('library-search'),category=$('library-category'),format=$('library-format'),sort=$('library-sort');
const book={id:'dapur-vibe-coder',title:'Dapur Vibe Coder',category:'Teknologi',format:'eBook',summary:'Buku digital gratis untuk belajar membangun produk digital dengan AI.',author:'Linggau AI Studio',source_year:'2026',url:'https://cuan74468-ux.github.io/buku-pintar-vibe-coder/',featured:true};
const release='https://github.com/cuan74468-ux/buku-pintar-vibe-coder/releases/download/dapur-vibe-coder/';
const form=$('review-form'),reviewTarget=$('review-target'),reviewFilter=$('review-filter'),reviewStatus=$('review-status');
let items=[book],reviews=[],gas='',page=1,started=Date.now(),requestId='',requestPayload='',loading=false;
const PAGE_SIZE=12;
const endpoint=s=>/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(s);
const safeURL=s=>typeof s==='string'&&/^(?:https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/view|https:\/\/docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/[A-Za-z0-9_-]+\/(?:view|edit)|https:\/\/github\.com\/cuan74468-ux\/[A-Za-z0-9_-]+\/releases\/(?:tag\/[A-Za-z0-9._-]+|download\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+))$/.test(s);
function node(tag,value,cls){const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;}
function link(text,url,cls){const a=node('a',text,cls);a.href=url;a.rel='noopener noreferrer';return a;}
function options(select,key,label){const prior=select.value;select.replaceChildren(new Option(label,''),...[...new Set(items.map(i=>i[key]))].sort().map(v=>new Option(v,v)));if([...select.options].some(o=>o.value===prior))select.value=prior;}
function targetOptions(){const list=[['general','Pustaka Digital (umum)'],...items.map(i=>[i.id,i.title])];for(const select of [reviewTarget,reviewFilter]){const prior=select.value;select.replaceChildren(...(select===reviewFilter?[new Option('Semua ulasan','')]:[]),...list.map(([id,title])=>new Option(title,id)));if([...select.options].some(o=>o.value===prior))select.value=prior;}}
function render(){
 const q=search.value.trim().toLowerCase(),c=category.value,f=format.value;
 const matches=items.filter(i=>(!c||i.category===c)&&(!f||i.format===f)&&(!q||[i.title,i.summary,i.author,i.category].join(' ').toLowerCase().includes(q)));
 matches.sort((a,b)=>sort.value==='az'?a.title.localeCompare(b.title,'id'):sort.value==='old'?a.source_year.localeCompare(b.source_year)||a.title.localeCompare(b.title,'id'):b.source_year.localeCompare(a.source_year)||Number(!!b.featured)-Number(!!a.featured)||a.title.localeCompare(b.title,'id'));
 const pages=Math.max(1,Math.ceil(matches.length/PAGE_SIZE));page=Math.max(1,Math.min(page,pages));grid.replaceChildren();
 for(const i of matches.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE)){
  const card=node('article',null,'library-card');
  if(i.featured){const cover=node('img',null,'library-cover');cover.src='https://cuan74468-ux.github.io/buku-pintar-vibe-coder/assets/web/cover.webp';cover.alt='Sampul Dapur Vibe Coder';cover.loading='lazy';cover.onerror=()=>{cover.hidden=true;};card.append(cover);}
  card.append(node('p',i.format+' · '+i.category,'library-tag'),node('h3',i.title),node('p',i.author+' · '+i.source_year,'library-meta'),node('p',i.summary));
  const actions=node('div',null,'library-actions');actions.append(link(i.featured?'Buka buku':'Buka materi',i.url,'library-primary'));
  if(i.featured)actions.append(link('PDF',release+'Dapur_Vibe_Coder.pdf'),link('EPUB',release+'Dapur_Vibe_Coder.epub'));
  card.append(actions);
  if(!form.hidden){const review=link('Tulis ulasan','#ulasan','library-review-link');review.addEventListener('click',()=>{reviewTarget.value=i.id;reviewFilter.value=i.id;renderReviews();});card.append(review);}
  grid.append(card);
 }
 status.textContent=matches.length?matches.length+' materi tersedia.':'Tidak ada materi yang cocok. Coba reset filter.';
 $('library-pager').hidden=pages<=1;$('library-page-info').textContent='Halaman '+page+' dari '+pages;$('library-prev').disabled=page<=1;$('library-next').disabled=page>=pages;
}
async function request(action,body){
 if(!endpoint(gas))throw Error('Layanan belum tersedia.');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
 try{const opt={cache:'no-store',credentials:'omit',signal:ctrl.signal,redirect:'follow'};if(body){opt.method='POST';opt.headers={'Content-Type':'text/plain;charset=utf-8'};opt.body=JSON.stringify({action,...body});}
 const r=await fetch(body?gas:gas+'?action='+encodeURIComponent(action),opt);if(!r.ok)throw Error('Layanan belum tersedia.');const d=await r.json();if(d.ok!==true)throw Error(d.error||'Permintaan belum dapat diproses.');return d;}finally{clearTimeout(timer);}
}
function renderReviews(){
 const target=reviewFilter.value,list=$('review-list'),matches=reviews.filter(r=>!target||r.target_id===target);list.replaceChildren();
 $('review-list-status').textContent=matches.length?'Ulasan terbaru yang telah dimoderasi.':'Belum ada ulasan yang ditayangkan untuk pilihan ini.';
 for(const r of matches){const card=node('article',null,'library-review-entry');card.append(node('strong',r.display_name),node('small',r.target_title+' · '+r.date+(r.rating?' · '+r.rating+'/5':'')),node('p',r.comment));list.append(card);}
}
async function loadReviews(){reviews=[];form.hidden=true;$('review-list').replaceChildren();try{const r=await request('libraryReviews');if(!r.enabled){form.hidden=true;$('review-list-status').textContent='Ulasan belum dibuka.';return;}reviews=Array.isArray(r.items)?r.items.slice(0,60).filter(x=>x&&['target_id','target_title','display_name','comment','date'].every(k=>typeof x[k]==='string')):[];form.hidden=false;renderReviews();}catch(_){form.hidden=true;$('review-list-status').textContent='Ulasan sementara tidak tersedia.';}}
async function load(){
 if(loading)return;loading=true;retry.hidden=true;network.textContent='Memuat koleksi tambahan…';
 try{
 const configCtrl=new AbortController(),configTimer=setTimeout(()=>configCtrl.abort(),10000);let c;try{c=await fetch('config.json',{cache:'no-store',credentials:'omit',signal:configCtrl.signal});}finally{clearTimeout(configTimer);}if(!c.ok)throw Error('config');gas=String((await c.json()).gasUrl||'').trim();if(!endpoint(gas))throw Error('endpoint');
 const d=await request('publicLibrary');if(typeof d.enabled!=='boolean'||!Array.isArray(d.items))throw Error('schema');
 const unique=new Set([book.id]);items=[book];if(d.enabled)for(const i of d.items.slice(0,500)){if(i&&typeof i.id==='string'&&!unique.has(i.id)&&['title','category','format','summary','author','source_year'].every(k=>typeof i[k]==='string')&&safeURL(i.url)){unique.add(i.id);items.push({...i,featured:false});}}
 network.textContent=items.length>1?'Materi yang tersedia telah melalui kurasi.':'Koleksi lain sedang disiapkan. Buku pilihan sudah dapat dibaca.';
 }catch(_){items=[book];network.textContent='Koleksi tambahan belum tersedia. Buku pilihan tetap dapat dibaca.';retry.hidden=false;}
 options(category,'category','Semua kategori');options(format,'format','Semua format');targetOptions();render();if(endpoint(gas))await loadReviews();render();loading=false;
}
for(const [control,event] of [[search,'input'],[category,'change'],[format,'change'],[sort,'change']])control.addEventListener(event,()=>{page=1;render();});
 $('library-reset').addEventListener('click',()=>{search.value=category.value=format.value='';sort.value='new';page=1;render();});
 $('library-prev').addEventListener('click',()=>{page--;render();$('koleksi').scrollIntoView({block:'start'});});
 $('library-next').addEventListener('click',()=>{page++;render();$('koleksi').scrollIntoView({block:'start'});});
 retry.addEventListener('click',load);reviewFilter.addEventListener('change',renderReviews);
 form.elements.comment.addEventListener('input',()=>{$('review-count').textContent=form.elements.comment.value.length+'/800';});
 form.addEventListener('submit',async e=>{
 e.preventDefault();if(form.hidden)return;const data=new FormData(form),b={target_id:String(data.get('target_id')),display_name:String(data.get('display_name')||''),rating:Number(data.get('rating')),comment:String(data.get('comment')),consent:data.get('consent')==='on',website:String(data.get('website')||'')};
 const serialized=JSON.stringify(b);if(serialized!==requestPayload){if(!globalThis.crypto?.randomUUID){reviewStatus.textContent='Browser belum mendukung pengiriman ulasan yang aman. Gunakan browser terbaru.';return;}requestPayload=serialized;requestId=crypto.randomUUID();}
 const btn=form.querySelector('button[type=submit]');btn.disabled=true;reviewStatus.textContent='Mengirim ulasan…';
 try{await request('libraryReviewSubmit',{...b,request_id:requestId,started_at:started});form.reset();$('review-count').textContent='0/800';requestPayload=requestId='';started=Date.now();reviewStatus.textContent='Terima kasih. Ulasan diterima dan akan ditinjau sebelum tampil.';}catch(error){reviewStatus.textContent=error.name==='AbortError'?'Respons terlalu lama. Coba kirim ulang tanpa mengubah isi.':String(error.message||'Ulasan belum terkirim.');}finally{btn.disabled=false;}
 });
 options(category,'category','Semua kategori');options(format,'format','Semua format');targetOptions();render();load();
})();