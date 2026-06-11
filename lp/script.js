/* ============================================================
   ZERO CÓDIGO — "BUILD MODE" · vanilla, zero deps
   ============================================================ */
(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 861px)').matches;

  const nav = $('#nav');
  const prog = $('#ideProgress');
  const buybar = $('#buybar');
  const hero = $('#hero');

  /* ---------- cached measurements ---------- */
  let docMax = 0, heroTrig = 600;
  function measure() {
    docMax = document.documentElement.scrollHeight - innerHeight;
    heroTrig = (hero ? hero.offsetHeight : 600) * 0.9;
  }
  addEventListener('load', measure);
  addEventListener('resize', measure, { passive: true });
  measure();

  /* ---------- scroll: nav state + progress + buybar ---------- */
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 30);
    if (prog) prog.style.width = (docMax > 0 ? (y / docMax) * 100 : 0) + '%';
    if (buybar) {
      buybar.hidden = false;
      buybar.classList.toggle('show', y > heroTrig);
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------- hero typewriter + output reveal ---------- */
  const cmdEl = $('#heroCmd');
  const caret = $('#heroCaret');
  const respLines = $$('#heroOut .t-resp');
  const CMD = ' claude "crie a landing page que vende meu ebook"';

  function showOutput() {
    respLines.forEach((p, k) => {
      setTimeout(() => { p.style.opacity = '1'; }, reduce ? 0 : 280 * (k + 1));
    });
    if (caret) setTimeout(() => { caret.style.display = 'none'; }, reduce ? 0 : 280 * (respLines.length + 1));
  }
  if (cmdEl) {
    if (reduce) {
      cmdEl.textContent = CMD;
      showOutput();
    } else {
      let i = 0;
      const tick = () => {
        cmdEl.textContent = CMD.slice(0, i++);
        if (i <= CMD.length) setTimeout(tick, 34 + Math.random() * 26);
        else showOutput();
      };
      setTimeout(tick, 650);
    }
  }

  /* ---------- BUILD scene: plays once when it enters view ---------- */
  const codeArea = $('#codeArea');
  const gutter = $('#codeGutter');
  const blocks = $$('#mini [data-block]');
  const editorStatus = $('#editorStatus');
  const build = $('#metodo');

  const LINES = [
    '<span class="tok-tag">&lt;section</span> <span class="tok-attr">class</span>=<span class="tok-str">"hero"</span><span class="tok-tag">&gt;</span>',
    '  <span class="tok-tag">&lt;span</span> <span class="tok-attr">class</span>=<span class="tok-str">"tag"</span><span class="tok-tag">&gt;</span>MÉTODO ZERO CÓDIGO<span class="tok-tag">&lt;/span&gt;</span>',
    '  <span class="tok-tag">&lt;h1&gt;</span>Zero Código,',
    '      LP Profissional<span class="tok-tag">&lt;/h1&gt;</span>',
    '  <span class="tok-tag">&lt;p&gt;</span>Crie LPs com IA e',
    '     cobre <span class="tok-key">R$3.000</span> por projeto.<span class="tok-tag">&lt;/p&gt;</span>',
    '  <span class="tok-tag">&lt;a</span> <span class="tok-attr">class</span>=<span class="tok-str">"cta"</span><span class="tok-tag">&gt;</span>Quero o ebook<span class="tok-tag">&lt;/a&gt;</span>',
    '<span class="tok-tag">&lt;/section&gt;</span>',
    '<span class="tok-com">// deploy --netlify · pronto</span>'
  ];
  const BLOCK_AT = { 1: 0.28, 2: 0.46, 3: 0.64, 4: 0.82 };

  function renderBuild(p) {
    if (!codeArea) return;
    const shown = Math.max(0, Math.min(LINES.length, Math.round(p * (LINES.length + 1.5))));
    if (codeArea.dataset.n !== String(shown)) {
      codeArea.dataset.n = String(shown);
      codeArea.innerHTML = LINES.slice(0, shown).join('\n');
      gutter.textContent = Array.from({ length: shown }, (_, i) => i + 1).join('\n');
    }
    blocks.forEach((b) => b.classList.toggle('show', p >= BLOCK_AT[b.dataset.block]));
    if (editorStatus) editorStatus.textContent = p >= 0.96 ? 'pronto' : 'escrevendo…';
  }

  if (build && codeArea) {
    const bio = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        bio.disconnect();
        if (reduce) { renderBuild(1); return; }
        let p = 0;
        const iv = setInterval(() => {
          p += 0.04;
          renderBuild(Math.min(p, 1));
          if (p >= 1) clearInterval(iv);
        }, 85);
      });
    }, { threshold: 0.35 });
    bio.observe(build);
  }

  /* ---------- file tree accordion (A03) ---------- */
  $$('[data-file]').forEach((file) => {
    const head = $('.file-head', file);
    const body = $('.file-body', file);
    head.addEventListener('click', () => {
      const open = file.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      body.style.maxHeight = open ? body.scrollHeight + 'px' : '0';
    });
  });

  /* ---------- profit counter ---------- */
  const profit = $('#profit');
  if (profit) {
    const target = +profit.dataset.target;
    const fmt = (n) => 'R$' + Math.round(n).toLocaleString('pt-BR');
    let done = false;
    const cio = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting || done) return;
        done = true; cio.disconnect();
        if (reduce) { profit.textContent = fmt(target); return; }
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

  /* ---------- code rain (desktop only, very subtle) ---------- */
  const rain = $('#fxRain');
  if (rain && desktop && !reduce) {
    const glyphs = '01{}[]();=>/<>constletasyncfnawait'.split('');
    const cols = 16;
    let html = '';
    for (let i = 0; i < cols; i++) {
      const ch = glyphs[(i * 7) % glyphs.length];
      const left = (i / cols) * 100 + (i % 3);
      const dur = 10 + (i % 9);
      const delay = (i % 11) * 0.9;
      html += '<span class="bg-char" style="left:' + left + '%;animation-duration:' + dur + 's;animation-delay:-' + delay + 's">' + ch + '</span>';
    }
    rain.innerHTML = html;
  }

  /* ---------- smooth anchor offset for fixed nav ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 64, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
})();
