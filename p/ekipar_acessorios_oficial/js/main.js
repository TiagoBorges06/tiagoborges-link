(function () {
  'use strict';

  /* janela de escolha da loja (WhatsApp) */
  var dlg = document.getElementById('wa');
  document.querySelectorAll('[data-open-wa]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
      else location.hash = '#lojas';
    });
  });
  if (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    });
  }

  /* carro interativo */
  var pins = Array.prototype.slice.call(document.querySelectorAll('.pin'));
  var specs = Array.prototype.slice.call(document.querySelectorAll('.spec'));
  var legs = Array.prototype.slice.call(document.querySelectorAll('.legend button'));
  function show(i, focus, scroll) {
    pins.forEach(function (p, n) {
      var on = n === i;
      p.classList.toggle('on', on);
      p.setAttribute('aria-selected', on ? 'true' : 'false');
      p.tabIndex = on ? 0 : -1;
    });
    specs.forEach(function (s, n) { s.hidden = n !== i; });
    legs.forEach(function (b, n) { b.classList.toggle('on', n === i); b.setAttribute('aria-pressed', n === i ? 'true' : 'false'); });
    if (scroll && window.matchMedia('(max-width:900px)').matches) specs[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (focus) pins[i].focus();
  }
  pins.forEach(function (p, i) {
    p.addEventListener('click', function () { show(i, false, true); });
    p.addEventListener('keydown', function (e) {
      var n = pins.length;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); show((i + 1) % n, true); }
      if (e.key === 'Home') { e.preventDefault(); show(0, true); }
      if (e.key === 'End') { e.preventDefault(); show(n - 1, true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); show((i + n - 1) % n, true); }
    });
  });
  legs.forEach(function (b) {
    b.addEventListener('click', function () { show(+b.getAttribute('data-i'), false, true); });
  });
  show(0);

  /* mira de coordenadas sobre o desenho (só com mouse) */
  var stage = document.querySelector('.plan-stage');
  var cross = stage && stage.querySelector('.cross');
  var coord = document.getElementById('coord');
  if (stage && cross && window.matchMedia('(hover:hover)').matches) {
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      var x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      var y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      cross.style.setProperty('--cx', (x * 100) + '%');
      cross.style.setProperty('--cy', (y * 100) + '%');
      coord.textContent = 'x ' + String(Math.round(x * 1000)).padStart(3, '0') + '  y ' + String(Math.round(y * 420)).padStart(3, '0');
    });
  }

  /* revelar ao rolar */
  var els = document.querySelectorAll('.hero .facts, .hero-row, .sec-head, .cards li, .store');
  els.forEach(function (el) { el.classList.add('reveal'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  /* leve deslocamento da grade e da palavra do rodapé conforme a rolagem */
  var gridEls = [document.querySelector('.grid-bg'), document.querySelector('.big')].filter(Boolean);
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      gridEls.forEach(function (el) { el.style.setProperty('--sy', window.scrollY); });
      ticking = false;
    });
  }, { passive: true });
})();
