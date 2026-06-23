/* ============================================================
   ZERO CÓDIGO — versão simples · vanilla, zero dependências
   ============================================================ */
(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = $('#nav');
  const prog = $('#ideProgress');

  let docMax = 0;
  function measure(){ docMax = document.documentElement.scrollHeight - innerHeight; }
  addEventListener('load', measure);
  addEventListener('resize', measure, { passive: true });
  measure();

  function onScroll(){
    const y = scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 30);
    if (prog) prog.style.width = (docMax > 0 ? (y / docMax) * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* reveal on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  /* contador da conta */
  const profit = $('#profit');
  if (profit) {
    const target = +profit.dataset.target;
    const fmt = (n) => 'R$' + Math.round(n).toLocaleString('pt-BR');
    let done = false;
    const cio = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting || done) return;
        done = true; cio.disconnect();
        if (reduce){ profit.textContent = fmt(target); return; }
        const dur = 1400, t0 = performance.now();
        const step = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          profit.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    cio.observe(profit);
  }

  /* FAQ — abre e fecha */
  $$('[data-faq]').forEach((item) => {
    const head = $('.faq-head', item);
    const body = $('.faq-body', item);
    if (!head || !body) return;
    head.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      body.style.maxHeight = open ? body.scrollHeight + 'px' : '0';
    });
  });

  /* rolagem suave com folga pro menu fixo */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      scrollTo({ top: t.getBoundingClientRect().top + scrollY - 70, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
})();
