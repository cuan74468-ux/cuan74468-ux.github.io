const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('js/admin-workspace.js');
const start=source.indexOf('async function saveUsageImage(');
const end=source.indexOf('async function logout(){',start);
assert(start>=0&&end>start,'Direct replacement source must be present');
const code=source.slice(start,end);
function runner(state){
 const actions=[],previews=[],drafts=[];
 const context={
  state,
  request:async(action,body)=>{
   actions.push({action,body});
   if(action==='saveProject')return {ok:true,projects:[{...body.project}],revision:'p2'};
   if(action==='saveSite')return {ok:true,content:body.content,siteRevision:'s2'};
   throw Error('Unexpected API '+action);
  },
  needLogin:()=>{if(!state.token)throw Error('Login required.');},
  safeImage:url=>/^(?:assets\/[A-Za-z0-9._/-]+|https:\/\/[^\s<>"']+)$/.test(url)?url:'',
  renderProjects:()=>{},
  resetDraft:()=>drafts.push(true),
  $:()=>({contentWindow:{STUDIO:{site:{publish:content=>previews.push(content)}}}})
 };
 const fn=vm.runInNewContext(code+'\nsaveUsageImage;',context);
 return {fn,actions,previews,drafts};
}
test('active project thumbnail swaps using legacy saveProject, not mediaList V4',async()=>{
 const s={token:'demo',projects:[{id:'project-1',nama:'Project',thumbnail:'assets/old.webp',kategori:'Demo',featured_ring:true}],revision:'p1',view:'media'};
 const r=runner(s);
 const out=await r.fn({kind:'project',id:'project-1'},'assets/new.webp');
 assert.equal(r.actions.length,1);
 assert.equal(r.actions[0].action,'saveProject');
 assert.equal(r.actions[0].body.expectedRevision,'p1');
 assert.equal(r.actions[0].body.project.thumbnail,'assets/new.webp');
 assert.equal(r.actions[0].body.project.nama,'Project');
 assert.equal(s.projects[0].thumbnail,'assets/new.webp');
 assert.equal(s.revision,'p2');
 assert.match(out.message,/berhasil/);
});
test('site image replacement preserves other content and switches character to static',async()=>{
 const s={token:'demo',siteRevision:'s1',siteContent:{'hero.headline3':'Karya yang bermakna'},dirty:false,view:'media'};
 const r=runner(s);
 await r.fn({kind:'site',key:'character.image'},'https://img.example.org/portrait.webp');
 assert.equal(r.actions[0].action,'saveSite');
 assert.equal(r.actions[0].body.expectedSiteRevision,'s1');
 assert.equal(r.actions[0].body.content['character.image'],'https://img.example.org/portrait.webp');
 assert.equal(r.actions[0].body.content['character.mode'],'static');
 assert.equal(r.actions[0].body.content['hero.headline3'],'Karya yang bermakna');
 assert.equal(s.siteRevision,'s2');
 assert.equal(r.drafts.length,1);
 assert.equal(r.previews.length,1);
});
test('invalid images, stale site support, or unsaved drafts fail without writes',async()=>{
 const s={token:'demo',siteRevision:'s1',siteContent:{},dirty:true,view:'media'};
 const r=runner(s);
 await assert.rejects(r.fn({kind:'site',key:'hero.waveImage'},'assets/wave.webp'),/belum diterbitkan/);
 await assert.rejects(r.fn({kind:'project',id:'none'},'javascript:alert(1)'),/valid/);
 s.dirty=false;s.siteRevision='';
 await assert.rejects(r.fn({kind:'site',key:'seo.ogImage'},'assets/og.webp'),/membutuhkan dukungan CMS/);
 assert.equal(r.actions.length,0);
});
test('used media cards are prioritized and include a replacement action',()=>{
 const html=read('studio-admin.html'),mod=read('js/media-manager.js');
 assert(html.indexOf('id="mediaUsedGrid"')<html.indexOf('id="mediaGrid"'),'Active assets must precede optional media library');
 assert(mod.includes('function replaceActive(slot)'),'Replacement modal must exist');
 assert(mod.includes("btn(item.url?'Ganti Gambar':'Pasang Gambar'"),'Active assets need replace button');
 assert(mod.includes('Pustaka tambahan belum aktif'),'Picker must explain V4 fallback');
 assert(mod.includes('assets/char.webp')&&mod.includes('assets/wave.png'));
 assert(mod.includes('assets/plate.png')&&mod.includes('assets/grain.png'));
});
