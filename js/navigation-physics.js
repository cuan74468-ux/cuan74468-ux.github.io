
/* nav active state + case overlay + skills pit + copy (kept separate so a failure in the canvas code can't block navigation) */
(() => {
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const navLinks = [...document.querySelectorAll('.nav ul a')];
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-active', a.dataset.sec === en.target.id)); });
}, {rootMargin:'-45% 0px -50% 0px'});
['work','about','contact'].forEach(id => io.observe(document.getElementById(id)));

/* toast + copy */
const toast = $('#toast'); let tt;
const say = m => { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); };
$('#copyEmail').addEventListener('click', async () => {
  const txt = ($('#copyEmail code')?.textContent||'peyaje531@gmail.com').trim();
  try { await navigator.clipboard.writeText(txt); say('Email disalin'); }
  catch { const r = document.createRange(); r.selectNodeContents($('#copyEmail code')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); say('Email dipilih. Tekan Ctrl+C untuk menyalin'); }
});

/* Accessible case overlay with deep links and browser Back. */
const caseEl=$('#case');let lastFocus=null,returnHash='#work',fromPage=false;
function showCase(id){
 const p=window.STUDIO?.cases[id];if(!p)return;
 $('#caseTitle').textContent=p.nama;$('#caseCategory').textContent=p.kategori;$('#caseDescription').textContent=p.deskripsi;
 const img=document.createElement('img');img.src=window.STUDIO.safeURL(p.thumbnail,true);img.alt=p.nama;img.onerror=()=>{img.hidden=true;};$('#caseCover').replaceChildren(img);
 $('#caseLink').href=window.STUDIO.safeURL(p.link);$('#catalogList').hidden=true;
 caseEl.hidden=false;caseEl.classList.add('open');document.body.classList.add('locked');window.__pauseAnim=true;caseEl.scrollTop=0;$('#backBtn').focus({preventScroll:true});
 document.querySelector('main').inert=true;document.querySelector('.nav').inert=true;document.querySelector('footer').inert=true;
}
function hideCase(){
 caseEl.hidden=true;caseEl.classList.remove('open');document.body.classList.remove('locked');window.__pauseAnim=false;
 document.querySelector('main').inert=false;document.querySelector('.nav').inert=false;document.querySelector('footer').inert=false;
 lastFocus?.focus?.({preventScroll:true});
}
window.STUDIO.showCase=showCase;
window.openCase=(id)=>{if(!window.STUDIO.cases[id])return;lastFocus=document.activeElement;returnHash=location.hash||'#work';fromPage=true;history.pushState({case:id},'','#case/'+id);if(!window.goCase?.(id))showCase(id);};
function routeCase(){const id=location.hash.startsWith('#case/')?location.hash.slice(6):'';if(window.STUDIO.cases[id])showCase(id);else if(!caseEl.hidden)hideCase();}
addEventListener('popstate',routeCase);addEventListener('hashchange',routeCase);
addEventListener('studio:projects',()=>{if(!caseEl.hidden)routeCase();});
$('#backBtn').addEventListener('click',()=>{hideCase();if(fromPage){fromPage=false;history.back();}else history.replaceState(null,'',returnHash);});
caseEl.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#backBtn').click();return;}if(e.key==='Tab'){const f=[...caseEl.querySelectorAll('button,a[href],input')].filter(x=>!x.closest('[hidden]'));const first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$('#catalogButton').addEventListener('click',()=>{
 const list=$('#catalogList');list.replaceChildren();list.hidden=false;
 const info=document.createElement('p');info.textContent=window.STUDIO.site?.values()['case.catalogIntro']||'Karya yang sudah tersedia di katalog. Untuk koleksi lengkap 40+ karya, hubungi Ferry.';list.append(info);
 const grid=document.createElement('div');grid.className='catalog-grid';
 window.STUDIO.projects.forEach(p=>{const b=document.createElement('button');b.className='catalog-item';const title=document.createElement('strong'),desc=document.createElement('small');title.textContent=p.nama;desc.textContent=p.peek_text;b.append(title,desc);b.onclick=()=>{history.replaceState({case:p.id},'','#case/'+p.id);showCase(p.id);};grid.append(b);});list.append(grid);
 const link=document.createElement('a');link.className='btn btn-dark';link.href='https://wa.me/'+(window.STUDIO.site?.values()['contact.whatsapp']||'6289509016792')+'?text='+encodeURIComponent('Halo Bang Ferry, minta katalog lengkap 40+ karya');link.target='_blank';link.rel='noopener';link.textContent=window.STUDIO.site?.values()['case.catalogRequest']||'Minta katalog lengkap via WhatsApp ↗';list.append(link);list.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});
});
routeCase();

/* skills pit physics */
const pit = $('#pit');
if (window.Matter && !reduce){
  const {Engine, Bodies, Composite, Runner, Mouse, MouseConstraint, Body} = Matter;
  let started = false;
  const start = () => {
    if (started) return; started = true;
    const chips = [...pit.querySelectorAll('.chip')];
    const sizes = chips.map(c => [c.offsetWidth, c.offsetHeight]);
    const box = pit.closest('.skills'); box.style.height = box.offsetHeight + 'px';
    pit.classList.add('live');
    let W = pit.clientWidth, H = pit.clientHeight;
    const engine = Engine.create({gravity:{y:1.6}, enableSleeping:true});
    const wall = {isStatic:true, render:{visible:false}};
    const BIG = 8000;
    const floor = Bodies.rectangle(W/2, H + 30, BIG, 60, wall), wl = Bodies.rectangle(-30, H/2, 60, BIG, wall), wr = Bodies.rectangle(W + 30, H/2, 60, BIG, wall);
    Composite.add(engine.world, [floor, wl, wr]);
    let roof = null;
    // the box can change size after load (window resize, side panel opening): keep the walls on its real edges
    const fit = () => {
      const nW = pit.clientWidth, nH = pit.clientHeight; if (!nW || !nH || (nW === W && nH === H)) return;
      W = nW; H = nH;
      Body.setPosition(floor, {x: W/2, y: H + 30}); Body.setPosition(wl, {x: -30, y: H/2}); Body.setPosition(wr, {x: W + 30, y: H/2});
      if (roof) Body.setPosition(roof, {x: W/2, y: -30});
      bodies.forEach(b => Matter.Sleeping.set(b, false));
    };
    // first drop lands in a set arrangement: a ground row spread edge to edge, three pills resting on top, one leaning at the end
    const GROUND = ['AI Product Photography','Google Sheets + GAS','Vibe Coding Workflow','WhatsApp Automation','Zero-Cost WebApp','Ready-to-Clone Templates','Ebook & 1-Page LMS'];
    const TOP = {'AI Video Ads':['AI Product Photography',.25], 'POS Kasir UMKM':['Google Sheets + GAS',1], 'Thermal Printer Setup':['Zero-Cost WebApp',.95]};
    const name = c => c.textContent.trim(), byName = {}; chips.forEach((c, i) => byName[name(c)] = i);
    const gi = GROUND.slice(0, -1).map(n => byName[n]).filter(i => i !== undefined), tot = gi.reduce((t, i) => t + sizes[i][0], 0);
    const gap = Math.max(2, Math.min(40, (W - 6 - tot - sizes[byName['Ebook & 1-Page LMS']][0] * .62) / Math.max(1, gi.length)));
    const PX = {}; let cx = 2; gi.forEach(i => { PX[i] = cx + sizes[i][0] / 2; cx += sizes[i][0] + gap; });
    const bodies = chips.map((c, i) => {
      const [w, h] = sizes[i], nm = name(c), top = TOP[nm], tilt = nm === 'Ebook & 1-Page LMS' ? .3 : 0;
      let x = PX[i], row = 0;
      if (top && byName[top[0]] !== undefined){ const g = byName[top[0]]; x = PX[g] - sizes[g][0] / 2 + sizes[g][0] * top[1]; row = 1; }
      if (x === undefined){ x = Math.random() * W; row = 1; }
      if (tilt) x = W - w / 2 - 2;
      x = Math.min(W - w/2 - 2, Math.max(w/2 + 2, x));
      const b = Bodies.rectangle(x, -h - row * 260 - i * 30, w, h,
        {chamfer:{radius:h/2 - 1}, restitution:.51, friction:.3, frictionStatic:1, frictionAir:.012, density:.00434});
      Body.setAngle(b, tilt);
      return b;
    });
    Composite.add(engine.world, bodies);
    if (matchMedia('(pointer:fine)').matches){
      const mouse = Mouse.create(pit);
      mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
      mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
      mouse.element.removeEventListener('wheel', mouse.mousewheel);
      // keep tracking and always release, even when the cursor leaves the box mid-throw (otherwise a pill stays stuck to the cursor)
      window.addEventListener('mousemove', mouse.mousemove);
      window.addEventListener('mouseup', mouse.mouseup);
      pit.addEventListener('dragstart', e => e.preventDefault());
      const mc = MouseConstraint.create(engine, {mouse, constraint:{stiffness:.12, damping:.08, render:{visible:false}}});
      Composite.add(engine.world, mc);
      // resting pills sleep (so they never twitch); grabbing one wakes them all, so nothing is left floating
      Matter.Events.on(mc, 'startdrag', () => bodies.forEach(b => Matter.Sleeping.set(b, false)));
      Matter.Events.on(mc, 'enddrag', e => { bodies.forEach(b => Matter.Sleeping.set(b, false));
        const b = e && e.body; if (b){ const s = Math.hypot(b.velocity.x, b.velocity.y), k = Math.min(.55, 15 / (s || 1));   // a thrown pill leaves the hand slower, like a rock
          Body.setVelocity(b, {x: b.velocity.x * k, y: b.velocity.y * k}); Body.setAngularVelocity(b, b.angularVelocity * .5);
          b.restitution = .51; clearTimeout(b._rt); b._rt = setTimeout(() => b.restitution = .2, 3000); } });   // same soft bounce as the first drop
    }

    // Capture only pills: the empty area remains available for page scrolling.
    {
      let held = null, pointer = null, last = null, speed = {x:0,y:0};
      const release = e => {
        if (e.pointerId !== pointer || !held) return;
        Body.setVelocity(held, e.type === 'pointercancel' ? {x:0,y:0} : speed);
        held = null; pointer = null;
      };
      pit.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' || pointer !== null) return;
        const chip = e.target.closest('.chip'), i = chips.indexOf(chip);
        if (i < 0) return;
        e.preventDefault(); held = bodies[i]; pointer = e.pointerId;
        bodies.forEach(b => Matter.Sleeping.set(b, false));
        last = {x:e.clientX,y:e.clientY,t:performance.now()}; speed = {x:0,y:0};
        chip.setPointerCapture(e.pointerId);
      });
      pit.addEventListener('pointermove', e => {
        if (e.pointerId !== pointer || !held) return;
        e.preventDefault();
        const now = performance.now(), dt = Math.max(8,now-last.t);
        const dx = e.clientX-last.x, dy = e.clientY-last.y;
        speed = {x:Math.max(-18,Math.min(18,dx/dt*16.67)),y:Math.max(-18,Math.min(18,dy/dt*16.67))};
        Body.setPosition(held,{x:Math.max(20,Math.min(W-20,held.position.x+dx)),y:Math.max(24,Math.min(H-24,held.position.y+dy))});
        Body.setVelocity(held,{x:0,y:0});
        last = {x:e.clientX,y:e.clientY,t:now};
      });
      pit.addEventListener('pointerup', release);
      pit.addEventListener('pointercancel', release);
      pit.addEventListener('lostpointercapture', release);
      Matter.Events.on(engine,'beforeUpdate',()=>{if(held){Body.setVelocity(held,{x:0,y:0});held.force.y=0;}});
    }

    const LIM = .32;
    // soft tilt limit: past LIM, steer the spin back toward flat instead of snapping the angle every frame (snapping made pills shake)
    Matter.Events.on(engine, 'afterUpdate', () => bodies.forEach(b => {
      if (b.isSleeping) return;
      const a = Math.atan2(Math.sin(b.angle), Math.cos(b.angle)), over = a > LIM ? a - LIM : a < -LIM ? a + LIM : 0;
      Body.setAngularVelocity(b, over ? b.angularVelocity * .8 - over * .04 : b.angularVelocity * .9);
      // stop slow sideways creep once a pill has basically come to rest
      const v = b.velocity;
      if (Math.abs(v.x) < .25 && Math.abs(v.y) < .25 && Math.abs(b.angularVelocity) < .004) Body.setVelocity(b, {x: v.x * .5, y: v.y});
    }));
    setTimeout(() => { roof = Bodies.rectangle(W/2, -30, BIG, 60, wall); Composite.add(engine.world, roof); }, 2600);
    setTimeout(() => bodies.forEach(b => b.restitution = .2), 3400); // bouncy first drop, calmer after
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(pit); addEventListener('resize', fit);
    let caged = false; setTimeout(() => caged = true, 2600);
    Matter.Events.on(engine, 'afterUpdate', () => { if(!caged) return; bodies.forEach((b, i) => { const [w, h] = sizes[i], p = b.position; if (p.x < 0 || p.x > W || p.y < 0 || p.y > H){ Body.setPosition(b, {x: Math.max(w/2, Math.min(W - w/2, p.x)), y: Math.max(h/2, Math.min(H - h/2, p.y))}); Body.setVelocity(b, {x:0, y:0}); } }); });
    const runner = Runner.create(); Runner.run(runner, engine);
    const prev = chips.map(() => '');
    let drawing = false;
    const draw = () => {
      if (!pitOn){ drawing = false; return; }
      bodies.forEach((b, i) => {
        const [w, h] = sizes[i];
        const t = `translate(${(b.position.x - w/2).toFixed(1)}px,${(b.position.y - h/2).toFixed(1)}px) rotate(${b.angle.toFixed(3)}rad)`;
        if (t !== prev[i]){ prev[i] = t; chips[i].style.transform = t; }
      });
      requestAnimationFrame(draw);
    };
    wake = () => { runner.enabled = pitOn; if (pitOn && !drawing){ drawing = true; requestAnimationFrame(draw); } };
    wake();
  };
  let pitOn = false, wake = () => {};
  new IntersectionObserver(([e]) => { pitOn = e.isIntersecting; if (e.intersectionRatio >= .45) start(); wake(); }, {threshold:[0, .45]}).observe(pit);
}
})();
