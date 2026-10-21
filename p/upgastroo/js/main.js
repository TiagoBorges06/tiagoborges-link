(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* menu no celular */
  var burger = document.querySelector('.top__burger');
  var nav = document.getElementById('menu');
  if (burger && nav) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.querySelector('.sr').textContent = open ? 'Fechar menu' : 'Abrir menu';
      nav.classList.toggle('is-open', open);
    };
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
    });
  }

  /* faixa de clientes: duplica a lista para o loop ficar contínuo */
  var track = document.querySelector('.strip__track');
  if (track) {
    Array.prototype.slice.call(track.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelector('img').alt = '';
      track.appendChild(c);
    });
  }

  /* aparecer ao rolar (uma vez) */
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (el.closest('.hero') ? i * 90 : 0) + 'ms';
      io.observe(el);
    });
    window.addEventListener('load', function () {
      setTimeout(function () { items.forEach(function (el) { el.classList.add('is-in'); }); }, 4000);
    });
  }

  /* cardápio 3D acompanha o mouse (só desktop) */
  var card = document.getElementById('menuCard');
  if (card && fine && !reduce) {
    var stage = card.parentElement;
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', (x * 14 - 2).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
    });
    stage.addEventListener('pointerleave', function () {
      card.style.removeProperty('--ry');
      card.style.removeProperty('--rx');
    });
  }

  /* desenhos de fundo com leve paralaxe */
  var doodles = document.querySelectorAll('[data-par]');
  if (doodles.length && !reduce) {
    var ticking = false;
    var update = function () {
      var y = window.scrollY;
      doodles.forEach(function (d) {
        var sp = parseFloat(d.getAttribute('data-par'));
        d.style.transform = 'translate3d(0,' + (y * sp).toFixed(1) + 'px,0) rotate(' + (y * sp * 0.04).toFixed(2) + 'deg)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* vídeos: o player só carrega quando a pessoa toca */
  document.querySelectorAll('.vid').forEach(function (box) {
    var btn = box.querySelector('.vid__btn');
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + box.getAttribute('data-id') + '?autoplay=1&rel=0&playsinline=1';
      f.title = btn.getAttribute('aria-label').replace('Assistir: ', '');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      btn.replaceWith(f);
      f.focus();
    });
  });

  /* comanda: monta a mensagem e abre o WhatsApp da UpGastrô */
  var form = document.getElementById('comanda');
  var msg = document.getElementById('comandaMsg');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var nome = (d.get('nome') || '').toString().trim();
      var empresa = (d.get('empresa') || '').toString().trim();
      var fat = (d.get('fat') || '').toString();
      var campos = { nome: !nome, empresa: !empresa, fat: !fat };
      var primeiro = null;
      Object.keys(campos).forEach(function (k) {
        var el = form.elements[k];
        el.setAttribute('aria-invalid', campos[k] ? 'true' : 'false');
        if (campos[k]) { el.setAttribute('aria-describedby', 'comandaMsg'); if (!primeiro) primeiro = el; }
        else el.removeAttribute('aria-describedby');
      });
      if (primeiro) {
        msg.textContent = 'Preencha seu nome, o nome do restaurante e a faixa de faturamento.';
        primeiro.focus();
        return;
      }
      var insta = (d.get('insta') || '').toString().trim();
      var texto = 'Olá! Sou ' + nome + ', do restaurante ' + empresa + '.' +
        (insta ? ' Instagram: ' + insta + '.' : '') +
        ' Faturamento: ' + fat + '. Quero falar com um consultor da UpGastrô.';
      var url = 'https://wa.me/5531999630171?text=' + encodeURIComponent(texto);
      msg.textContent = '';
      var a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Abrir o WhatsApp';
      msg.appendChild(a);
      window.open(url, '_blank', 'noopener');
    });
  }
  window.__upOk = true;
})();
