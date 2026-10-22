(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* topo com fundo ao rolar + deslocamento leve dos fios */
  var top = document.querySelector('.top');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || 0;
      top.classList.toggle('solid', y > 40);
      if (!reduce && y < 1400) doc.style.setProperty('--sy', y);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* menu no celular */
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('menu');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Fechar' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    [].slice.call(document.querySelectorAll('main, footer, .skip')).forEach(function (el) {
      if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    if (open) { var f = nav.querySelector('a'); if (f) f.focus(); }
  }
  btn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); btn.focus(); }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  /* revelar ao rolar (uma vez) */
  var rv = [].slice.call(document.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      rv.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('in');
      });
    }, 2500);
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* luz que segue o cursor nos quadros */
  if (window.matchMedia('(hover: hover)').matches) {
    [].slice.call(document.querySelectorAll('[data-lit]')).forEach(function (f) {
      f.addEventListener('pointermove', function (e) {
        var r = f.getBoundingClientRect();
        f.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        f.style.setProperty('--my', (e.clientY - r.top) + 'px');
        f.classList.add('on');
      });
      f.addEventListener('pointerleave', function () { f.classList.remove('on'); });
    });
  }

  /* galeria: setas */
  var wall = document.getElementById('wall');
  [].slice.call(document.querySelectorAll('.arrow')).forEach(function (a) {
    a.addEventListener('click', function () {
      var dir = parseInt(a.getAttribute('data-dir'), 10);
      wall.scrollBy({ left: dir * wall.clientWidth * 0.7, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* a conta dos 22 componentes */
  var range = document.getElementById('comp');
  var out = document.getElementById('compOut');
  var msg = document.getElementById('compMsg');
  var dots = document.getElementById('dots');
  var TOTAL = 22;
  for (var i = 0; i < TOTAL; i++) dots.appendChild(document.createElement('span'));
  function paint() {
    var v = parseInt(range.value, 10);
    out.textContent = v;
    range.setAttribute('aria-valuetext', v + ' de ' + TOTAL + ' componentes');
    [].slice.call(dots.children).forEach(function (d, idx) { d.classList.toggle('on', idx < v); d.classList.toggle('last', idx === v - 1); });
    if (v <= 13) msg.textContent = 'Com 13, a mecha quebra.';
    else if (v >= TOTAL) msg.textContent = 'Com 22, a mecha fica saudável.';
    else msg.textContent = 'Faltam ' + (TOTAL - v) + ' para os 22 que a Zaira considera o ideal.';
  }
  range.addEventListener('input', paint);
  paint();
})();
