(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* topo: fundo ao rolar + menu do celular */
  var topo = d.getElementById('topo'), burger = d.getElementById('burger'), menu = d.getElementById('menu');
  function aoRolar() { topo.classList.toggle('rolou', window.scrollY > 24); }
  window.addEventListener('scroll', aoRolar, { passive: true }); aoRolar();
  burger.addEventListener('click', function () {
    var ab = menu.classList.toggle('aberto');
    burger.setAttribute('aria-expanded', ab ? 'true' : 'false');
    burger.setAttribute('aria-label', ab ? 'Fechar menu' : 'Abrir menu');
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('aberto')) {
      menu.classList.remove('aberto'); burger.setAttribute('aria-expanded', 'false'); burger.focus();
    }
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { menu.classList.remove('aberto'); burger.setAttribute('aria-expanded', 'false'); }
  });

  /* revelar ao rolar (uma vez) */
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduz) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
    setTimeout(function () { rv.forEach(function (el) { el.classList.add('in'); }); }, 6000);
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* O Perfil: a linha se desenha conforme a rolagem */
  var sec = d.getElementById('perfil'), linha = d.getElementById('perfil-linha');
  if (!sec || !linha || !linha.getTotalLength) return;
  var total = linha.getTotalLength(), cabeca = d.getElementById('cabeca'), g = d.getElementById('pontos');
  var itens = Array.prototype.slice.call(d.querySelectorAll('#estacoes .est'));
  var NS = 'http://www.w3.org/2000/svg';
  linha.style.strokeDasharray = total;

  function comprimentoMaisPerto(x, y) {
    var melhor = 0, dist = 1e9, i, p, dd;
    for (i = 0; i <= total; i += 2) {
      p = linha.getPointAtLength(i); dd = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (dd < dist) { dist = dd; melhor = i; }
    }
    return melhor;
  }
  var est = itens.map(function (li) {
    var x = +li.dataset.x, y = +li.dataset.y, L = comprimentoMaisPerto(x, y);
    var p = linha.getPointAtLength(L), c = d.createElementNS(NS, 'circle');
    c.setAttribute('class', 'p-ponto'); c.setAttribute('r', '7'); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
    g.appendChild(c);
    return { li: li, L: L, c: c };
  });

  function atualiza(len) {
    linha.style.strokeDashoffset = total - len;
    var p = linha.getPointAtLength(len);
    cabeca.setAttribute('cx', p.x); cabeca.setAttribute('cy', p.y);
    var atual = -1, i;
    for (i = 0; i < est.length; i++) { if (len >= est[i].L - 1) atual = i; }
    est.forEach(function (e, k) {
      e.li.classList.toggle('on', k <= atual);
      e.li.classList.toggle('cur', k === atual);
      e.c.classList.toggle('lit', k < atual);
      e.c.classList.toggle('cur', k === atual);
    });
  }

  if (reduz) {
    atualiza(total);
    est.forEach(function (e) { e.li.classList.add('on'); e.li.classList.remove('cur'); });
    return;
  }

  var pendente = false;
  function calcula() {
    pendente = false;
    var r = sec.getBoundingClientRect(), vh = window.innerHeight;
    var prog = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
    /* começa a desenhar logo no início e termina antes do fim, para a última estação ficar lida */
    var t = Math.min(1, prog / 0.92);
    atualiza(t * total);
  }
  function pede() { if (!pendente) { pendente = true; requestAnimationFrame(calcula); } }
  window.addEventListener('scroll', pede, { passive: true });
  window.addEventListener('resize', pede);
  calcula();
})();
