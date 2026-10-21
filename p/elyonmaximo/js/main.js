(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* cabeçalho sólido ao rolar */
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('solid', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* aparecer ao rolar (uma vez) */
  var targets = document.querySelectorAll('.rv, .pillar');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }
  /* rede de segurança: nada fica escondido */
  window.addEventListener('load', function () {
    setTimeout(function () { targets.forEach(function (t) { t.classList.add('in'); }); }, 2500);
  });

  /* mapa do rosto: desenha ao carregar */
  var frame = document.querySelector('.figure-frame');
  if (frame) { requestAnimationFrame(function () { frame.classList.add('on'); }); }

  /* pontos de análise */
  var hots = document.querySelectorAll('.hot');
  function closeAll(except) {
    hots.forEach(function (h) {
      if (h === except) return;
      h.setAttribute('aria-expanded', 'false');
      var t = document.getElementById(h.getAttribute('aria-controls'));
      if (t) t.hidden = true;
    });
  }
  hots.forEach(function (h) {
    h.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var t = document.getElementById(h.getAttribute('aria-controls'));
      var open = h.getAttribute('aria-expanded') === 'true';
      closeAll(h);
      h.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (t) t.hidden = open;
    });
  });
  document.addEventListener('click', function () { closeAll(null); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });

  /* profundidade: palavra de fundo e retrato respondem ao mouse (só desktop) */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var word = document.querySelector('.hero-bgword span');
  var img = document.querySelector('.figure-img');
  var hero = document.querySelector('.hero');
  if (fine && !reduce && hero) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    hero.addEventListener('mouseleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
    var tick = function () {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      if (word) word.style.transform = 'translate3d(' + (cx * -40).toFixed(1) + 'px,' + (cy * -14).toFixed(1) + 'px,0)';
      if (img) img.style.transform = 'translate3d(' + (cx * 10).toFixed(1) + 'px,' + (cy * 8).toFixed(1) + 'px,0) scale(1.04)';
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) { raf = requestAnimationFrame(tick); } else { raf = null; }
    };
  }
})();
