/* Amâncio Odontologia — motion
   Tudo é opcional: se GSAP/Lenis não carregarem, a página continua legível (as classes de
   estado inicial só entram quando o GSAP existe). */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDesktop = window.matchMedia('(min-width: 1025px)').matches;

  /* ---------- Navegação: estado "colada" + menu mobile ---------- */
  var nav = document.getElementById('nav');
  function onScrollNav() {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 24);
  }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  var burger = document.getElementById('navBurger');
  var overlay = document.getElementById('menuOverlay');
  var lenis = null;

  var inertEls = document.querySelectorAll('main, footer');
  function setMenu(open) {
    if (!burger || !overlay) return;
    var wasOpen = overlay.classList.contains('is-open');
    inertEls.forEach(function (el) { open ? el.setAttribute('inert', '') : el.removeAttribute('inert'); });
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    overlay.classList.toggle('is-open', open);
    overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    doc.style.overflow = open ? 'hidden' : '';
    if (lenis) { open ? lenis.stop() : lenis.start(); }
    if (open) { var first = overlay.querySelector('a'); if (first) first.focus(); }
    else if (wasOpen) burger.focus();
  }
  if (burger && overlay) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024 && overlay.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ---------- Rolagem suave + âncoras ---------- */
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (a.classList.contains('skip-link')) { target.focus(); return; }
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- GSAP ---------- */
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  if (!gsap || !ST || reduce) return;

  gsap.registerPlugin(ST);
  doc.classList.add('anim');

  // Arco do sorriso: traço que se desenha
  var arc = document.querySelector('.smile-arc-main');
  if (arc) {
    arc.setAttribute('pathLength', '1');
    gsap.to(arc, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', delay: 0.5 });
  }

  // Revelações ao rolar
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  // Parallax suave nas fotos (só desktop)
  if (isDesktop) {
    gsap.utils.toArray('[data-parallax] .figure-media img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -7, scale: 1.14 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: img.closest('.figure'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  // Frase final revelada palavra a palavra (marca-texto petrol)
  var words = gsap.utils.toArray('.hl-word');
  if (words.length) {
    gsap.set(words, { '--hl': '0%' });
    var hl = gsap.timeline({
      scrollTrigger: { trigger: '#highlightLine', start: 'top 78%', end: 'bottom 40%', scrub: 0.6 }
    });
    words.forEach(function (w) {
      hl.to(w, { color: '#F6F5F1', '--hl': '100%', duration: 1, ease: 'none' });
    });
  }

  // Recalcula depois que as imagens carregam
  window.addEventListener('load', function () { ST.refresh(); });
})();
