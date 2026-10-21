(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var wide = window.matchMedia('(min-width: 48em)').matches;

  /* ---------- dados do radar (todos tirados dos anúncios do Instagram da loja) ---------- */
  var CONTACTS = [
    { a: 38,  r: .34, sold: false, img: 'assets/img/t-fz25connect.webp', name: 'Yamaha Fz25 Connect 2025',
      meta: '7.000 km · garantia Yamaha até 2029', price: 'R$ 24.900' },
    { a: 118, r: .27, sold: false, img: 'assets/img/t-mt03.webp', name: 'Yamaha MT-03 ABS 2024',
      meta: '12.000 km · único dono', price: 'R$ 29.900' },
    { a: 200, r: .38, sold: false, img: 'assets/img/t-fazer250.webp', name: 'Yamaha Fazer 250 2017',
      meta: '85.000 km · pneus novos', price: 'R$ 15.900' },
    { a: 262, r: .30, sold: true,  img: 'assets/img/t-fz15.webp', name: 'Yamaha FZ15 2023',
      meta: 'Tabela FIPE R$ 17.300', price: 'R$ 14.400' },
    { a: 305, r: .40, sold: true,  img: 'assets/img/t-pcx160.webp', name: 'Honda PCX 160 ABS 2023',
      meta: 'Tabela FIPE R$ 19.000', price: 'R$ 15.500' },
    { a: 345, r: .22, sold: true,  img: 'assets/img/t-lander.webp', name: 'Yamaha XTZ Lander 250 2024',
      meta: 'Tabela FIPE R$ 27.400', price: 'R$ 23.900' }
  ];
  var PERIOD = 8000; // ms por volta

  var scope = document.getElementById('scope');
  var sweep = scope && scope.querySelector('.sweep');
  var blipsBox = document.getElementById('blips');
  var card = document.getElementById('contact');
  var cImg = document.getElementById('c-img');
  var cTag = document.getElementById('c-tag');
  var cName = document.getElementById('c-name');
  var cMeta = document.getElementById('c-meta');
  var cPrice = document.getElementById('c-price');
  var core = scope && scope.querySelector('[data-core]');
  var blipEls = [];
  var selected = -1;
  var pinnedUntil = 0;

  function buildTicks() {
    var g = scope.querySelector('.ticks');
    var ns = 'http://www.w3.org/2000/svg';
    for (var d = 0; d < 360; d += 5) {
      var long = d % 30 === 0;
      var rad = d * Math.PI / 180;
      var r1 = 196, r2 = long ? 184 : 190;
      var l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', (200 + r1 * Math.sin(rad)).toFixed(2));
      l.setAttribute('y1', (200 - r1 * Math.cos(rad)).toFixed(2));
      l.setAttribute('x2', (200 + r2 * Math.sin(rad)).toFixed(2));
      l.setAttribute('y2', (200 - r2 * Math.cos(rad)).toFixed(2));
      g.appendChild(l);
    }
  }

  function select(i, fromUser) {
    if (fromUser) pinnedUntil = performance.now() + 14000;
    if (i === selected) return;
    selected = i;
    var c = CONTACTS[i];
    blipEls.forEach(function (b, k) { b.classList.toggle('is-sel', k === i); b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    cImg.src = c.img;
    cName.textContent = c.name;
    cMeta.textContent = c.meta;
    if (c.sold) {
      cTag.textContent = 'Vendida';
      cTag.classList.add('sold');
      cPrice.textContent = '';
      var s = document.createElement('span');
      s.textContent = 'Anunciada por ' + c.price;
      cPrice.appendChild(s);
    } else {
      cTag.textContent = 'Anúncio recente';
      cTag.classList.remove('sold');
      cPrice.textContent = c.price;
    }
    if (!reduce) {
      card.classList.remove('flick');
      void card.offsetWidth;
      card.classList.add('flick');
    }
  }

  function buildBlips() {
    CONTACTS.forEach(function (c, i) {
      var rad = c.a * Math.PI / 180;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'blip' + (c.sold ? ' sold' : '');
      b.style.left = (50 + c.r * 100 * Math.sin(rad)).toFixed(2) + '%';
      b.style.top = (50 - c.r * 100 * Math.cos(rad)).toFixed(2) + '%';
      b.setAttribute('aria-label', c.name + (c.sold ? ', vendida' : ', anúncio recente'));
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { select(i, true); ping(i); });
      blipsBox.appendChild(b);
      blipEls.push(b);
    });
  }

  function ping(i) {
    var el = blipEls[i];
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
  }

  var prev = 0, t0 = performance.now(), running = false, raf = 0, paused = false, inView = true, armed = false;
  function frame(now) {
    var ang = (Math.max(0, now - t0) % PERIOD) / PERIOD * 360;
    sweep.style.transform = 'rotate(' + ang.toFixed(2) + 'deg)';
    for (var i = 0; i < CONTACTS.length; i++) {
      var a = CONTACTS[i].a;
      var crossed = prev <= ang ? (prev < a && a <= ang) : (a > prev || a <= ang);
      if (crossed) {
        ping(i);
        if (now > pinnedUntil) select(i, false);
      }
    }
    prev = ang;
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (running || reduce || paused) return; running = true; prev = (Math.max(0, performance.now() - t0) % PERIOD) / PERIOD * 360; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  if (scope) {
    buildTicks();
    buildBlips();
    select(0, false);
    window.addEventListener('load', function () { CONTACTS.forEach(function (c) { new Image().src = c.img; }); });
    if (!reduce && 'IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (armed) { inView ? start() : stop(); } }, { threshold: .05 });
      so.observe(scope);
      // o radar só começa a girar depois do carregamento, para não competir com a primeira pintura
      var arm = function () { setTimeout(function () { armed = true; t0 = performance.now(); if (inView) start(); }, 1500); };
      if (document.readyState === 'complete') arm(); else window.addEventListener('load', arm);
    }
    core.addEventListener('click', function () {
      core.classList.remove('ping'); void core.offsetWidth; core.classList.add('ping');
      select((selected + 1) % CONTACTS.length, true);
      ping(selected);
    });
  }

  /* ---------- pausar animações ---------- */
  var pauseBtn = document.getElementById('pause');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      document.documentElement.classList.toggle('is-paused', paused);
      pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (paused) stop(); else if (inView && armed) start();
    });
  }

  /* ---------- topo e dock ---------- */
  var top = document.getElementById('top');
  var dock = document.getElementById('dock');
  var hero = document.querySelector('.hero');
  function onScroll() {
    var y = window.scrollY;
    top.classList.toggle('is-solid', y > 30);
    if (hero) dock.classList.toggle('show', y > hero.offsetHeight * .8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- revelar ao rolar ---------- */
  var rvs = [].slice.call(document.querySelectorAll('.rv'));
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  function count(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (reduce) return;
    var dur = 1400, s = performance.now();
    function step(n) {
      var p = Math.min(1, (n - s) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        var n = e.target.querySelector('[data-count]');
        if (n) count(n);
        io.unobserve(e.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(function (el) { io.observe(el); });
    // rede de segurança: nada fica invisível se o observador falhar
    window.addEventListener('load', function () {
      setTimeout(function () { rvs.forEach(function (el) { if (!el.classList.contains('in')) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add('in'); } }); }, 2500);
    });
  } else {
    rvs.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- inclinação 3D das fotos (só mouse) ---------- */
  if (fine && !reduce) {
    [].forEach.call(document.querySelectorAll('[data-tilt]'), function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - .5) * 12).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - y) * 10).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- paralaxe diferencial na galeria (só telas largas) ---------- */
  var items = [].slice.call(document.querySelectorAll('.scatter li'));
  if (wide && !reduce && items.length) {
    var ticking = false;
    var vis = true;
    var gal = document.querySelector('.gal');
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) upd(); }, { rootMargin: '200px 0px' }).observe(gal);
    function upd() {
      ticking = false;
      if (!vis) return;
      var vh = window.innerHeight;
      items.forEach(function (li) {
        var s = parseFloat(li.getAttribute('data-speed')) || 1;
        var r = li.getBoundingClientRect();
        var cur = parseFloat(li.style.getPropertyValue('--py')) || 0;
        var c = r.top - cur + r.height / 2 - vh / 2;
        li.style.setProperty('--py', ((1 - s) * c * .26).toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }
  window.__radarOk = true;
})();
