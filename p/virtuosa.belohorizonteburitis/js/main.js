(function () {
  'use strict';

  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '553191280492';

  /* revelar ao rolar */
  var alvos = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduz) {
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) {
        if (i.isIntersecting) { i.target.classList.add('in'); io.unobserve(i.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    alvos.forEach(function (a) { io.observe(a); });
  } else {
    alvos.forEach(function (a) { a.classList.add('in'); });
  }

  /* abas de tratamentos (setas, Home e End) */
  var abas = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function abrir(aba, foco) {
    abas.forEach(function (t) {
      var ativa = t === aba;
      t.setAttribute('aria-selected', ativa ? 'true' : 'false');
      t.tabIndex = ativa ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !ativa;
    });
    if (foco) aba.focus();
  }
  abas.forEach(function (t, i) {
    t.addEventListener('click', function () { abrir(t, false); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = abas[(i + 1) % abas.length];
      else if (k === 'ArrowUp' || k === 'ArrowLeft') n = abas[(i - 1 + abas.length) % abas.length];
      else if (k === 'Home') n = abas[0];
      else if (k === 'End') n = abas[abas.length - 1];
      if (n) { e.preventDefault(); abrir(n, true); }
    });
  });

  /* menu fixo: marca a seção visível */
  var links = {};
  document.querySelectorAll('[data-nav]').forEach(function (a) { links[a.getAttribute('data-nav')] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) {
        if (!i.isIntersecting) return;
        var id = i.target.id;
        Object.keys(links).forEach(function (k) {
          links[k].classList.toggle('on', k === id);
          if (k === id) links[k].setAttribute('aria-current', 'true'); else links[k].removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    document.querySelectorAll('[data-spy]').forEach(function (s) { spy.observe(s); });
  }

  /* vídeo do YouTube só carrega ao tocar */
  document.querySelectorAll('.video__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = 'Vídeo: ' + b.getAttribute('data-titulo');
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox');
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      b.replaceWith(f);
      f.focus();
    });
  });

  /* formulário abre o WhatsApp com a mensagem pronta */
  var form = document.getElementById('form-wa');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = form.elements.nome;
      var ok = nome.value.trim().length > 1;
      nome.setAttribute('aria-invalid', ok ? 'false' : 'true');
      var erro = document.getElementById('erro-nome');
      if (erro) erro.hidden = ok;
      if (!ok) { nome.focus(); return; }
      var txt = 'Olá! Meu nome é ' + nome.value.trim() + '. Vim pelo site da Virtuosa Buritis e tenho interesse em: ' + form.elements.interesse.value + '. Gostaria de agendar uma avaliação.';
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    });
  }

  /* profundidade na foto da abertura: inclina com o mouse e desloca na rolagem */
  var foto = document.getElementById('tilt');
  var fino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (foto && !reduz) {
    var cena = foto.parentElement;
    if (fino) {
      cena.addEventListener('pointermove', function (e) {
        var r = cena.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        foto.style.transform = 'rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 5).toFixed(2) + 'deg)';
      });
      cena.addEventListener('pointerleave', function () { foto.style.transform = ''; });
    }
    var painel = cena.querySelector('.hero__painel');
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 900);
        if (painel) painel.style.transform = 'translateY(' + (y * 0.08).toFixed(1) + 'px)';
        ticking = false;
      });
    }, { passive: true });
  }
})();
