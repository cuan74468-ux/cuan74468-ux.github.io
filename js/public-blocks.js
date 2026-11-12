/* Additional public content: optional data-driven cards from GAS content_blocks.
   Uses DOM APIs, never executes HTML from CMS. */
(()=>{'use strict';
const host=document.getElementById('customContent');if(!host)return;
const safeImage=u=>{const s=String(u||'').trim();return /^(?:\.\/)?assets\/[A-Za-z0-9._/-]+$/.test(s)&&!s.includes('..')?s:/^https:\/\/[^\s<>"'\\]+$/.test(s)?s:'';};
const safeLink=u=>{const s=String(u||'').trim();return /^https:\/\/[^\s<>"'\\]+$/.test(s)||/^#(?:contact|about|work|top)$/.test(s)?s:'';};
const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
window.STUDIO=window.STUDIO||{};
window.STUDIO.renderBlocks=(all=[])=>{
 const entries=Array.isArray(all)?all.filter(p=>p&&p.status==='active').slice(0,60):[];
 host.replaceChildren();host.hidden=!entries.length;if(!entries.length)return;
 const wrapper=make('div','wrap additional-wrap');
 wrapper.append(make('span','additional-kicker','DARI LINGGAU STUDIO'),make('h2','additional-title','Cerita, karya & inspirasi lainnya'));
 const grid=make('div','additional-grid');
 entries.forEach((p,i)=>{
  const card=make('article','additional-card');
  const image=safeImage(p.image_url);
  if(image){const img=make('img','additional-cover');img.src=image;img.alt=p.title;img.loading='lazy';card.append(img);}
  card.append(make('small','additional-index',String(i+1).padStart(2,'0')+' / '+(entries.length).toString().padStart(2,'0')));
  card.append(make('h3','',p.title));
  card.append(make('p','additional-description',p.body));
  const link=safeLink(p.button_url);
  if(link){const a=make('a','additional-link',p.button_text||'Pelajari lebih lanjut');a.href=link;
   if(link.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';}card.append(a);}
  grid.append(card);
 });
 wrapper.append(grid);host.append(wrapper);
};
})();