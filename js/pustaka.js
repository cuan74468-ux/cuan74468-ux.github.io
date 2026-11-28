(() => {
'use strict';
const $=id=>document.getElementById(id),grid=$('library-items'),status=$('library-status'),retry=$('library-retry'),search=$('library-search'),category=$('library-category'),format=$('library-format');
let items=[];
const endpoint=s=>/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(s);
const safeURL=s=>typeof s==='string'&&/^(?:https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/view|https:\/\/docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/[A-Za-z0-9_-]+\/(?:view|edit)|https:\/\/github\.com\/cuan74468-ux\/[A-Za-z0-9_-]+\/releases\/(?:tag\/[A-Za-z0-9._-]+|download\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+))$/.test(s);
function node(tag,value,cls){const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;}
function options(select,key,label){const prior=select.value;select.replaceChildren(new Option(label,''),...[...new Set(items.map(i=>i[key]))].sort().map(v=>new Option(v,v)));if([...select.options].some(o=>o.value===prior))select.value=prior;}
function render(){
 const q=search.value.trim().toLowerCase(),c=category.value,f=format.value;
 const matches=items.filter(i=>(!c||i.category===c)&&(!f||i.format===f)&&(!q||[i.title,i.summary,i.author,i.category].join(' ').toLowerCase().includes(q)));
 grid.replaceChildren();
 for(const i of matches){const card=node('article',null,'library-card'),a=node('a','Buka materi','library-primary');a.href=i.url;a.rel='noopener noreferrer';card.append(node('p',i.format+' · '+i.category,'library-tag'),node('h3',i.title),node('p',i.author+' · '+i.source_year,'library-meta'),node('p',i.summary),a);grid.append(card);}
 status.textContent=matches.length?matches.length+' materi tersedia.':items.length?'Tidak ada materi yang cocok.':'Koleksi tambahan sedang dikurasi. Buku pilihan tetap tersedia.';
}
async function load(){
 items=[];grid.replaceChildren();retry.hidden=true;status.textContent='Memuat koleksi…';search.disabled=category.disabled=format.disabled=true;
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const c=await fetch('config.json',{cache:'no-store',credentials:'omit',signal:ctrl.signal});if(!c.ok)throw Error('config');
  const cfg=await c.json(),url=String(cfg.gasUrl||'').trim();if(!endpoint(url))throw Error('endpoint');
  const r=await fetch(url+'?action=publicLibrary',{cache:'no-store',credentials:'omit',signal:ctrl.signal,redirect:'follow'});if(!r.ok)throw Error('http');
  const d=await r.json();if(d.ok!==true||typeof d.enabled!=='boolean'||!Array.isArray(d.items))throw Error('schema');
  if(d.enabled)items=d.items.slice(0,500).filter(i=>i&&['title','category','format','summary','author','source_year'].every(k=>typeof i[k]==='string')&&safeURL(i.url));
  options(category,'category','Semua kategori');options(format,'format','Semua format');render();
  search.disabled=category.disabled=format.disabled=!items.length;
 }catch(_){status.textContent='Koleksi tambahan belum tersedia. Buku pilihan tetap dapat diunduh.';retry.hidden=false;}
 finally{clearTimeout(timer);}
}
search.addEventListener('input',render);category.addEventListener('change',render);format.addEventListener('change',render);retry.addEventListener('click',load);load();
})();