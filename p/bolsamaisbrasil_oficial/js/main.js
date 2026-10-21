(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = 'https://wa.me/5508004414321?text=';

  function waLink(level) {
    var text = 'Oi, gostaria de saber informações sobre bolsas de estudo no curso: ' + (level || '');
    return WA + encodeURIComponent(text.trim());
  }

  /* WhatsApp: abre a conversa já com o nível escrito */
  var waLinks = document.querySelectorAll('[data-wa]');
  function setWa(level) {
    waLinks.forEach(function (a) {
      if (!a.hasAttribute('data-level')) a.href = waLink(level);
    });
  }
  waLinks.forEach(function (a) {
    var lv = a.getAttribute('data-level');
    a.href = waLink(lv || 'Graduação');
  });

  /* Abertura: as três desculpas viram resposta */
  var flips = document.querySelectorAll('.flip');
  flips.forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  });
  var delay = reduce ? 0 : 1100;
  flips.forEach(function (b, i) {
    window.setTimeout(function () {
      if (!b.dataset.touched) b.setAttribute('aria-pressed', 'true');
    }, reduce ? 0 : delay + i * 900);
    b.addEventListener('click', function () { b.dataset.touched = '1'; });
  });

  /* Voucher: troca o nível e inclina com o ponteiro */
  var voucher = document.getElementById('voucher');
  var levelEl = document.getElementById('v-level');
  var chips = document.querySelectorAll('.chip');
  var swapTimer = 0;
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      chip.setAttribute('aria-pressed', 'true');
      var level = chip.getAttribute('data-level');
      levelEl.classList.add('swap');
      window.clearTimeout(swapTimer);
      swapTimer = window.setTimeout(function () {
        levelEl.textContent = level;
        levelEl.classList.remove('swap');
      }, reduce ? 0 : 180);
      setWa(level);
    });
  });
  if (voucher && !reduce) {
    voucher.classList.add('settle');
    var stage = document.getElementById('stage');
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canHover && stage) {
      var raf = 0, nx = 0, ny = 0;
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        nx = (e.clientX - r.left) / r.width - 0.5;
        ny = (e.clientY - r.top) / r.height - 0.5;
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0;
          voucher.classList.remove('settle');
          voucher.style.setProperty('--ry', (nx * 22).toFixed(1) + 'deg');
          voucher.style.setProperty('--rx', (-ny * 16).toFixed(1) + 'deg');
        });
      }, { passive: true });
      stage.addEventListener('pointerleave', function () {
        voucher.style.setProperty('--ry', '0deg');
        voucher.style.setProperty('--rx', '0deg');
      });
    }
  }

  /* Revelar ao rolar (uma vez) */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
    window.setTimeout(function () { reveals.forEach(function (el) { el.classList.add('in'); }); }, 6000);
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Depoimentos (abas com teclado) */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.st-tabs [role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var k = e.key, n = -1;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (k === 'ArrowUp' || k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (k === 'Home') n = 0;
      else if (k === 'End') n = tabs.length - 1;
      if (n > -1) { e.preventDefault(); selectTab(tabs[n], true); }
    });
  });

  /* Menu no celular */
  var toggle = document.querySelector('.bar-toggle');
  var menu = document.getElementById('menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }
})();
