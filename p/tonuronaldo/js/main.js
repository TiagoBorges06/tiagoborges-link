(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = 'https://wa.me/553133337383?text=';
  var brl = function (v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };

  /* ---------- Convite (envelope) ---------- */
  var env = document.getElementById('env');
  var seal = document.getElementById('seal');
  function openEnv() {
    if (env.getAttribute('data-open') === 'true') return;
    env.setAttribute('data-open', 'true');
    seal.setAttribute('aria-expanded', 'true');
    seal.tabIndex = -1;
    seal.setAttribute('aria-hidden', 'true');
    var hint = document.getElementById('env-hint');
    if (hint) hint.hidden = true;
  }
  if (env && seal) {
    seal.addEventListener('click', openEnv);
    if (reduce) openEnv();
    else setTimeout(openEnv, 2600);
  }

  /* ---------- Aberto agora ---------- */
  // Horários do cardápio publicado no Instagram. Segunda à noite não consta nas fontes.
  var SLOTS = [
    { d: [1, 2, 3, 4, 5], s: 11 * 60, e: 14 * 60, n: 'Almoço' },
    { d: [2, 3, 4, 0], s: 19 * 60, e: 23 * 60, n: 'Pizzaria' },
    { d: [5, 6], s: 19 * 60, e: 24 * 60, n: 'Pizzaria' }
  ];
  var DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  function hh(m) { var h = Math.floor(m / 60) % 24, mi = m % 60; return h + 'h' + (mi ? String(mi).padStart(2, '0') : ''); }
  function nowBH() {
    try {
      var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
      return { d: wd, m: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) { return null; }
  }
  function status() {
    var box = document.getElementById('status'), txt = document.getElementById('status-txt');
    var t = nowBH();
    if (!box || !txt || !t) return;
    box.classList.remove('is-open');
    var cur = SLOTS.filter(function (s) { return s.d.indexOf(t.d) > -1 && t.m >= s.s && t.m < s.e; })[0];
    if (cur) {
      box.classList.add('is-open');
      txt.textContent = (cur.n === 'Almoço' ? 'Almoço servido agora, até ' : 'Aberto agora, até ') + hh(cur.e);
      return;
    }
    for (var off = 0; off < 8; off++) {
      var day = (t.d + off) % 7;
      var next = SLOTS.filter(function (s) { return s.d.indexOf(day) > -1 && (off > 0 || s.s > t.m); })
        .sort(function (a, b) { return a.s - b.s; })[0];
      if (next) {
        var quando = off === 0 ? 'hoje' : off === 1 ? 'amanhã' : 'na ' + DIAS[day];
        if (off > 1 && (day === 0 || day === 6)) quando = 'no ' + DIAS[day];
        txt.textContent = 'Fechado agora. ' + next.n + ' ' + quando + ' às ' + hh(next.s);
        return;
      }
    }
  }
  status();
  setInterval(status, 60000);

  /* ---------- Montador do espaguete ---------- */
  var PRE = [44.9, 52.9, 74.9], NOMES = ['Pequeno', 'Médio', 'Grande'];
  var form = document.getElementById('builder');
  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    var extras = [].slice.call(form.querySelectorAll('input[name=extra]'));
    var radios = [].slice.call(form.querySelectorAll('input[name=size]'));
    var calc = function () {
      var sz = parseInt(form.querySelector('input[name=size]:checked').value, 10);
      var total = PRE[sz], nomes = [];
      extras.forEach(function (c) {
        var price = parseFloat(c.getAttribute('data-p').split(',')[sz]);
        c.parentNode.querySelector('.ex').textContent = '+ ' + brl(price);
        if (c.checked) { total += price; nomes.push(c.value); }
      });
      [0, 1, 2].forEach(function (i) { document.getElementById('p' + i).textContent = brl(PRE[i]); });
      var lista = nomes.length ? ' com ' + nomes.join(nomes.length > 1 ? ', ' : '').replace(/, ([^,]+)$/, ' e $1') : '';
      var desc = 'Espaguete ' + NOMES[sz] + lista;
      document.getElementById('b-desc').textContent = desc;
      document.getElementById('b-total').textContent = brl(total);
      var msg = 'Olá, Ronaldo! Vi o site e quero pedir: ' + desc + ' (' + brl(total) + ' pelo cardápio).';
      document.getElementById('b-link').href = WA + encodeURIComponent(msg);
    };
    form.addEventListener('change', calc);
    calc();
  }

  /* ---------- Abas do cardápio ---------- */
  var tabs = [].slice.call(document.querySelectorAll('.tabs [role=tab]'));
  function showTab(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showTab(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      else if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (k === 'Home') n = tabs[0];
      else if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); showTab(n, true); }
    });
  });

  /* ---------- Aparecer ao rolar + contadores ---------- */
  function fmt(v, dec) { return v.toFixed(dec).replace('.', ','); }
  function count(el) {
    var end = parseFloat(el.getAttribute('data-count')), dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    if (reduce) { el.textContent = fmt(end, dec); return; }
    var start = performance.now(), dur = 1400;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(end * e, dec);
      if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(end, dec);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        [].forEach.call(en.target.querySelectorAll('[data-count]'), count);
        io.unobserve(en.target);
      });
    }, { threshold: .25 });
    [].forEach.call(document.querySelectorAll('.rv'), function (el) { io.observe(el); });
  } else {
    [].forEach.call(document.querySelectorAll('.rv'), function (el) { el.classList.add('in'); });
  }

  /* ---------- Paralaxe leve nas fotos ---------- */
  var pars = [].slice.call(document.querySelectorAll('[data-par]'));
  if (pars.length && !reduce && window.matchMedia('(min-width:901px)').matches) {
    var ticking = false;
    var upd = function () {
      ticking = false;
      pars.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        var c = r.top + r.height / 2 - window.innerHeight / 2;
        el.style.transform = 'translate3d(0,' + (c * parseFloat(el.getAttribute('data-par'))).toFixed(1) + 'px,0)';
      });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ---------- Link ativo no menu ---------- */
  var links = [].slice.call(document.querySelectorAll('.top__nav a'));
  if ('IntersectionObserver' in window && links.length) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['macarrao', 'turnos', 'cardapio', 'onde', 'pedir'].forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }
})();
