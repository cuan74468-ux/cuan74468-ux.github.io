(() => {
'use strict';
const admin=window.STUDIO_ADMIN,$=id=>document.getElementById(id);
let page=1,pages=1,busy=false;
function node(tag,text,cls){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
async function moderate(item,next){
 if(busy||!confirm('Ubah status ulasan menjadi '+next+'?'))return;
 busy=true;try{await admin.request('libraryReviewModerate',{token:admin.state.token,id:item.id,status:next,expectedUpdatedAt:item.updated_at});}catch(e){$('reviewAdminStatus').textContent=e.message;return;}finally{busy=false;}
 await load();
}
async function load(){
 if(busy)return;busy=true;const list=$('reviewAdminList'),status=$('reviewAdminStatus');list.replaceChildren();status.textContent='Memuat ulasan…';
 try{const token=admin.state.token;const r=await admin.request('libraryReviewList',{token,status:$('reviewAdminFilter').value,page});if(token!==admin.state.token||admin.state.view!=='library-reviews')return;
 page=r.page;pages=r.pages;status.textContent=(r.enabled?'Ulasan aktif. ':'Ulasan publik belum diaktifkan. ')+r.total+' ulasan sesuai filter.';
 for(const item of r.items){const article=node('article',null,'surface');const comment=node('p',item.comment);comment.style.whiteSpace='pre-wrap';comment.style.overflowWrap='anywhere';article.append(node('h3',item.display_name),node('p',item.target_id+' · '+(item.rating?item.rating+'/5 · ':'')+item.status+' · '+item.created_at,'muted micro'),comment);
 const bar=node('div',null,'head-actions');const choices={PENDING:[['Setujui','APPROVED'],['Tolak','REJECTED']],APPROVED:[['Sembunyikan','HIDDEN']],HIDDEN:[['Tayangkan kembali','APPROVED'],['Tolak','REJECTED']]};
 for(const [label,next] of choices[item.status]||[]){const b=node('button',label,'button secondary');b.type='button';b.addEventListener('click',()=>moderate(item,next));bar.append(b);}article.append(bar);list.append(article);}
 $('reviewAdminPage').textContent='Halaman '+page+' dari '+pages;$('reviewAdminPrev').disabled=page<=1;$('reviewAdminNext').disabled=page>=pages;
 }catch(e){status.textContent='Ulasan belum tersedia: '+e.message;}finally{busy=false;}
}
$('reviewAdminRefresh').addEventListener('click',load);$('reviewAdminFilter').addEventListener('change',()=>{page=1;load();});$('reviewAdminPrev').addEventListener('click',()=>{if(page>1){page--;load();}});$('reviewAdminNext').addEventListener('click',()=>{if(page<pages){page++;load();}});window.STUDIO_LIBRARY_REVIEWS={load};
})();