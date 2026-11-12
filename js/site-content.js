/* Linggau AI Studio CMS v2 — browser-only content schema and safe DOM renderer.
   Stored values are always plain text, never executed as HTML. */
(() => {
  'use strict';
  const entries = [];
  function field(group,key,label,selector,mode='text',type='text') {
    entries.push({group,key,label,selector,mode,type});
  }
  // Identity and navigation
  field('Identitas & SEO','seo.title','Judul browser / SEO','title');
  field('Identitas & SEO','seo.description','Deskripsi mesin pencari','meta[name="description"]','content','textarea');
  field('Navigasi','nav.status','Status ketersediaan','.nav .status','lastDirect');
  field('Navigasi','nav.work','Menu karya','.nav a[data-sec="work"]');
  field('Navigasi','nav.about','Menu tentang','.nav a[data-sec="about"]');
  field('Navigasi','nav.contact','Menu kontak','.nav a[data-sec="contact"]');
  field('Navigasi','nav.quickWaLabel','Teks tombol WhatsApp','.nav .quick-wa');
  // Hero
  field('Hero','hero.helloBefore','Sapaan sebelum nama','.hero .hello > span','firstDirect');
  field('Hero','hero.name','Nama yang disapa','.hero .hello b');
  field('Hero','hero.helloAfter','Identitas sesudah nama','.hero .hello > span','lastDirect');
  field('Hero','hero.headlineBefore','Headline awal','.hero h1 .ln:nth-child(1)','firstDirect');
  field('Hero','hero.highlight','Headline bergaris bawah','.hero h1 .pen','firstDirect');
  field('Hero','hero.headline2','Headline baris kedua','.hero h1 .ln:nth-child(2)');
  field('Hero','hero.headline3','Headline baris ketiga','.hero h1 .ln:nth-child(3)');
  field('Hero','hero.subtitle','Paragraf pengantar','.hero .sub','text','textarea');
  field('Hero','hero.cta','Label tombol hero','.hero .actions a','firstDirect');
  field('Hero','hero.waveImage','Gambar emoji lambaian','.hero .hello img','src','image');
  // About
  field('Tentang','about.kicker','Label bagian','.about-top .kicker');
  field('Tentang','about.title','Judul tentang','.about-top h2','text','textarea');
  for(let i=1;i<=4;i++)field('Tentang','about.bio'+i,'Paragraf biodata '+i, '#about .bio p:nth-child('+i+')','text','textarea');
  for(let i=1;i<=2;i++){
    field('Pendekatan & AI','about.pillar'+i+'Title','Judul pilar '+i,'.pillars .pillar:nth-child('+i+') h3');
    field('Pendekatan & AI','about.pillar'+i+'Body','Isi pilar '+i,'.pillars .pillar:nth-child('+i+') p','text','textarea');
  }
  for(let i=1;i<=5;i++)field('Pendekatan & AI','about.tool'+i,'Label teknologi '+i,'.tools-inline span:nth-child('+i+')');
  for(let i=1;i<=5;i++){
    field('Proses kerja','process.step'+i+'Title','Langkah '+i+' — judul','.process li:nth-child('+i+') h3');
    field('Proses kerja','process.step'+i+'Body','Langkah '+i+' — penjelasan','.process li:nth-child('+i+') p','text','textarea');
  }
  field('Proses kerja','process.note','Catatan tahapan','.process .process-note','text','textarea');
  field('Keahlian','skills.title','Judul keahlian','.skills-head h3');
  for(let i=1;i<=10;i++)field('Keahlian','skills.chip'+i,'Chip keahlian '+i,'.pit .chip:nth-child('+i+')');
  // Contact text and address settings
  field('Kontak','contact.badge','Label ketersediaan','#contact .badge','lastDirect');
  field('Kontak','contact.title','Judul penawaran','#contact .cta-inner > h2','text','textarea');
  field('Kontak','contact.body','Penjelasan penawaran','#contact .cta-inner > p:nth-of-type(1)','text','textarea');
  field('Kontak','contact.intro','Ajakan percakapan','#contact .cta-inner .git');
  field('Kontak','contact.whatsappLabel','Teks tombol WhatsApp','#contact .cta-links a:nth-child(1)');
  field('Kontak','contact.emailLabel','Teks tombol email','#contact .cta-links a:nth-child(2)');
  field('Kontak','contact.email','Alamat email kontak','#copyEmail code','email','email');
  field('Kontak','contact.whatsapp','Nomor WhatsApp dengan 62 di awal','#contact .cta-links a:nth-child(1)','phone','tel');
  field('Kontak','contact.waGreeting','Pesan pembuka WhatsApp','#contact .cta-links a:nth-child(1)','greeting','text');
  // Public lead form
  field('Formulir','form.title','Judul formulir','#leadForm h3');
  field('Formulir','form.nameLabel','Label nama','#leadForm label:nth-child(1)','firstDirect');
  field('Formulir','form.whatsappLabel','Label nomor WhatsApp','#leadForm .form-grid label:nth-child(2)','firstDirect');
  field('Formulir','form.needLabel','Label kebutuhan','#leadForm > label:nth-of-type(1)','firstDirect');
  field('Formulir','form.needPlaceholder','Placeholder kebutuhan','#leadForm select option:nth-child(1)','text');
  for(let i=1;i<=5;i++)field('Formulir','form.needOption'+i,'Pilihan kebutuhan '+i,'#leadForm select option:nth-child('+(i+1)+')','option');
  field('Formulir','form.messageLabel','Label pesan','#leadForm > label:nth-of-type(2)','firstDirect');
  field('Formulir','form.consent','Pernyataan persetujuan','#leadForm .consent','lastDirect','textarea');
  field('Formulir','form.submit','Tombol kirim','#leadForm button[type="submit"]');
  field('Formulir','form.hint','Keterangan status','#leadStatus','text','textarea');
  // Case modal, footer
  field('Studi kasus','case.back','Tombol kembali','#backBtn');
  field('Studi kasus','case.open','Tombol buka demo','#caseLink');
  field('Studi kasus','case.catalog','Tombol katalog','#catalogButton');
  field('Studi kasus','case.catalogIntro','Pengantar katalog',null,'virtual','textarea');
  field('Studi kasus','case.catalogRequest','Tombol minta katalog',null,'virtual');
  field('Footer','footer.copyright','Teks hak cipta','footer .foot > span');
  field('Footer','footer.emailLabel','Menu footer email','footer .foot nav a:nth-child(1)');
  field('Footer','footer.whatsappLabel','Menu footer WhatsApp','footer .foot nav a:nth-child(2)');
  // Character presentation: animated skin is aligned to the existing coordinate map.
  field('Karakter','character.mode','Mode karakter',null,'special','select');
  field('Karakter','character.image','URL aset karakter',null,'special','image');
  field('Karakter','character.scale','Ukuran karakter (%)',null,'special','number');
  field('Karakter','character.offset','Geser horizontal (px)',null,'special','number');
  // Controlled, accessible visual accents.
  field('Tema visual','theme.paper','Warna latar utama',null,'special','color');
  field('Tema visual','theme.ink','Warna teks utama',null,'special','color');
  field('Tema visual','theme.sun','Warna aksen kuning',null,'special','color');
  field('Tema visual','theme.rose','Warna aksen merah muda',null,'special','color');
  field('Tema visual','theme.sky','Warna aksen biru langit',null,'special','color');
  field('Tema visual','theme.live','Warna titik status',null,'special','color');
  const defaults = {
    'case.catalogIntro':'Karya yang sudah tersedia di katalog. Untuk koleksi lengkap 40+ karya, hubungi Ferry.',
    'case.catalogRequest':'Minta katalog lengkap via WhatsApp ↗',
    'character.mode':'animated','character.image':'assets/char.webp','character.scale':'100','character.offset':'0'
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
    for(const [key,name] of Object.entries(themeMap)){
      const c=next[key];if(/^#[0-9A-Fa-f]{6}$/.test(c))document.documentElement.style.setProperty(name,c);
    }
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
