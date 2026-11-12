
/* pause looping CSS animations in blocks that are off-screen */
(()=>{const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('zz',!e.isIntersecting)),{rootMargin:'120px 0px'});
document.querySelectorAll('body > header, body > section, body > footer, main > section, main > header, .hero, .stage, .skills, .cta').forEach(el=>io.observe(el));})();
