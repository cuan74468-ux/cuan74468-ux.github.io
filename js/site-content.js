/* Linggau AI Studio CMS v2 — browser-only content schema and safe DOM renderer.
   Stored values are always plain text, never executed as HTML. */
(() => {
  'use strict';
  const entries=window.STUDIO_SCHEMA||[];
  const defaults = {
    'case.catalogIntro':'Jelajahi proyek yang ditampilkan atau hubungi Ferry untuk informasi lainnya.',
    'case.catalogRequest':'Minta katalog lengkap via WhatsApp ↗',
    'character.mode':'animated','character.image':'assets/char.webp','character.scale':'100','character.offset':'0','theme.bodyFont':'Geist','theme.headingFont':'Plus Jakarta Sans','seo.siteName':'Linggau AI Studio','form.submitStatus':'Pesan Anda berhasil dikirim. Terima kasih, saya akan menghubungi Anda.','seo.ogImage':''
  };
  const themeMap={'theme.paper':'--paper','theme.ink':'--ink','theme.sun':'--sun','theme.rose':'--rose','theme.sky':'--sky','theme.live':'--live'};
  function direct(el,last=false){
    const nodes=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE);
    return nodes.length?(last?nodes[nodes.length-1]:nodes[0]):null;
  }
  const select = selector => selector?document.querySelector(selector):null;
  function currentValue(f){
    if(f.key in defaults)return defaults[f.key];
    if(themeMap[f.key])return getComputedStyle(document.documentElement).getPropertyValue(themeMap[f.key]).trim();
    const el=select(f.selector);
    if(!el)return '';
    if(f.mode==='content')return el.content||'';
    if(f.mode==='aria-label')return el.getAttribute('aria-label')||'';
    if(f.mode==='href')return el.getAttribute('href')||'';
    if(f.mode==='chipColor')return el.style.getPropertyValue('--bg').trim()||'#FFFFFF';
    if(f.mode==='data-name')return el.getAttribute('data-name')||'';
    if(f.mode==='svg-use')return el.querySelector('use')?.getAttribute('href')||'';
    if(f.mode==='src')return el.getAttribute('src')||'';
    if(f.mode==='phone'){
      const m=(el.href||'').match(/wa\.me\/(\d+)/);return m?m[1]:'';
    }
    if(f.mode==='greeting'){
      try {return new URL(document.querySelector('.nav .quick-wa').href).searchParams.get('text')||'Halo Bang Ferry Linggau AI Studio';} catch{return 'Halo Bang Ferry Linggau AI Studio';}
    }
    if(f.mode==='firstDirect'||f.mode==='lastDirect')return (direct(el,f.mode==='lastDirect')?.textContent||'').trim();
    return (el.textContent||'').trim();
  }
  const factory=Object.fromEntries(entries.map(f=>[f.key,currentValue(f)]));
  let published={...factory},live={...factory};
  function safeImage(value){if(/^(?:\.\/)?assets\/[a-zA-Z0-9._/-]+$/.test(value)&&!value.includes('..'))return value;if(/^https:\/\/[^\s<>"']+$/i.test(value))return value;return '';}
  function apply(content){
    const next={...factory,...content};
    for(const f of entries){
      const el=select(f.selector), value=typeof next[f.key]==='string'?next[f.key]:factory[f.key];
      if(!el)continue;
      if(f.mode==='content')el.setAttribute('content',value);
      else if(f.mode==='aria-label')el.setAttribute('aria-label',value);
      else if(f.mode==='chipColor'){if(/^#[0-9a-fA-F]{6}$/.test(value))el.style.setProperty('--bg',value);}
      else if(f.mode==='href'){if(/^https:\/\/[^\s<>"']+$/.test(value)||/^#(?:contact|work|about)$/.test(value))el.setAttribute('href',value);}
      else if(f.mode==='data-name')el.setAttribute('data-name',value);
      else if(f.mode==='svg-use'){if(/^#i-(?:claude|figma|perplexity|codex|notebooklm|openai|midjourney|gmail|linkedin)$/.test(value))el.querySelector('use')?.setAttribute('href',value);}
      else if(f.mode==='src'){const url=safeImage(value);if(url)el.setAttribute('src',url);}
      else if(f.mode==='firstDirect'||f.mode==='lastDirect'){
        const node=direct(el,f.mode==='lastDirect');if(node)node.textContent=(f.key==='hero.helloBefore'||f.key==='hero.headlineBefore'?value+' ':f.key==='hero.helloAfter'?' '+value:value);
      } else if(f.mode==='phone'||f.mode==='greeting'||f.mode==='email'){}
      else{el.textContent=value;if(f.mode==='option')el.value=value;}
    }
    const email=String(next['contact.email']||factory['contact.email']).trim();
    if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      const eHref='mailto:'+email;
      ['.nav .mail','#contact .cta-links a:nth-child(2)','footer .foot nav a:nth-child(1)'].forEach(sel=>{const el=select(sel);if(el)el.setAttribute('href',eHref);});
      const code=select('#copyEmail code');if(code)code.textContent=email;
    }
    const phone=String(next['contact.whatsapp']||'').trim();
    if(/^\d{9,16}$/.test(phone)){
      const clean='https://wa.me/'+phone,quick=select('.nav .quick-wa');
      if(quick)quick.href=clean+'?text='+encodeURIComponent(next['contact.waGreeting']||'');
      ['#contact .cta-links a:nth-child(1)','footer .foot nav a:nth-child(2)'].forEach(sel=>{const e=select(sel);if(e)e.href=clean;});
    }
    const seoTitle=next['seo.title'],seoDescription=next['seo.description'];
    document.querySelector('meta[property="og:title"]')?.setAttribute('content',seoTitle);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content',seoDescription);
    if(next['seo.siteName']){let app=document.querySelector('meta[name="application-name"]');if(!app){app=document.createElement('meta');app.name='application-name';document.head.append(app);}app.content=next['seo.siteName'];}
    if(next['seo.ogImage']&&safeImage(next['seo.ogImage'])){let og=document.querySelector('meta[property="og:image"]');if(!og){og=document.createElement('meta');og.setAttribute('property','og:image');document.head.append(og);}og.setAttribute('content',safeImage(next['seo.ogImage']));}
    for(const [key,name] of Object.entries(themeMap)){
      const c=next[key];if(/^#[0-9A-Fa-f]{6}$/.test(c))document.documentElement.style.setProperty(name,c);
    }
    const fonts={'Geist':'"Geist",ui-sans-serif,system-ui,sans-serif','Plus Jakarta Sans':'"Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif','Instrument Serif':'"Instrument Serif",Georgia,serif'};
    if(fonts[next['theme.bodyFont']])document.documentElement.style.setProperty('--body',fonts[next['theme.bodyFont']]);
    if(fonts[next['theme.headingFont']])document.documentElement.style.setProperty('--sans-display',fonts[next['theme.headingFont']]);
    const char=document.querySelector('.character');
    if(char){
      const scale=Math.max(60,Math.min(140,Number(next['character.scale'])||100));
      const offset=Math.max(-40,Math.min(40,Number(next['character.offset'])||0));
      char.style.setProperty('--character-scale',String(scale/100));
      char.style.setProperty('--character-offset',String(offset)+'px');
    }
    window.STUDIO.setCharacter?.({mode:next['character.mode'],image:safeImage(next['character.image'])});
    live=next;
    window.dispatchEvent(new CustomEvent('studio:content',{detail:{content:next}}));
  }
  function publish(remote){
    published={...factory,...(remote&&typeof remote==='object'?remote:{})};
    apply(published);
  }
  window.STUDIO.site={
    fields:entries,defaults:factory,read:()=>({...published}),preview:content=>apply(content),
    publish,reset:()=>apply(published),values:()=>({...live})
  };
})();
