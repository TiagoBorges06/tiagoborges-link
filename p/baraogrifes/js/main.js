(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 900px)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // WhatsApp: mensagem pronta em cada botão
  $$('[data-wa]').forEach(function (a) {
    var base = a.getAttribute('href').split('&text=')[0];
    a.setAttribute('href', base + '&text=' + encodeURIComponent(a.getAttribute('data-wa')));
  });

  // Navegação com fundo ao rolar
  var nav = $('#nav');
  function navState() { nav.classList.toggle('scrolled', window.scrollY > 40); }

  // Revelar ao entrar na tela
  var rvTargets = $$('.numbers .num, .aisles-head, .store-copy, .store-photo, .statement .cta-row');
  rvTargets.forEach(function (el) { el.classList.add('rv'); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    rvTargets.forEach(function (el) { io.observe(el); });
  } else {
    rvTargets.forEach(function (el) { el.classList.add('in'); });
  }

  // Contadores
  var counted = false;
  function runCounters() {
    if (counted) return; counted = true;
    $$('[data-count]').forEach(function (el) {
      var end = parseInt(el.getAttribute('data-count'), 10);
      var suf = el.getAttribute('data-suffix') || '';
      var sep = el.getAttribute('data-sep');
      var t0 = null, dur = 1400;
      function fmt(n) { return sep ? n.toLocaleString('pt-BR') : String(n); }
      if (reduce) { el.textContent = fmt(end) + suf; return; }
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(end * e)) + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  var numSec = $('#numeros');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es, o) {
      if (es[0].isIntersecting) { runCounters(); o.disconnect(); }
    }, { threshold: 0.4 }).observe(numSec);
  } else { runCounters(); }

  // Texto da declaração: palavras acendem conforme a rolagem
  var rev = $('#reveal');
  var words = [];
  if (rev) {
    var txt = rev.textContent.trim().split(/\s+/);
    var sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = txt.join(' ');
    rev.textContent = ''; rev.appendChild(sr);
    txt.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w'; s.setAttribute('aria-hidden', 'true');
      s.textContent = w + (i < txt.length - 1 ? ' ' : '');
      rev.appendChild(s); words.push(s);
    });
  }
  function revealState() {
    if (!rev) return;
    if (reduce) { words.forEach(function (w) { w.classList.add('on'); }); return; }
    var r = rev.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.5);
    p = Math.max(0, Math.min(1, p));
    var n = Math.round(p * words.length);
    words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
  }

  // Corredores: rolagem vertical vira lateral no desktop
  var aisles = $('#corredores'), sticky = $('#aislesSticky'), track = $('#aislesTrack'), bar = $('#aisleBar');
  var maxX = 0;
  function layoutAisles() {
    if (!aisles) return;
    if (desktop.matches && !reduce) {
      aisles.classList.add('is-pinned');
      track.style.transform = '';
      maxX = Math.max(0, track.scrollWidth - document.documentElement.clientWidth + 80);
      aisles.style.height = (window.innerHeight + maxX) + 'px';
    } else {
      aisles.classList.remove('is-pinned');
      aisles.style.height = '';
      track.style.transform = '';
      if (bar) bar.style.transform = '';
    }
  }
  function aislesState() {
    if (!aisles || !aisles.classList.contains('is-pinned')) return;
    var top = aisles.offsetTop, y = window.scrollY - top;
    var p = Math.max(0, Math.min(1, y / (maxX || 1)));
    track.style.transform = 'translate3d(' + (-p * maxX) + 'px,0,0)';
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
  }

  track && track.addEventListener('focusin', function (e) {
    sticky.scrollLeft = 0;
    if (!aisles.classList.contains('is-pinned')) return;
    var panel = e.target.closest('.panel'); if (!panel) return;
    var need = Math.max(0, Math.min(maxX, panel.offsetLeft - 80));
    window.scrollTo(0, aisles.offsetTop + need);
  });
  sticky && sticky.addEventListener('scroll', function () { sticky.scrollLeft = 0; });

  // Paralaxe (palavra gigante, foto da loja) e inclinação do mouse
  var giant = $('.giant-word'), storePhoto = $('.store-photo img'), storeWrap = $('.store-photo');
  function parallax() {
    if (reduce) return;
    var y = window.scrollY;
    if (giant && y < window.innerHeight * 1.3) giant.style.transform = 'translate(-50%,calc(-48% + ' + (y * 0.22) + 'px))';
    if (storeWrap && storePhoto) {
      var r = storeWrap.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom > 0 && r.top < vh) {
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        storePhoto.style.transform = 'translate3d(0,' + (Math.min(0, p * -40) - 12) + 'px,0)';
      }
    }
  }
  var stack = $('#stack');
  if (stack && !reduce && window.matchMedia('(hover:hover)').matches) {
    var items = $$('[data-depth]', stack);
    var hero = $('#hero');
    hero.addEventListener('pointermove', function (e) {
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      items.forEach(function (el) {
        var d = parseFloat(el.getAttribute('data-depth'));
        el.style.translate = (x * d) + 'px ' + (y * d) + 'px';
      });
    });
    hero.addEventListener('pointerleave', function () { items.forEach(function (el) { el.style.translate = ''; }); });
  }

  // Velocidade da faixa de marcas acompanha a rolagem
  var marq = $('.marquee .track'), lastY = window.scrollY, boost = 0;
  function marqueeBoost() {
    if (reduce || !marq || !marq.getAnimations) return;
    var an = marq.getAnimations()[0]; if (!an) return;
    an.playbackRate = 1 + Math.min(Math.abs(boost) * 0.25, 6);
    boost *= 0.9;
    if (Math.abs(boost) < 0.05) { boost = 0; an.playbackRate = 1; }
  }

  var ticking = false;
  function onScroll() {
    boost += window.scrollY - lastY; lastY = window.scrollY;
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      navState(); aislesState(); revealState(); parallax(); ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layoutAisles(); aislesState(); });
  desktop.addEventListener && desktop.addEventListener('change', function () { layoutAisles(); aislesState(); });
  window.addEventListener('load', function () { layoutAisles(); aislesState(); });
  var tick = setInterval(function () { if (document.hidden) return; if (boost) marqueeBoost(); }, 80);
  if (reduce) clearInterval(tick);
  layoutAisles(); navState(); revealState(); parallax();
  window.addEventListener('load', function () { try { var t = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView(); } catch (e) {} });
})();
