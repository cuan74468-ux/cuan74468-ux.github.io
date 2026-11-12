/* Shared schema between the public page renderer and the editor workspace. */
(()=>{'use strict';
  const entries = [];
  function field(group,key,label,selector,mode='text',type='text') {
    entries.push({group,key,label,selector,mode,type});
  }
  field('Identitas & SEO','seo.ogImage','Gambar pratinjau media sosial',null,'special','image');
  field('Identitas & SEO','seo.siteName','Nama brand',null,'special');
  // Identity and navigation
  field('Identitas & SEO','seo.title','Judul browser / SEO','title');
  field('Identitas & SEO','seo.description','Deskripsi mesin pencari','meta[name="description"]','content','textarea');
  field('Navigasi','nav.status','Status ketersediaan','.nav .status','lastDirect');
  field('Navigasi','nav.work','Menu karya','.nav a[data-sec="work"]');
  field('Navigasi','nav.about','Menu tentang','.nav a[data-sec="about"]');
  field('Navigasi','nav.contact','Menu kontak','.nav a[data-sec="contact"]');
  field('Navigasi','nav.quickWaLabel','Teks tombol WhatsApp','.nav .quick-wa');
  field('Navigasi','nav.emailTitle','Tooltip email di navbar','.nav .mail','aria-label');
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
  field('Hero','hero.ctaUrl','Tujuan tombol utama','.hero .actions a','href','link');
  field('Hero','hero.ringLabel','Label karya pada carousel','#work','aria-label');
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
  for(let i=1;i<=10;i++)field('Keahlian','skills.color'+i,'Warna chip '+i,'.pit .chip:nth-child('+i+')','chipColor','color');
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
  for(let i=1;i<=5;i++)field('Kontak','contact.tile'+i+'Name','Nama ikon melayang '+i,'#contact .tiles .tile:nth-child('+i+')','data-name');
  for(let i=1;i<=5;i++)field('Kontak','contact.tile'+i+'Icon','Simbol ikon melayang '+i,'#contact .tiles .tile:nth-child('+i+')','svg-use','icon');
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
  field('Formulir','form.submitStatus','Status berhasil mengirim',null,'virtual','textarea');
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
  field('Tema visual','theme.bodyFont','Font teks isi',null,'special','font');
  field('Tema visual','theme.headingFont','Font judul',null,'special','font');

window.STUDIO_SCHEMA=Object.freeze(entries.map(field=>Object.freeze(field)));
})();
