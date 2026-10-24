(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // entrada do hero
  requestAnimationFrame(function () { root.classList.add('is-ready'); });

  // aparecer ao rolar
  var items = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(function (el) { el.classList.add('is-in'); }); }, 6000);
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // cabeçalho: some ao descer, volta ao subir
  var top = document.getElementById('topo');
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    top.classList.toggle('is-scrolled', y > 8);
    if (y > 240 && y > lastY + 4) top.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 240) top.classList.remove('is-hidden');
    lastY = y;
    updateGlint();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  // brilho de espelho nas fotos, conforme a posição na tela
  var glints = [].slice.call(document.querySelectorAll('[data-glint]'));
  function updateGlint() {
    if (reduce) return;
    var vh = window.innerHeight;
    glints.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = 1 - (r.top + r.height / 2) / vh;
      el.style.setProperty('--g', Math.max(0, Math.min(1, p)).toFixed(3));
    });
  }
  updateGlint();

  // menu no celular
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    [].forEach.call(document.querySelectorAll('main, footer, .sticky-cta'), function (el) {
      if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    if (open) requestAnimationFrame(function () { menu.querySelector('a').focus(); });
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  [].forEach.call(menu.querySelectorAll('a'), function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
  });
  var wide = window.matchMedia('(min-width: 901px)');
  var onWide = function (e) { if (e.matches) setMenu(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide); else wide.addListener(onWide);

  // profundidade do hero com o mouse (só desktop)
  var stage = document.getElementById('stage');
  if (stage && !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    stage.parentElement.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      stage.style.setProperty('--px', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
      stage.style.setProperty('--py', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
    });
    stage.parentElement.addEventListener('mouseleave', function () {
      stage.style.setProperty('--px', 0); stage.style.setProperty('--py', 0);
    });
  }
})();
