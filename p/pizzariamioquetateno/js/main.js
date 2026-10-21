/* Pizzaria Mio Que Tá Teno — comportamento da página (JS puro, sem bibliotecas) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var wide = window.matchMedia('(min-width: 960px)');

  /* entrada do hero */
  var hero = d.querySelector('.hero');
  function ready() { hero.classList.add('is-ready'); }
  requestAnimationFrame(function () { requestAnimationFrame(ready); });
  setTimeout(ready, 700);

  /* quadro de valores: separa os caracteres para o efeito de painel */
  d.querySelectorAll('.flap').forEach(function (el) {
    var txt = el.textContent, n = 0;
    var sr = d.createElement('span'); sr.className = 'sr'; sr.textContent = txt;
    el.textContent = '';
    el.appendChild(sr);
    for (var i = 0; i < txt.length; i++) {
      var s = d.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', n++);
      s.textContent = txt[i] === ' ' ? ' ' : txt[i];
      el.appendChild(s);
    }
  });

  /* revelações ao rolar */
  var targets = d.querySelectorAll('.reveal, .board, .sizes');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('is-in'); });
  }

  /* contador da inauguração */
  var cnt = d.querySelector('[data-count]');
  if (cnt && 'IntersectionObserver' in window && !reduce) {
    var end = parseInt(cnt.getAttribute('data-count'), 10);
    cnt.textContent = '0';
    var co = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      co.disconnect();
      var t0 = performance.now(), dur = 1600;
      (function step(t) {
        var k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
        cnt.textContent = Math.round(end * e);
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 });
    co.observe(cnt);
  }

  /* abas do cardápio */
  var tabs = d.querySelectorAll('.tab');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      d.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t, false); });
    t.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j], true); }
    });
  });

  /* trilho, topo, estação ativa e paralaxe (um único laço leve) */
  var top = d.querySelector('.top');
  var px = Array.prototype.slice.call(d.querySelectorAll('.px'));
  var stationLinks = d.querySelectorAll('.stations a');
  var sections = Array.prototype.slice.call(d.querySelectorAll('[data-station]'));
  var ticking = false, vh = window.innerHeight;

  function frame() {
    ticking = false;
    var y = window.pageYOffset || root.scrollTop;
    var max = Math.max(root.scrollHeight - vh, 1);
    var moves = [], i, cur = sections[0].getAttribute('data-station'), line = vh * 0.4;

    /* leituras primeiro, escritas depois: evita recalcular o layout a cada rolagem */
    if (!reduce && wide.matches) {
      for (i = 0; i < px.length; i++) {
        var r = px[i].getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        moves.push([px[i], (r.top + r.height / 2 - vh / 2) * -parseFloat(px[i].getAttribute('data-speed'))]);
      }
    }
    for (i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) cur = sections[i].getAttribute('data-station');
    }

    root.style.setProperty('--p', Math.min(Math.max(y / max, 0), 1).toFixed(4));
    top.classList.toggle('is-scrolled', y > 24);
    for (i = 0; i < moves.length; i++) moves[i][0].style.transform = 'translate3d(0,' + moves[i][1].toFixed(1) + 'px,0)';
    stationLinks.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-st') === cur); });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; onScroll(); }, { passive: true });
  requestAnimationFrame(frame);

  /* inclinação 3D suave nas fotos e na logo (só com mouse) */
  if (fine && !reduce) {
    d.querySelectorAll('[data-tilt]').forEach(function (el) {
      var tgt = el.classList.contains('px') ? el.firstElementChild : el;
      var base = '';
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        tgt.style.transform = base + 'perspective(800px) rotateY(' + (x * 9).toFixed(2) + 'deg) rotateX(' + (-y * 9).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { tgt.style.transform = ''; });
    });
  }

  /* trenzinho do trilho: apito escondido */
  var train = d.querySelector('.rail__train');
  var toast = d.querySelector('.toast');
  var steam = d.querySelector('.steam');
  var timer;
  var lines = ['Piiiii! Próxima estação: pizza.', 'Piiiii! Quem chegou primeiro pega a melhor fatia.', 'Piiiii! Último vagão: sobremesa.'];
  var n = 0;
  if (train) train.addEventListener('click', function () {
    toast.textContent = lines[n++ % lines.length];
    toast.classList.add('is-on');
    if (steam) { steam.classList.add('is-burst'); }
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('is-on'); if (steam) steam.classList.remove('is-burst'); }, 2600);
  });
})();
