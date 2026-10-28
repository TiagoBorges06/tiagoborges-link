(function () {
  'use strict';

  var WA_NUMERO = '5531981023576';
  var MSG_BASE = 'Olá, Cintia! Vim pelo seu site e gostaria de agendar uma avaliação.';

  function linkWa(texto) {
    return 'https://wa.me/' + WA_NUMERO + '?text=' + encodeURIComponent(texto);
  }

  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = linkWa(MSG_BASE);
    a.target = '_blank';
  });

  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* revelar ao rolar */
  var itens = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduz) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          (function (t) { setTimeout(function () { t.style.transitionDelay = ''; }, 1100); })(e.target);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    itens.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    itens.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* frase: palavras acendem conforme a rolagem */
  var frase = document.querySelector('[data-leitura]');
  var palavras = [];
  if (frase) {
    var partes = frase.textContent.trim().split(/\s+/);
    frase.textContent = '';
    partes.forEach(function (p, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = p + (i < partes.length - 1 ? ' ' : '');
      frase.appendChild(s);
      palavras.push(s);
    });
  }

  var topo = document.getElementById('topo');
  var flut = document.querySelector('.flutuante');
  var paralax = document.querySelectorAll('[data-parallax]');
  var vh = window.innerHeight;
  var ticking = false;

  function atualiza() {
    ticking = false;
    var y = window.scrollY || 0;
    topo.classList.toggle('is-fundo', y > 40);
    flut.classList.toggle('is-on', y > vh * 0.7);

    if (frase && !reduz) {
      var r = frase.getBoundingClientRect();
      var ini = vh * 0.85;
      var fim = vh * 0.25;
      var prog = (ini - r.top) / (ini - fim + r.height * 0.6);
      prog = Math.max(0, Math.min(1, prog));
      var n = Math.round(prog * palavras.length);
      for (var i = 0; i < palavras.length; i++) {
        palavras[i].classList.toggle('on', i < n);
      }
    } else if (frase) {
      palavras.forEach(function (w) { w.classList.add('on'); });
    }

    if (reduz || window.innerWidth < 860) {
      paralax.forEach(function (el) { el.style.transform = ''; });
    } else {
      paralax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var f = parseFloat(el.getAttribute('data-parallax'));
        var centro = r.top + r.height / 2 - vh / 2;
        el.style.transform = 'translate3d(0,' + (centro * f * -1).toFixed(1) + 'px,0)';
      });
    }
  }

  function pede() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(atualiza);
    }
  }
  window.addEventListener('scroll', pede, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; pede(); });
  atualiza();

  /* mapa de queixas */
  var chips = document.querySelectorAll('.chip');
  var painel = document.querySelector('.painel');
  var pt = document.getElementById('painel-t');
  var pd = document.getElementById('painel-d');
  var pw = document.getElementById('painel-wa');

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', 'true');
      pt.textContent = c.getAttribute('data-t');
      pd.textContent = c.getAttribute('data-d');
      pw.href = linkWa('Olá, Cintia! Vim pelo seu site e gostaria de agendar uma avaliação. O que mais me incomoda: ' + c.getAttribute('data-q') + '.');
      painel.classList.remove('troca');
      void painel.offsetWidth;
      painel.classList.add('troca');
    });
  });
})();
