(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* atrasos dos reveals */
  $$('[data-d]').forEach(function (el) { el.style.setProperty('--d', el.getAttribute('data-d') + 's'); });

  /* reveal ao rolar */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }
  window.addEventListener('load', function () { setTimeout(function () { rv.forEach(function (el) { el.classList.add('in'); }); }, 4000); });

  /* topo: fundo ao rolar + menu mobile + link ativo */
  var top = $('#top'), btn = $('#menuBtn'), nav = $('#nav');
  function onTop() { top.classList.toggle('solid', window.scrollY > 24); }
  window.addEventListener('scroll', onTop, { passive: true }); onTop();
  btn.addEventListener('click', function () {
    var o = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', o ? 'true' : 'false');
    btn.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu');
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }); });
  var links = $$('.nav a.lnk'), secs = links.map(function (a) { return $(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var i = secs.indexOf(e.target); links.forEach(function (l, k) { l.classList.toggle('on', k === i); }); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { if (s) so.observe(s); });
  }

  /* texto que se revela palavra por palavra (leitura assistida) */
  var read = $('#read');
  if (read && !reduce) {
    var words = [];
    (function split(node, key) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var s = document.createElement('span'); s.className = 'w' + (key ? ' k' : ''); s.textContent = t; frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { split(n, n.tagName === 'MARK'); }
      });
    })(read, false);
    var ticking = false;
    var upd = function () {
      ticking = false;
      var r = read.getBoundingClientRect(), h = window.innerHeight;
      var p = (h * 0.85 - r.top) / (r.height + h * 0.25);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd); upd();
  }

  /* inclinação 3D do retrato e da placa */
  function tilt(area, el, max) {
    if (!fine || reduce) return;
    area.addEventListener('pointermove', function (e) {
      var r = area.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = 'rotateY(' + (x * max) + 'deg) rotateX(' + (-y * max) + 'deg)';
    });
    area.addEventListener('pointerleave', function () { el.style.transform = ''; });
  }
  tilt($('#stage'), $('#tilt'), 14);
  tilt($('#plaque'), $('#face'), 10);

  /* brilho que segue o mouse nos cartões */
  if (fine) $$('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* vídeos: só carrega o player ao tocar */
  $$('.poster').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = b.getAttribute('aria-label').replace('Reproduzir: ', '');
      f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      var parent = b.parentNode, d = document.createElement('div');
      d.className = 'poster';
      parent.replaceChild(d, b);
      d.appendChild(f);
      f.focus();
    });
  });

  /* ondas de voz (vapor do café) no fundo do hero */
  var cv = $('#steam');
  if (cv && !reduce && fine && window.innerWidth >= 900) {
    document.documentElement.classList.add('canvas-on');
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, mx = 0.5, t = 0, vis = true, last = 0;
    var hero = cv.parentNode;
    var size = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); window.addEventListener('resize', size);
    if (fine) hero.addEventListener('pointermove', function (e) { mx = e.clientX / window.innerWidth; });
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(hero);
    var lines = 7;
    var draw = function (now) {
      requestAnimationFrame(draw);
      if (!vis || now - last < 33) return; last = now; t += 0.018;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < lines; i++) {
        var k = i / (lines - 1);
        ctx.beginPath();
        for (var x = 0; x <= W; x += 8) {
          var nx = x / W;
          var amp = (10 + 34 * k) * (0.6 + 0.8 * Math.abs(Math.sin(nx * 3 + mx * 4)));
          var y = H * (0.25 + 0.7 * k) + Math.sin(nx * 6 + t * (1 + k) + i) * amp * 0.5 + Math.sin(nx * 13 - t * 1.6 + mx * 6) * amp * 0.22;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(154,79,29,' + (0.10 + 0.22 * (1 - k)) + ')';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    };
    requestAnimationFrame(draw);
  }
})();
