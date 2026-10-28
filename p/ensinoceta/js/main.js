(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* aparecer ao rolar. Depois de revelado, o elemento perde a classe para os efeitos de hover voltarem a funcionar */
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  function finish(el) {
    el.classList.remove('reveal', 'in', 'd1', 'd2', 'd3');
  }
  function show(el) {
    if (!el.classList.contains('reveal') || el.classList.contains('in')) return;
    el.classList.add('in');
    var done = false;
    var end = function (e) {
      if (done || (e && e.propertyName !== 'transform')) return;
      done = true;
      el.removeEventListener('transitionend', end);
      finish(el);
    };
    el.addEventListener('transitionend', end);
    setTimeout(end, 1500);
  }
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
    window.addEventListener('load', function () {
      setTimeout(function () { reveals.forEach(show); }, 4000);
    });
  } else {
    reveals.forEach(finish);
  }

  /* texto que "acende" palavra por palavra ao rolar */
  var mega = document.getElementById('mega');
  var words = [];
  if (mega) {
    var text = mega.textContent.trim().split(/\s+/);
    mega.textContent = '';
    text.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      mega.appendChild(s);
      if (i < text.length - 1) mega.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  }

  /* barra do topo, trilho de crescimento e texto aceso, tudo em um só ouvinte */
  var nav = document.querySelector('.nav');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.pageYOffset || doc.scrollTop;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    doc.style.setProperty('--p', Math.min(1, Math.max(0, y / max)).toFixed(4));
    nav.classList.toggle('solid', y > 40);
    if (words.length) {
      var r = mega.getBoundingClientRect();
      var vh = window.innerHeight;
      var prog = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      prog = Math.min(1, Math.max(0, prog));
      var upto = reduce ? words.length : Math.round(prog * words.length);
      for (var i = 0; i < words.length; i++) {
        words[i].classList.toggle('on', i < upto);
      }
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  onScroll();

  /* profundidade no topo, só com mouse e tela grande */
  var hero = document.querySelector('.hero');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 960px)').matches;
  if (hero && fine && !reduce) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      hero.style.setProperty('--mx', x.toFixed(3));
      hero.style.setProperty('--my', y.toFixed(3));
    }, { passive: true });
  }

  /* menu do celular: trava a rolagem, leva o foco para dentro e devolve ao fechar */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  var behind = [document.getElementById('conteudo'), document.querySelector('.foot'), document.querySelector('.skip')];
  function isOpen() { return burger.getAttribute('aria-expanded') === 'true'; }
  function setMenu(open, returnFocus) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    doc.classList.toggle('lock', open);
    behind.forEach(function (el) {
      if (!el) return;
      if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    if (open) {
      var first = menu.querySelector('a');
      if (first) setTimeout(function () { if (isOpen()) first.focus({ preventScroll: true }); }, 80);
    } else if (returnFocus) {
      burger.focus({ preventScroll: true });
    }
  }
  burger.addEventListener('click', function () { setMenu(!isOpen(), true); });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false, false);
  });
  document.querySelector('.brand').addEventListener('click', function () {
    if (isOpen()) setMenu(false, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) setMenu(false, true);
  });
  var wide = window.matchMedia('(min-width: 901px)');
  var onWide = function (e) { if (e.matches && isOpen()) setMenu(false, false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);
  else if (wide.addListener) wide.addListener(onWide);
})();
