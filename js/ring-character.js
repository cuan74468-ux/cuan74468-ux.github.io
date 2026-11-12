try{var n=navigator;if((n.hardwareConcurrency&&n.hardwareConcurrency<=2)||(n.deviceMemory&&n.deviceMemory<=2))document.documentElement.classList.add('lite')}catch(e){}

(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s);

const DEFAULT_PROJECTS = [{"id": "umkm-pos", "nama": "UMKM Juara POS (Kasir Sederhana)", "kategori": "WebApp UMKM", "peek_text": "Aplikasi Kasir Ringan • Supabase & Cetak Struk Thermal Bluetooth", "deskripsi": "Aplikasi Point of Sale yang telah dibersihkan total dari over-engineering desktop menjadi POS sederhana yang super ringan, stabil di HP/Tablet Android, dan terhubung langsung ke printer thermal Bluetooth (Smartcom RPP02N via RawBT).", "thumbnail": "assets/proyek-pos-sederhana.jpg", "link": "https://wa.me/6289509016792?text=Halo%20Bang%20Ferry,%20saya%20ingin%20coba%20demo%20UMKM%20Juara%20POS", "featured_ring": true}, {"id": "ai-photo", "nama": "AI Commercial Product Photography", "kategori": "AI Creative", "peek_text": "Visual Produk F&B & Kemasan UMKM Sekelas Studio Profesional", "deskripsi": "Mengubah foto produk UMKM sederhana dari kamera HP menjadi visual iklan komersial dramatis (seperti efek splash madu sinematik dan roti keju hangat) siap tayang untuk katalog digital dan media sosial.", "thumbnail": "assets/ai-photography-cover.svg", "link": "https://wa.me/6289509016792?text=Halo%20Bang%20Ferry,%20saya%20tertarik%20layanan%20Foto%20Produk%20AI", "featured_ring": true}, {"id": "kurir-juara", "nama": "Kurir Juara & Katalog Merchant", "kategori": "Logistik Lokal", "peek_text": "Platform Pengiriman Lokal, Katalog Kuliner, & Jastip Terintegrasi WA", "deskripsi": "Ekosistem katalog digital merchant lokal dan layanan pengantaran/jastip daerah yang memudahkan warga memesan produk UMKM langsung terhubung ke WhatsApp kurir dan toko.", "thumbnail": "assets/kurir-juara.jpg", "link": "https://wa.me/6289509016792?text=Halo%20Bang%20Ferry,%20mau%20tanya%20sistem%20Kurir%20Juara%20%26%20Katalog", "featured_ring": true}, {"id": "ebook-lms", "nama": "Ebook Vibe Coder & 1-Page LMS", "kategori": "Edukasi Digital", "peek_text": "Panduan Praktis Merakit WebApp Modern Tanpa Latar Belakang IT", "deskripsi": "Kurikulum belajar mandiri, Ebook Vibe Coder Otodidak, dan modul Komunitas Ngulik Digital untuk membantu pemilik usaha menguasai kolaborasi Multi-AI dan arsitektur aplikasi gratis.", "thumbnail": "assets/ebook-lms.jpg", "link": "https://wa.me/6289509016792?text=Halo%20Bang%20Ferry,%20saya%20mau%20akses%20Ebook%20Vibe%20Coder%20%26%20LMS", "featured_ring": true}, {"id": "zero-cost-stack", "nama": "40+ Demo WebApp & Template GAS", "kategori": "Template WebApp", "peek_text": "Katalog Aplikasi Kasir, Absensi WA Fonnte, & Template Siap Duplikasi", "deskripsi": "Koleksi 40+ aplikasi web siap pakai dan 4 Blueprint Skill AI (GitHub Pages + GAS, Full GAS PWA, Supabase, Firebase) yang membebaskan UMKM dari tagihan server bulanan.", "thumbnail": "assets/proyek-smartlink.jpg", "link": "https://wa.me/6289509016792?text=Halo%20Bang%20Ferry,%20saya%20ingin%20lihat%2040%2B%20Demo%20WebApp%20%26%20Template", "featured_ring": true}];
const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = (value, image=false) => {
  try { const u=new URL(value,document.baseURI); if(u.protocol==='https:' || (image && u.origin===location.origin && /^(assets\/|\.\/assets\/)/.test(value))) return u.href; } catch {}
  return image ? '' : 'https://wa.me/6289509016792';
};
let PROJECTS = DEFAULT_PROJECTS.map(p=>({...p,name:p.nama}));
window.STUDIO={projects:PROJECTS,escapeHTML,safeURL};
const cardHTML = p => `<a class="card" href="#case/${escapeHTML(p.id)}" data-id="${escapeHTML(p.id)}" aria-label="Lihat studi kasus ${escapeHTML(p.nama)}" draggable="false"><span class="in"><span class="project-type">${escapeHTML(p.kategori)}</span><span class="art" aria-hidden="true"><img src="${escapeHTML(safeURL(p.thumbnail,true))}" alt="" draggable="false" decoding="async"></span><span class="face"><span class="go" aria-hidden="true">↗</span><span class="name">${escapeHTML(p.nama)}</span></span></span></a>`;
function bindImageFallback(el){ el.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{ const note=document.createElement('span');note.className='image-note';note.textContent='Visual karya segera diperbarui';img.replaceWith(note); },{once:true})); }

/* ================= RING ================= */
const ring = $('#ring'), inner = $('#ringInner');
const COPIES = 4, N = PROJECTS.length * COPIES, STEP = 360 / N;
for (let i = 0; i < N; i++) inner.insertAdjacentHTML('beforeend', cardHTML(PROJECTS[i % PROJECTS.length]));
const cards = [...inner.children];
cards.forEach(c=>bindImageFallback(c));
cards.forEach((c, i) => { if (i >= PROJECTS.length) c.tabIndex = -1; });
let R = 900, D = 360, rot = 0, vel = 0, auto = reduce ? 0 : 7, hover = false, dragging = false;

function sizeRing(){
  const w = ring.clientWidth;
  const cw = Math.max(138, Math.min(301, w * .23));
  R = Math.max(541, w * .811);
  D = R * .42;
  ring.style.setProperty('--cw', cw + 'px');
  ring.style.setProperty('--ch', (cw * 1.33) + 'px');
  ring.style.setProperty('--P', R + 'px');
  layoutRing();
}
function layoutRing(){
  for (let i = 0; i < N; i++){
    let th = ((rot + i * STEP) % 360 + 540) % 360 - 180;
    const a = Math.abs(th);
    const c = cards[i];
    if (a > 84){ if (c.style.visibility !== 'hidden'){ c.style.visibility = 'hidden'; } continue; }
    if (c.style.visibility !== 'visible') c.style.visibility = 'visible';
    c.style.transform = `translateZ(${R - D}px) rotateY(${-th}deg) translateZ(${-R}px)`;
    const op = a > 66 ? Math.max(0, 1 - (a - 66) / 18).toFixed(2) : '1';
    if (c.style.opacity !== op) c.style.opacity = op;
  }
}
let last = performance.now(), ringVisible = true;
function ringTick(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!dragging){
    if (hover){ vel = 0; } const target = hover ? 0 : auto;
    vel += (target - vel) * Math.min(1, dt * (Math.abs(vel) > auto + 1 ? 1.6 : 3));
    rot += vel * dt;
  }
  if (ringVisible && !window.__pauseAnim) layoutRing();
  if (ringVisible) requestAnimationFrame(ringTick); else ringSleeping = true;
}
let ringSleeping = false;
// drag
let px = 0, moved = 0, lastMoveT = 0;
let pressedCard = null;
ring.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  pressedCard = e.target.closest('.card');           // remember exactly what was pressed
  if (pressedCard && e.pointerType !== 'touch') e.preventDefault(); // no focus on press, so the card stays put
  dragging = true; moved = 0; px = e.clientX; lastMoveT = performance.now(); vel = 0;
  ring.setPointerCapture(e.pointerId); ring.classList.add('dragging');
});
ring.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - px; px = e.clientX; moved += Math.abs(dx);
  const deg = dx * (90 / ring.clientWidth) * 1.1;
  rot += deg;
  const now = performance.now(); const dt = Math.max(.008, (now - lastMoveT) / 1000); lastMoveT = now;
  vel = vel * .6 + (deg / dt) * .4;
});
const endDrag = e => {
  if (!dragging) return; dragging = false; ring.classList.remove('dragging');
  vel = Math.max(-260, Math.min(260, vel));
  if (moved < 8 && pressedCard){
    vel = 0;                                         // freeze the ring on a tap
    openCase(pressedCard.dataset.id, true);
  }
  pressedCard = null;
};
ring.addEventListener('pointerup', endDrag);
ring.addEventListener('pointercancel', () => { dragging = false; pressedCard = null; ring.classList.remove('dragging'); });
inner.addEventListener('click', e => { const c = e.target.closest('.card'); if (c){ e.preventDefault(); if (e.detail === 0) openCase(c.dataset.id, true); }});
inner.addEventListener('pointerover', e => { if (e.target.closest('.card') && e.pointerType === 'mouse'){ hover = true; vel = 0; } });
inner.addEventListener('pointerout', e => { if (!e.relatedTarget || !e.relatedTarget.closest?.('.card')) hover = false; });
cards.forEach((c,i) => c.addEventListener('focus', () => { // keyboard (Tab) only: bring focused card to front
  if (!c.matches(':focus-visible')) return;          // a mouse/touch press must never rotate the ring
  rot = -i * STEP; vel = 0; hover = true; }));
cards.forEach(c => c.addEventListener('blur', () => hover = false));
addEventListener('resize', sizeRing);
sizeRing();
requestAnimationFrame(ringTick);
(() => {                                              // watch real frame times once; slow device -> lighter effects
  const ts = []; let t0 = 0;
  const f = t => { if (!t0) t0 = t; ts.push(t);
    if (t - t0 < 2500) return requestAnimationFrame(f);
    const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b), med = d[d.length >> 1] || 0;
    if (med > 24 || (navigator.hardwareConcurrency || 8) <= 2) document.documentElement.classList.add('lite'); };
  setTimeout(() => requestAnimationFrame(f), 1200);
})();


/* ================= PROJECT PEEK ================= */
const PEEK = Object.fromEntries(PROJECTS.map(p=>[p.id,{c:"#5b49ff",t:p.peek_text}]));
const peek = $('#peek');
if (peek && matchMedia('(hover:hover) and (pointer:fine)').matches){
  let cur = null, timer = 0, raf = 0;
  const place = () => {
    if (!cur) return;
    const r = (cur.querySelector('.in') || cur).getBoundingClientRect(), pw = peek.offsetWidth, ph = peek.offsetHeight, vw = innerWidth, vh = innerHeight, g = 14;
    const lift = 0;                                  // the face rect already includes the hover lift
    let x = Math.max(12, Math.min(vw - pw - 12, r.left + r.width / 2 - pw / 2));
    let y = r.top - lift - g - ph;
    if (y < 8) y = 8;
    peek.style.left = Math.round(x) + 'px'; peek.style.top = Math.round(y) + 'px';
    raf = requestAnimationFrame(place);
  };
  const show = card => {
    const d = PEEK[card.dataset.id]; if (!d) return;
    clearTimeout(timer); cancelAnimationFrame(raf);
    const same = cur === card; cur = card;
    if (!same || !peek.classList.contains('on')){
      peek.style.setProperty('--c', d.c);
      peek.innerHTML = `<p class="t"><i></i><span>${escapeHTML(d.t)}</span></p>`;
    }
    place();
    timer = setTimeout(() => { if (cur === card && !dragging) peek.classList.add('on'); }, 160);
  };
  const hide = () => { clearTimeout(timer); cur = null; cancelAnimationFrame(raf); peek.classList.remove('on'); };
  inner.addEventListener('pointerover', e => { const c = e.target.closest('.card'); if (c && e.pointerType === 'mouse' && c !== cur) show(c); });
  inner.addEventListener('pointerout', e => { if (!e.relatedTarget || !e.relatedTarget.closest?.('.card')) hide(); });
  ring.addEventListener('pointerdown', hide); inner.addEventListener('click', hide);
  cards.forEach(c => { c.addEventListener('focus', () => { if (c.matches(':focus-visible')) show(c); }); c.addEventListener('blur', hide); });
  addEventListener('scroll', hide, {passive:true});
}


/* Dynamic case records and in-place ring refresh: preserve transforms and pointer handlers. */
const CASE = Object.fromEntries(PROJECTS.map(p=>[p.id,{...p,bg:'#fafafc'}]));
window.STUDIO.cases=CASE;
window.STUDIO.updateProjects = rows => {
  if(!Array.isArray(rows)) return;
  const clean=rows.filter(p=>p && /^[a-z0-9][a-z0-9-]{0,59}$/.test(p.id) && typeof p.nama==='string').map(p=>({...p,name:p.nama,featured_ring:p.featured_ring===true||String(p.featured_ring).toLowerCase()==='true'}));
  if(!clean.length)return;
  const featured=clean.filter(p=>p.featured_ring).slice(0,5);
  for(const p of DEFAULT_PROJECTS)if(featured.length<5&&!featured.some(x=>x.id===p.id))featured.push(clean.find(x=>x.id===p.id)||p);
  PROJECTS=featured;
  window.STUDIO.projects=clean;
  for(const key of Object.keys(CASE))delete CASE[key];
  for(const p of [...featured,...clean]){ CASE[p.id]={...p,bg:'#fafafc'};PEEK[p.id]={c:'#5b49ff',t:p.peek_text}; }
  cards.forEach((card,i)=>{
    const p=PROJECTS[i%5],t=document.createElement('template');t.innerHTML=cardHTML(p);const replacement=t.content.firstElementChild;
    card.dataset.id=p.id;card.href='#case/'+p.id;card.setAttribute('aria-label',replacement.getAttribute('aria-label'));
    card.replaceChildren(...replacement.childNodes);bindImageFallback(card);
  });
  dispatchEvent(new CustomEvent('studio:projects'));
};
const veil=document.createElement('div');veil.className='case-veil';veil.setAttribute('aria-hidden','true');veil.innerHTML='<i></i>';document.body.append(veil);
let going=false,lastPress=null;
window.goCase = id => {
  if(!CASE[id])return false;if(going)return true;going=true;
  const pt=lastPress||{x:innerWidth/2,y:innerHeight/2},far=Math.hypot(Math.max(pt.x,innerWidth-pt.x),Math.max(pt.y,innerHeight-pt.y));
  veil.style.setProperty('--x',pt.x+'px');veil.style.setProperty('--y',pt.y+'px');veil.style.setProperty('--k',((far*2+80)/240).toFixed(2));veil.style.setProperty('--vbg','#fafafc');
  window.__pauseAnim=true;veil.classList.add('on');
  setTimeout(()=>{window.STUDIO.showCase?.(id);veil.classList.remove('on');going=false;},reduce?0:650);
  return true;
};
ring.addEventListener('pointerdown',e=>{lastPress={x:e.clientX,y:e.clientY};},true);
addEventListener('keydown',()=>{lastPress=null;},true);

/* ================= CHARACTER ================= */
const cv = $('#char'), ctx = cv.getContext('2d');
const IMG_W = 930, IMG_H = 1536;
const img = new Image(), plate = new Image();
img.src = 'assets/char.webp'; plate.src = 'assets/plate.png';
/* Character control: preserve pixel-precise animated mode for calibrated local assets.
   Uncalibrated/external images are shown as static artwork rather than a broken animation. */
window.STUDIO.setCharacter = ({mode='animated',image='assets/char.webp'}={}) => {
  const host=document.querySelector('.character');
  if(!host)return;
  host.hidden=mode==='hidden';
  if(mode==='hidden')return;
  const isLocal=/^(?:\.\/)?assets\/[a-zA-Z0-9._/-]+$/.test(image)&&!image.includes('..');
  const animated=mode==='animated'&&isLocal;
  let still=host.querySelector('.cms-character-still');
  if(!animated){
    if(!still){still=document.createElement('img');still.className='cms-character-still';still.alt='Ilustrasi karakter Linggau AI Studio';host.append(still);}
    const url=window.STUDIO.safeURL(image,true);if(url)still.src=url;
    cv.hidden=true;still.hidden=false;
  }else{
    if(still)still.hidden=true;
    cv.hidden=false;
    const url=window.STUDIO.safeURL(image,true);
    if(url&&img.src!==url)img.src=url;
  }
};
const PLATE = [566, 414, 76, 62];
const FA = {poly:[[606,421],[616,429],[626,440],[632,451],[636,460],[632,464],[625,463],[618,457],[610,446],[603,437],[598,430]], pivot:[601,428], max:-.2, v:0};
const FB = {poly:[[578,444],[588,447],[597,455],[604,462],[606,468],[601,471],[594,469],[586,462],[577,455],[572,450]], pivot:[576,448], max:-.17, v:0};
const EYE_L = {poly:[[515,124],[520,122.5],[525,122.8],[530,124.2],[535,125.9],[540.6,128.6],[540.5,130.9],[537.5,132.7],[532,133.3],[525,131.3],[518.6,128.6]], c:[531.2,128.4], r:5.7};
const EYE_R = {poly:[[559.6,142.2],[565,140.1],[571,140.9],[576.4,143.6],[577.6,145.7],[573.8,148.3],[568.8,149],[562.6,146.4]], c:[568.6,144.9], r:4.7};
const LID = [[735,287],[903,305],[838,483],[672,470]];
const LIGHTS = [[120,170,255],[170,140,255],[255,214,150],[120,235,205],[255,150,200],[200,225,255]];
let lightCol = LIGHTS[0].slice(), lightTarget = LIGHTS[0], lightLevel = .9, nextLight = 0;
let gaze = {x:0,y:0}, gazeT = {x:0,y:0}, nextGaze = 0, readStep = 0;
let blink = 0, blinkStart = -1, nextBlink = 1500;
let typing = true, phaseEnd = 2600, nextTap = 0;
const off = document.createElement('canvas'), octx = off.getContext('2d');
const base = document.createElement('canvas'), bctx = base.getContext('2d');
let dpr = 1, charVisible = true, baseReady = false;
// Only this part of the picture ever changes (screen light, face, eyes, typing hands), in image pixels.
const DIRTY = [300, 0, 630, 700];
let RX = 0, RY = 0, RW = 1, RH = 1;

function sizeChar(){
  const r = cv.getBoundingClientRect();
  dpr = Math.min(1.5, devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.height * dpr));
  base.width = cv.width; base.height = cv.height;
  const s = cv.width / IMG_W;
  RX = Math.floor(DIRTY[0] * s); RY = Math.floor(DIRTY[1] * s);
  RW = Math.min(cv.width - RX, Math.ceil((DIRTY[0] + DIRTY[2]) * s) - RX + 1);
  RH = Math.min(cv.height - RY, Math.ceil((DIRTY[1] + DIRTY[3]) * s) - RY + 1);
  off.width = RW; off.height = RH;
  baseReady = false;
}
function paintBase(){                                 // the still character, drawn once per size
  if (!img.complete || !img.naturalWidth) return;
  const s = cv.width / IMG_W;
  bctx.setTransform(1,0,0,1,0,0); bctx.clearRect(0,0,base.width,base.height);
  bctx.setTransform(s,0,0,s,0,0); bctx.drawImage(img, 0, 0, IMG_W, IMG_H);
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height); ctx.drawImage(base, 0, 0);
  baseReady = true;
}
const path = (c, pts) => { c.beginPath(); pts.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); };
const rand = (a,b) => a + Math.random() * (b - a);

function drawFinger(f){
  ctx.save();
  ctx.translate(f.pivot[0], f.pivot[1]); ctx.rotate(f.v * f.max); ctx.translate(-f.pivot[0], -f.pivot[1]);
  path(ctx, f.poly); ctx.clip();
  if (!f.box){ const xs = f.poly.map(p=>p[0]), ys = f.poly.map(p=>p[1]);
    const x = Math.floor(Math.min(...xs)) - 14, y = Math.floor(Math.min(...ys)) - 14;
    f.box = [x, y, Math.ceil(Math.max(...xs)) + 14 - x, Math.ceil(Math.max(...ys)) + 14 - y]; }
  const [bx, by, bw, bh] = f.box;
  const k = img.naturalWidth / IMG_W; ctx.drawImage(img, bx*k, by*k, bw*k, bh*k, bx, by, bw, bh);      // only the finger's own patch
  ctx.restore();
}
function drawEye(e, gx, gy, b){
  const xs = e.poly.map(p=>p[0]), ys = e.poly.map(p=>p[1]);
  const top = Math.min(...ys), bot = Math.max(...ys), left = Math.min(...xs), right = Math.max(...xs);
  ctx.save(); path(ctx, e.poly); ctx.clip();
  let g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, '#b99a8c'); g.addColorStop(.45, '#efe4de'); g.addColorStop(1, '#dccbc2');
  ctx.fillStyle = g; ctx.fillRect(left-2, top-2, right-left+4, bot-top+4);
  const cx = e.c[0] + gx, cy = e.c[1] + gy;
  g = ctx.createRadialGradient(cx, cy+1, 0, cx, cy, e.r);
  g.addColorStop(0, '#6a3b22'); g.addColorStop(.55, '#3a1d10'); g.addColorStop(1, '#170905');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, e.r, 0, 7); ctx.fill();
  ctx.fillStyle = '#080302'; ctx.beginPath(); ctx.arc(cx, cy, e.r*.44, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.arc(cx - e.r*.35, cy - e.r*.38, e.r*.2, 0, 7); ctx.fill();
  g = ctx.createLinearGradient(0, top, 0, top + (bot-top)*.55);
  g.addColorStop(0, 'rgba(70,28,10,.6)'); g.addColorStop(1, 'rgba(70,28,10,0)');
  ctx.fillStyle = g; ctx.fillRect(left-2, top-2, right-left+4, bot-top+4);
  if (b > 0){
    const y = top - 1 + (bot - top + 2) * b;
    g = ctx.createLinearGradient(0, top, 0, y);
    g.addColorStop(0, '#d47a49'); g.addColorStop(1, '#b8603a');
    ctx.fillStyle = g; ctx.fillRect(left-2, top-3, right-left+4, y - top + 3);
    ctx.strokeStyle = 'rgba(28,10,4,.95)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(left-2, y - .5 + (b>.9?1:0)); ctx.quadraticCurveTo((left+right)/2, y + 1.2, right+2, y + .5); ctx.stroke();
  }
  ctx.restore();
}
function lightLayer(now){
  // build light on offscreen in image coordinates, masked by the character
  const s = cv.width / IMG_W;
  octx.setTransform(1,0,0,1,0,0); octx.globalCompositeOperation = 'source-over';
  octx.clearRect(0,0,off.width,off.height);
  octx.setTransform(s,0,0,s,-RX,-RY);
  const [r,g,b] = lightCol.map(Math.round);
  const grd = octx.createRadialGradient(690, 300, 10, 640, 300, 420);
  grd.addColorStop(0, `rgba(${r},${g},${b},${lightLevel})`);
  grd.addColorStop(.5, `rgba(${r},${g},${b},${lightLevel*.45})`);
  grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
  octx.fillStyle = grd; octx.fillRect(300, 0, 630, 700);
  octx.globalCompositeOperation = 'destination-out';
  path(octx, LID); octx.fill();
  octx.globalCompositeOperation = 'destination-in';
  const k = img.naturalWidth / IMG_W;             // the file is smaller than the 930-wide drawing space
  octx.drawImage(img, DIRTY[0]*k, DIRTY[1]*k, DIRTY[2]*k, DIRTY[3]*k, DIRTY[0], DIRTY[1], DIRTY[2], DIRTY[3]);
}
function easeTo(cur, tgt, k){ return cur + (tgt - cur) * k; }

let t0 = performance.now(), lastC = t0, lastDraw = 0;
function charTick(now){
  if (!charVisible) { charSleeping = true; return; }
  requestAnimationFrame(charTick);
  if (!img.complete || !img.naturalWidth) { lastC = now; return; }
  if (window.__pauseAnim) return;
  if (now - lastDraw < (document.documentElement.classList.contains('lite') ? 48 : 31)) return; lastDraw = now;
  if (!baseReady) paintBase();
  const dt = Math.min(64, now - lastC); lastC = now; const t = now - t0;

  if (!reduce){
    // typing rhythm
    if (t > phaseEnd){ typing = !typing; phaseEnd = t + (typing ? rand(1800, 4200) : rand(700, 1800)); }
    if (typing && t > nextTap){
      const f = Math.random() < .55 ? FA : FB;
      f.tap = t; nextTap = t + rand(85, 190);
    }
    for (const f of [FA, FB]){
      const k = f.tap ? (t - f.tap) : 999;
      f.v = k < 55 ? k / 55 : k < 130 ? 1 - (k - 55) / 75 : 0;
    }
    // gaze: reading pattern along the screen
    if (t > nextGaze){
      if (!typing && Math.random() < .25){ gazeT = {x: rand(-1, 2.5), y: rand(-2.4, -1.4)}; nextGaze = t + rand(500, 900); readStep = 0; }
      else {
        readStep++;
        if (readStep > 5){ readStep = 0; gazeT = {x:-3.2, y: rand(-.4, 1)}; }
        else gazeT = {x: -3.2 + readStep * rand(.9, 1.2), y: gazeT.y + rand(-.15, .2)};
        nextGaze = t + rand(170, 380);
      }
      gazeT.y = Math.max(-2.4, Math.min(1.2, gazeT.y));
    }
    const k = 1 - Math.pow(.0005, dt / 1000 * 2.2);
    gaze.x = easeTo(gaze.x, gazeT.x, Math.min(1, k * 4)); gaze.y = easeTo(gaze.y, gazeT.y, Math.min(1, k * 4));
    // blink
    if (t > nextBlink && blinkStart < 0){ blinkStart = t; }
    if (blinkStart >= 0){
      const bt = t - blinkStart;
      blink = bt < 70 ? bt / 70 : bt < 110 ? 1 : bt < 210 ? 1 - (bt - 110) / 100 : 0;
      if (bt >= 210){ blinkStart = -1; blink = 0; nextBlink = t + (Math.random() < .18 ? 180 : rand(2400, 5600)); }
    }
    // screen light
    if (t > nextLight){ lightTarget = LIGHTS[(Math.random() * LIGHTS.length) | 0]; nextLight = t + rand(1800, 4600); }
    lightCol = lightCol.map((c, i) => easeTo(c, lightTarget[i], Math.min(1, dt / 500)));
    const flick = Math.sin(t / 130) * .03 + Math.sin(t / 47) * .02 + (typing ? .04 : 0) + (FA.v + FB.v) * .02;
    lightLevel = easeTo(lightLevel, .78 + flick, .2);
    // breathing
    cv.style.transform = `scale(${1 + Math.sin(t / 900) * .0035}, ${1 + Math.sin(t / 900) * .007})`;
  }

  const s = cv.width / IMG_W;
  // redraw only the changing area: clear it, lay the screen-light spill, then the cached still picture on top
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0); ctx.beginPath(); ctx.rect(RX, RY, RW, RH); ctx.clip(); ctx.clearRect(RX, RY, RW, RH);
  ctx.setTransform(s,0,0,s,0,0);
  const [r,g,b] = lightCol.map(Math.round);
  const sp = ctx.createRadialGradient(735, 300, 0, 735, 300, 150);
  sp.addColorStop(0, `rgba(${r},${g},${b},${.35*lightLevel})`); sp.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = sp; ctx.fillRect(585, 150, 300, 300);
  ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(base, RX, RY, RW, RH, RX, RY, RW, RH);
  ctx.setTransform(s,0,0,s,0,0);
  if (plate.complete && plate.naturalWidth && (FA.v > 0 || FB.v > 0)) ctx.drawImage(plate, ...PLATE);
  drawFinger(FB); drawFinger(FA);
  drawEye(EYE_L, gaze.x, gaze.y, blink);
  drawEye(EYE_R, gaze.x * .85, gaze.y * .9, blink);
  // light on face / chest
  lightLayer(now);
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .9; ctx.drawImage(off, RX, RY);
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .28; ctx.drawImage(off, RX, RY);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.restore();
}
img.addEventListener('load', () => { sizeChar(); paintBase(); });
addEventListener('resize', sizeChar);
sizeChar();
requestAnimationFrame(charTick);

const stage = $('.stage');
let charSleeping = false;
new IntersectionObserver(([e]) => {
  charVisible = ringVisible = e.isIntersecting;
  if (e.isIntersecting){
    const n = performance.now();
    if (ringSleeping){ ringSleeping = false; last = n; requestAnimationFrame(ringTick); }
    if (charSleeping){ charSleeping = false; lastC = n; requestAnimationFrame(charTick); }
  }
}, {rootMargin:'100px'}).observe(stage);

})();
