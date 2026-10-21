(function () {
  'use strict';

  var root = document.documentElement;
  var chipsBox = document.querySelector('.chips');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var media = document.getElementById('panelMedia');
  var nameEl = document.getElementById('swatchName');
  var titleEl = document.getElementById('heroTitle');
  var textEl = document.getElementById('heroText');
  var applied = 0;
  var request = 0;
  var cleanTimer = null;

  function applyState(index) {
    var chip = chips[index];
    applied = index;
    root.style.setProperty('--tone', chip.dataset.tone);
    root.style.setProperty('--on', chip.dataset.on);
    chips.forEach(function (c, i) {
      var on = i === index;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    dots.forEach(function (d, i) {
      d.setAttribute('aria-pressed', i === index ? 'true' : 'false');
    });
    nameEl.textContent = chip.dataset.name;
    titleEl.textContent = chip.dataset.title;
    textEl.textContent = chip.dataset.text;
  }

  function trimImages() {
    var all = media.querySelectorAll('img');
    for (var i = 0; i < all.length - 1; i++) all[i].remove();
  }

  function setSwatch(index, fromKeyboard) {
    var chip = chips[index];
    if (!chip) return;
    var mine = ++request; // invalida qualquer carregamento pendente
    if (index === applied) return;

    var next = new Image();
    next.width = parseInt(chip.dataset.w, 10);
    next.height = parseInt(chip.dataset.h, 10);
    next.alt = chip.dataset.alt;
    next.decoding = 'async';

    next.onload = function () {
      if (mine !== request) return; // um clique mais novo já assumiu
      applyState(index);
      next.classList.add('is-new');
      media.appendChild(next);
      window.clearTimeout(cleanTimer);
      cleanTimer = window.setTimeout(trimImages, 1000);
    };
    next.onerror = function () {
      // a foto não carregou: nada muda e o estado continua o aplicado
    };
    next.src = chip.dataset.img;

    if (fromKeyboard) {
      chip.focus({ preventScroll: true });
      scrollChipIntoView(index);
    }
  }

  function scrollChipIntoView(index) {
    var chip = chips[index];
    if (!chip || !chipsBox) return;
    var left = chip.offsetLeft - (chipsBox.clientWidth - chip.offsetWidth) / 2;
    chipsBox.scrollTo({ left: left, behavior: 'smooth' });
  }

  chips.forEach(function (chip, i) {
    chip.addEventListener('click', function () { setSwatch(i); });
    chip.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSwatch((i + 1) % chips.length, true);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSwatch((i - 1 + chips.length) % chips.length, true);
      }
    });
  });

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      setSwatch(i);
      scrollChipIntoView(i);
    });
  });

  // Alternar projeto 3D e obra pronta
  Array.prototype.forEach.call(document.querySelectorAll('[data-compare]'), function (fig) {
    var a = fig.querySelector('.cmp-a');
    var b = fig.querySelector('.cmp-b');
    var buttons = fig.querySelectorAll('.cmp-switch button');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var showA = btn.dataset.show === 'a';
        a.classList.toggle('is-show', showA);
        b.classList.toggle('is-show', !showA);
        a.setAttribute('aria-hidden', showA ? 'false' : 'true');
        b.setAttribute('aria-hidden', showA ? 'true' : 'false');
        Array.prototype.forEach.call(buttons, function (other) {
          other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
        });
      });
    });
  });

  // Aparecer ao rolar (uma vez)
  var items = document.querySelectorAll('.reveal');
  function showAll() {
    Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
          (function (el) { window.setTimeout(function () { el.style.transitionDelay = ''; }, 1200); })(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(items, function (el, i) {
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
      io.observe(el);
    });
    window.addEventListener('load', function () { window.setTimeout(showAll, 6000); });
  } else {
    showAll();
  }
})();
