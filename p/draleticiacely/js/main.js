(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // topo ganha fundo ao rolar
  var top = document.querySelector('.top');
  function onTop() { top.classList.toggle('scrolled', window.scrollY > 40); }
  onTop();
  window.addEventListener('scroll', onTop, { passive: true });

  // manifesto: palavras se acendem conforme a rolagem
  var man = document.querySelector('[data-words]');
  var words = [];
  if (man) {
    var text = man.textContent.trim();
    man.setAttribute('aria-label', text);
    man.textContent = '';
    text.split(/\s+/).forEach(function (t, i, all) {
      var s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = t + (i < all.length - 1 ? ' ' : '');
      if (/proporção|individualidade/i.test(t)) s.classList.add('gold');
      man.appendChild(s);
      words.push(s);
    });
  }

  // perfil: desenha ao entrar na tela e acende o ponto do tratamento ativo
  var profile = document.querySelector('.profile');
  var steps = [].slice.call(document.querySelectorAll('.step'));
  if (profile && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es, ob) {
      if (es[0].isIntersecting) { profile.classList.add('drawn'); ob.disconnect(); }
    }, { threshold: 0.2 }).observe(profile);

    var stepIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          steps.forEach(function (s) { s.classList.toggle('on', s === e.target); });
          profile.setAttribute('data-active', e.target.getAttribute('data-key'));
        }
      });
    }, { rootMargin: window.matchMedia('(min-width: 900px)').matches ? '-42% 0px -42% 0px' : '-62% 0px -22% 0px' });
    steps.forEach(function (s) { stepIO.observe(s); });
    if (steps[0]) steps[0].classList.add('on');
  } else if (profile) {
    profile.classList.add('drawn');
    steps.forEach(function (s) { s.classList.add('on'); });
  }

  // revelar ao entrar na tela
  var rv = [].slice.call(document.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window && !reduce) {
    var rvIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    rv.forEach(function (el) { rvIO.observe(el); });
    // rede de segurança: nada fica escondido
    window.addEventListener('load', function () {
      setTimeout(function () { rv.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); }); }, 1200);
    });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  // paralaxe leve (só telas grandes) e progresso do manifesto
  var par = [].slice.call(document.querySelectorAll('[data-par]'));
  var wide = window.matchMedia('(min-width: 900px)');
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    if (words.length && !reduce) {
      var r = man.getBoundingClientRect();
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.25);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    }
    if (!wide.matches || reduce) {
      par.forEach(function (el) { el.style.transform = ''; });
    } else {
      par.forEach(function (el) {
        var b = el.getBoundingClientRect();
        var c = (b.top + b.height / 2 - vh / 2);
        el.style.transform = 'translate3d(0,' + (c * parseFloat(el.getAttribute('data-par'))).toFixed(1) + 'px,0)';
      });
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  frame();
})();
