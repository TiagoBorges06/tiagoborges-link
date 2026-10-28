(function () {
  'use strict';
  var WA = '5531997730883';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function wa(msg) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg); }

  // mensagem pronta nos botões de WhatsApp
  $$('[data-wa]').forEach(function (a) { a.href = wa(a.getAttribute('data-wa')); });

  // topo
  var top = $('#top');
  function onScroll() { top.classList.toggle('is-solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // menu do celular
  var burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
    $$('main, footer, .fab').forEach(function (el) { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });

  // aparecer ao rolar
  document.documentElement.classList.add('js');
  var rv = $$('.sec-head, .panels, .quiz, .days, .slots, .profs, .reviews > *, .faq, .final, .stats');
  rv.forEach(function (el) { el.classList.add('rv'); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  // números que sobem
  function fmt(v, d) { return v.toFixed(d).replace('.', ','); }
  var counts = $$('.count');
  if ('IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        var el = e.target, to = parseFloat(el.dataset.to), d = parseInt(el.dataset.dec || 0, 10), t0 = performance.now();
        (function step(t) {
          var p = Math.min((t - t0) / 1200, 1), v = to * (1 - Math.pow(1 - p, 3));
          el.textContent = fmt(v, d);
          if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to, d);
        })(t0);
      });
    }, { threshold: 0.6 });
    counts.forEach(function (c) { co.observe(c); });
  }

  // painéis das modalidades
  var panels = $$('.panel');
  panels.forEach(function (p) { p.tabIndex = 0; });
  function openPanel(p) { panels.forEach(function (x) { x.classList.toggle('is-open', x === p); }); }
  panels.forEach(function (p) {
    p.addEventListener('mouseenter', function () { openPanel(p); });
    p.addEventListener('focus', function () { openPanel(p); });
    p.addEventListener('click', function () { openPanel(p); });
  });

  // grade de horários (conferida na imagem da grade oficial)
  var DIAS = [
    { n: 'Segunda', k: 1, h: ['7h', '9h', '15h', '17h', '18h', '19h', '20h', '21h'] },
    { n: 'Terça', k: 2, h: ['15h', '17h', '18h', '19h'] },
    { n: 'Quarta', k: 3, h: ['7h', '9h', '15h', '17h', '18h', '19h', '20h', '21h'] },
    { n: 'Quinta', k: 4, h: ['15h', '17h', '18h', '19h'] },
    { n: 'Sexta', k: 5, h: ['7h', '9h', '15h', '17h', '18h', '19h', '20h'] },
    { n: 'Sábado', k: 6, h: ['10h às 11h30'] }
  ];
  function nowSP() {
    var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
    var wk = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
    return { d: wk, m: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
  }
  function mins(h) { var m = h.match(/^(\d+)h(?:\s*às.*?(\d+)h(\d+))?/); return m ? parseInt(m[1], 10) * 60 : 0; }
  function nextClass() {
    var n = nowSP();
    for (var add = 0; add < 7; add++) {
      var d = (n.d + add) % 7, dia = DIAS.filter(function (x) { return x.k === d; })[0];
      if (!dia) continue;
      for (var i = 0; i < dia.h.length; i++) {
        if (add > 0 || mins(dia.h[i]) > n.m) return { dia: dia, hora: dia.h[i], hoje: add === 0, amanha: add === 1 };
      }
    }
    return null;
  }
  var nx = nextClass();
  var daysEl = $('#days'), slotsEl = $('#slots');
  function renderSlots(dia) {
    slotsEl.innerHTML = '';
    dia.h.forEach(function (h, i) {
      var a = document.createElement('a');
      var isNext = nx && nx.dia === dia && nx.hora === h;
      a.className = 'slot' + (dia.k === 6 ? ' wide' : '') + (isNext ? ' is-next' : '');
      a.style.animationDelay = (i * 40) + 'ms';
      a.href = wa('Oi, gostaria de fazer uma aula experimental ' + (dia.k === 6 ? 'no sábado, das ' + h : 'na ' + dia.n.toLowerCase() + ', às ' + h));
      a.target = '_blank'; a.rel = 'noopener';
      var b = document.createElement('b'); b.textContent = h;
      var s = document.createElement('small'); s.textContent = isNext ? 'Próxima turma' : 'Agendar neste horário';
      a.appendChild(b); a.appendChild(s); slotsEl.appendChild(a);
    });
  }
  function selectDay(btn, dia) {
    $$('.day', daysEl).forEach(function (x) { x.setAttribute('aria-selected', x === btn); x.tabIndex = x === btn ? 0 : -1; });
    slotsEl.setAttribute('aria-labelledby', btn.id);
    renderSlots(dia);
  }
  var first = null;
  DIAS.forEach(function (dia) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'day'; b.id = 'dia-' + dia.k; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'slots'); b.textContent = dia.n;
    b.addEventListener('click', function () { selectDay(b, dia); });
    b.addEventListener('keydown', function (e) {
      var bs = $$('.day', daysEl), i = bs.indexOf(b);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var t = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length]; t.focus(); t.click();
      }
    });
    daysEl.appendChild(b);
    if (!first || (nx && dia === nx.dia)) first = { b: b, d: dia };
  });
  selectDay(first.b, first.d);

  // aviso do próximo treino (hero)
  var bell = $('#bell-txt');
  if (nx) {
    var quando = nx.hoje ? 'hoje' : nx.amanha ? 'amanhã' : nx.dia.n.toLowerCase();
    bell.textContent = 'Próxima turma: ' + quando + ', ' + nx.hora;
  }

  // qual luta combina comigo
  var body = $('#quiz-body');
  var ans = [];
  var Q = [
    { q: 'O que você quer da luta?', o: ['Condicionamento e saúde', 'Aprender a me defender', 'Competir'] },
    { q: 'Qual estilo mais te atrai?', o: ['Socos e chutes', 'Agarrar e finalizar no chão', 'Um pouco de tudo'] }
  ];
  var R = {
    '0-0': ['Muay Thai e Boxe', 'Treinos intensos em pé, ótimos para condicionamento.'],
    '0-1': ['Jiu-Jitsu', 'Estratégia e técnica no chão, um treino que exercita corpo e mente.'],
    '0-2': ['MMA', 'Reúne golpes em pé e solo em um só treino.'],
    '1-0': ['Muay Thai e Kickboxing', 'Socos e chutes para se proteger com confiança.'],
    '1-1': ['Jiu-Jitsu', 'Controle e finalização, base da defesa pessoal no chão.'],
    '1-2': ['MMA e Jiu-Jitsu', 'Uma base completa para se defender em pé e no chão.'],
    '2-0': ['Kickboxing e Boxe', 'Socos e chutes com foco em ritmo e competição.'],
    '2-1': ['Jiu-Jitsu e MMA', 'Do solo ao combate completo.'],
    '2-2': ['MMA', 'O esporte de combate mais completo para quem quer competir.']
  };
  function step(focus) {
    body.innerHTML = '';
    var i = ans.length;
    if (i < Q.length) {
      var s = document.createElement('p'); s.className = 'step'; s.textContent = 'Pergunta ' + (i + 1) + ' de ' + Q.length;
      var q = document.createElement('p'); q.className = 'quiz-q'; q.textContent = Q[i].q;
      var box = document.createElement('div'); box.className = 'opts';
      Q[i].o.forEach(function (t, k) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.textContent = t;
        b.addEventListener('click', function () { ans.push(k); step(true); });
        box.appendChild(b);
      });
      body.appendChild(s); body.appendChild(q); body.appendChild(box);
      if (focus) { q.tabIndex = -1; q.focus(); }
    } else {
      var r = R[ans[0] + '-' + ans[1]];
      var w = document.createElement('div'); w.className = 'result';
      w.innerHTML = '<p class="step">Sugestão para começar</p><b></b><p></p>';
      w.querySelector('b').textContent = r[0];
      w.querySelectorAll('p')[1].textContent = r[1] + ' Na aula experimental gratuita você testa na prática.';
      var a = document.createElement('a'); a.className = 'btn btn-red'; a.target = '_blank'; a.rel = 'noopener';
      a.href = wa('Oi, fiz o teste no site e me interessei por ' + r[0] + '. Gostaria de fazer uma aula experimental.');
      a.textContent = 'Agendar minha aula grátis';
      var again = document.createElement('button'); again.type = 'button'; again.className = 'again'; again.textContent = 'Refazer';
      again.addEventListener('click', function () { ans = []; step(true); });
      w.appendChild(a); w.appendChild(again); body.appendChild(w);
      var rb = w.querySelector('b'); rb.tabIndex = -1; rb.focus();
    }
  }
  step();
})();
