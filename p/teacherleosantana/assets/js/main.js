(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mq = window.matchMedia('(min-width: 901px)');

  var nav = document.getElementById('nav');
  var cutout = document.querySelector('.cutout');
  var stub = document.querySelector('.stub-float');
  var hero = document.querySelector('.hero');
  var ptext = document.querySelector('.platform-text');
  var platform = document.querySelector('.platform');
  var phone = document.querySelector('.p-phone');
  var pArt = document.querySelector('.platform-art');
  var arch = document.querySelector('.arch');
  var about = document.querySelector('.about');
  var ticking = false;

  function progress(el, startAt, endAt) {
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * startAt - r.top) / (r.height + vh * (startAt - endAt));
    return Math.min(1, Math.max(0, p));
  }

  function frame() {
    ticking = false;
    nav.classList.toggle('scrolled', window.scrollY > 40);
    if (reduce) return;
    if (!mq.matches) {
      [cutout, stub, ptext, phone, arch].forEach(function (el) { el.style.transform = ''; el.style.translate = ''; });
      return;
    }
    var p = progress(hero, 1, 0);
    cutout.style.transform = 'translateY(' + (p * 8) + '%) scale(' + (1 + p * 0.05) + ')';
    stub.style.translate = '0 ' + (-p * 120) + 'px';
    var q = progress(platform, 1, 0);
    ptext.style.transform = 'translateX(' + (-q * 35) + '%)';
    var f = progress(pArt, 0.9, 0.3);
    phone.style.transform = 'translateY(' + (60 - f * 90) + 'px) rotate(' + (8 - f * 5) + 'deg)';
    var a = progress(about, 0.8, 0.4);
    arch.style.transform = 'rotate(' + (-6 + a * 7) + 'deg)';
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  // revelar ao entrar na tela
  var targets = document.querySelectorAll('.eyebrow, h2, .lead, .about-copy p, .bignums li, .platform-copy p, .ticket, .reel-scroller a, .final .btn');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el, i) {
      if (el.closest('.hero')) return;
      el.classList.add('rv');
      if (el.matches('.bignums li, .reel-scroller a')) el.style.setProperty('--d', ((i % 4) * 0.08) + 's');
      io.observe(el);
    });
  }
})();
