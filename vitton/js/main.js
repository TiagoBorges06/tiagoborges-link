/* Vitton · Modo ON. Motor de rolagem: frasco 3D em sequência de quadros, seções em profundidade, textos por progresso. */
(function () {
  'use strict';

  var N = 60;                       // quadros da rotação do frasco (6 graus por quadro)
  var FRENTE = 5;                   // quadro de frente (0 grau)
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqCelular = window.matchMedia('(max-width: 820px)');
  var toque = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var suave = function (t) { return t * t * (3 - 2 * t); };

  var elFrasco = $('#frasco');
  var elImg = $('#frasco-img');
  var elCanvas = $('#frasco-canvas');
  var ctx = elCanvas.getContext('2d');
  var elBarra = $('#barra');
  var elTopo = $('#topo-fixo');

  /* ---------- sequência de quadros ---------- */
  var quadros = new Array(N);
  var prontos = new Array(N);
  function carregar(i, cb) {
    if (quadros[i]) { if (cb) cb(); return; }
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () { prontos[i] = true; ultimo = -1; sujo = true; elFrasco.classList.add('pronto'); if (cb) cb(); };
    im.onerror = function () { if (cb) cb(); };
    im.src = 'img/seq/f' + (i < 10 ? '0' : '') + i + '.webp';
    quadros[i] = im;
  }
  function ordemDeCarga() {
    // alterna para os dois lados a partir do quadro de frente
    var a = [], k;
    for (k = 1; k <= N / 2; k++) { a.push((FRENTE + k) % N); a.push((FRENTE - k + N) % N); }
    return a.filter(function (v, idx) { return a.indexOf(v) === idx && v !== FRENTE; });
  }
  function carregarResto() {
    var fila = ordemDeCarga(), ativos = 0;
    function proximo() {
      while (ativos < 4 && fila.length) {
        ativos++;
        carregar(fila.shift(), function () { ativos--; proximo(); });
      }
    }
    proximo();
  }
  carregar(FRENTE, function () {
    if (prontos[FRENTE]) { desenhar(FRENTE, true); elFrasco.classList.add('pronto'); }
    document.body.classList.add('entrou');
    // o restante dos quadros só baixa quando a pessoa começa a interagir (ou depois de 5 s parado), para a primeira tela abrir leve
    var feito = false;
    var iniciar = function () {
      if (feito) return; feito = true;
      ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (ev) { window.removeEventListener(ev, iniciar); });
      carregarResto();
    };
    ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, iniciar, { passive: true, once: true }); });
    var depois = function () { setTimeout(iniciar, 5000); };
    if (document.readyState === 'complete') depois(); else window.addEventListener('load', depois);
  });

  var ultimo = -1;
  function vizinhoCarregado(i) {
    for (var d = 0; d < N; d++) {
      var a = (i + d) % N, b = (i - d + N) % N;
      if (prontos[a]) return a;
      if (prontos[b]) return b;
    }
    return FRENTE;
  }
  function desenhar(r, forcar) {
    var v = ((r % N) + N) % N;
    if (!forcar && Math.abs(v - ultimo) < 0.015) return;
    ultimo = v;
    var i0 = Math.round(v) % N, t = 0, i1 = (i0 + 1) % N;
    var q0 = prontos[i0] ? i0 : vizinhoCarregado(i0);
    if (!prontos[q0]) return;
    ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);
    ctx.globalAlpha = 1;
    ctx.drawImage(quadros[q0], 0, 0, elCanvas.width, elCanvas.height);
    if (t > 0.03 && prontos[i1] && i1 !== q0) {
      ctx.globalAlpha = t;
      ctx.drawImage(quadros[i1], 0, 0, elCanvas.width, elCanvas.height);
      ctx.globalAlpha = 1;
    }
  }

  $$('svg.ic').forEach(function (s) { s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); });

  /* ---------- camada da frente: textos acima do frasco ---------- */
  $$('.s').forEach(function (sec) {
    var st = $('.sticky', sec);
    if (!st) return;
    var itens = $$('.z-front', st);
    if (!itens.length) return;
    var f = document.createElement('div');
    f.className = 'frente';
    itens.forEach(function (n) { f.appendChild(n); });
    st.parentNode.insertBefore(f, st.nextSibling);
  });

  /* ---------- seções e chaves do frasco ---------- */
  var secoes = $$('.s[data-k0]').map(function (el) {
    var tick = function (a) { var p = (a || '0,0,1,1,0').split(',').map(parseFloat); return { x: p[0], y: p[1], s: p[2], o: p[3], r: FRENTE + p[4] / (360 / N) }; };
    return {
      el: el, id: el.id, sticky: $('.sticky', el),
      k0d: tick(el.dataset.k0), k1d: tick(el.dataset.k1),
      k0m: tick(el.dataset.m0 || el.dataset.k0), k1m: tick(el.dataset.m1 || el.dataset.k1),
      top: 0, fim: 0, sp: 0
    };
  });
  var pontos = [];
  var vh = window.innerHeight, vw = window.innerWidth;

  function medir() {
    vh = window.innerHeight; vw = window.innerWidth;
    var cel = mqCelular.matches;
    var y = window.pageYOffset;
    pontos = [];
    secoes.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      var alt = s.sticky ? s.sticky.offsetHeight : 0;
      s.top = r.top + y;
      s.fim = s.sticky ? s.top + r.height - alt : s.top;
      pontos.push({ s: s.top, k: cel ? s.k0m : s.k0d });
      if (s.fim > s.top) pontos.push({ s: s.fim, k: cel ? s.k1m : s.k1d });
    });
    pontos.sort(function (a, b) { return a.s - b.s; });
    alturaTotal = Math.max(1, document.documentElement.scrollHeight - vh);
    sujo = true;
  }
  function alvo(y) {
    var n = pontos.length;
    if (!n) return { x: 0, y: 0, s: 1, o: 1, r: FRENTE };
    if (y <= pontos[0].s) return pontos[0].k;
    if (y >= pontos[n - 1].s) return pontos[n - 1].k;
    for (var i = 0; i < n - 1; i++) {
      var a = pontos[i], b = pontos[i + 1];
      if (y >= a.s && y <= b.s) {
        var t = b.s === a.s ? 1 : (y - a.s) / (b.s - a.s);
        // dentro da mesma seção a interpolação é linear, entre seções é suavizada
        var mesma = secoes.some(function (s) { return s.fim === b.s && s.top === a.s; });
        var e = mesma ? t : suave(t);
        return { x: lerp(a.k.x, b.k.x, e), y: lerp(a.k.y, b.k.y, e), s: lerp(a.k.s, b.k.s, e), o: lerp(a.k.o, b.k.o, e), r: lerp(a.k.r, b.k.r, e) };
      }
    }
    return pontos[n - 1].k;
  }

  var atual = { x: 14, y: 4, s: 1, o: 0, r: FRENTE };
  var primeiro = true;

  function aplicarFrasco(y, ir) {
    var a = alvo(y);
    if (reduzido) a = { x: a.x, y: a.y, s: a.s, o: a.o, r: FRENTE };
    var k = primeiro || reduzido ? 1 : ir;
    var dist = Math.abs(a.x - atual.x) + Math.abs(a.y - atual.y) + Math.abs(a.s - atual.s) * 10 + Math.abs(a.o - atual.o) * 10 + Math.abs(a.r - atual.r);
    if (dist < 0.004) { k = 1; }
    atual.x = lerp(atual.x, a.x, k); atual.y = lerp(atual.y, a.y, k);
    atual.s = lerp(atual.s, a.s, k); atual.o = lerp(atual.o, a.o, k);
    atual.r = lerp(atual.r, a.r, k);
    primeiro = false;
    elFrasco.style.transform = 'translate(-50%,-50%) translate3d(' + (atual.x * vw / 100).toFixed(1) + 'px,' + (atual.y * vh / 100).toFixed(1) + 'px,0) scale(' + atual.s.toFixed(4) + ')';
    elFrasco.style.opacity = atual.o.toFixed(3);
    desenhar(atual.r);
    return dist >= 0.004;
  }

  /* ---------- efeitos por seção ---------- */
  var mouse = { x: 0, y: 0, cx: 0, cy: 0 };
  var passos = $$('#passos li');
  var palavras = [];
  $$('[data-palavras]').forEach(function (el) {
    var txt = el.textContent.trim();
    el.textContent = '';
    txt.split(/\s+/).forEach(function (w) {
      var sp = document.createElement('span'); sp.className = 'w'; sp.textContent = w;
      el.appendChild(sp); palavras.push(sp);
    });
  });
  var porId = {};
  secoes.forEach(function (s) { porId[s.id] = s; });

  function progresso(s, y) {
    var d = s.fim - s.top;
    return d > 0 ? clamp((y - s.top) / d, 0, 1) : 0;
  }
  function visivel(s, y) { return y > s.top - vh * 1.1 && y < s.fim + vh * 1.1; }

  function efeitos(y) {
    var h = porId.inicio, l = porId.frase, an = porId.anatomia, il = porId.ilha, ci = porId.cidade, di = porId.disciplina, co = porId.comprar;
    var p, el;

    if (visivel(h, y)) {
      p = progresso(h, y);
      var tx = $('.hero-txt', h.el);
      var ot = 1 - clamp((p - .18) / .4, 0, 1);
      tx.style.opacity = ot.toFixed(3);
      tx.style.visibility = ot < .05 ? 'hidden' : '';
      tx.style.translate = '0 ' + (-p * 12).toFixed(2) + 'vh';
      $('.laje', h.el).style.setProperty('--py', (p * -9).toFixed(2) + 'vh');
      $('.lobo-marca', h.el).style.setProperty('--py', (p * 14).toFixed(2) + 'vh');
      $('.rolar', h.el).style.opacity = (1 - clamp(p * 6, 0, 1)).toFixed(2);
    }
    if (visivel(l, y)) {
      p = progresso(l, y);
      $$('.lema-l', l.el).forEach(function (n) { n.style.translate = (parseFloat(n.dataset.dir) * (p - .5) * 12).toFixed(2) + 'vw 0'; });
      $('.lema-fundo', l.el).style.translate = '0 ' + ((p - .5) * 10).toFixed(2) + 'vh';
    }
    if (visivel(an, y)) {
      p = progresso(an, y);
      var n = clamp(Math.floor((p - .06) / .22), -1, 3);
      if (p < .04 || p > .985) n = -1;
      passos.forEach(function (li, i) { li.classList.toggle('on', i === n); });
      var li = passos[n];
      elFrasco.dataset.hot = li ? li.dataset.hot : '';
    } else if (elFrasco.dataset.hot) { elFrasco.dataset.hot = ''; passos.forEach(function (li) { li.classList.remove('on'); }); }

    if (visivel(il, y)) {
      p = progresso(il, y);
      var r = 6 + suave(clamp(p / .55, 0, 1)) * 76;
      $('#ilha-foto').style.setProperty('--r', r.toFixed(1) + '%');
      var img = $('#ilha-foto img'); img.style.translate = '0 ' + ((p - .5) * -8).toFixed(2) + '%';
      var tt = $('.ilha-txt', il.el);
      var o = clamp((p - .22) / .22, 0, 1);
      tt.style.opacity = o.toFixed(3);
      tt.style.translate = '0 ' + ((1 - o) * 5).toFixed(2) + 'vh';
    }
    if (visivel(ci, y)) {
      p = progresso(ci, y);
      $$('.plano', ci.el).forEach(function (pl) {
        var prof = parseFloat(pl.dataset.prof);
        var ry = toque ? 0 : mouse.cx * 6 * (prof > 0 ? 1 : .5), rx = toque ? 0 : -mouse.cy * 4;
        pl.style.transform = 'translate3d(0,' + ((p - .5) * prof * 34).toFixed(2) + 'vh,0) rotateY(' + (ry + (prof > 0 ? -9 : 0)).toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg)';
      });
      var ct = $('.cidade-txt', ci.el);
      var oc = clamp((p - .08) / .2, 0, 1);
      ct.style.opacity = oc.toFixed(3); ct.style.translate = '0 ' + ((1 - oc) * 4).toFixed(2) + 'vh';
    }
    if (visivel(di, y)) {
      p = progresso(di, y);
      var total = palavras.length, ativas = Math.floor(clamp((p - .1) / .68, 0, 1) * (total + .999));
      for (var i = 0; i < total; i++) { var on = i < ativas; if (palavras[i]._on !== on) { palavras[i]._on = on; palavras[i].classList.toggle('on', on); } }
      $('#disc-foto img').style.translate = '0 ' + ((p - .5) * -8).toFixed(2) + '%';
    }
  }

  /* ---------- barra, topo, pontos ---------- */
  var dots = [];
  var nomes = { inicio: 'Início', frase: 'Momento', anatomia: 'O frasco', ilha: 'Confiança', cidade: 'Rotina', disciplina: 'Disciplina', comprar: 'Comprar' };
  var navPontos = $('#pontos');
  secoes.forEach(function (s) {
    if (!nomes[s.id]) return;
    var a = document.createElement('a');
    a.href = '#' + s.id; a.setAttribute('aria-label', nomes[s.id]);
    var t = document.createElement('span'); t.textContent = nomes[s.id]; a.appendChild(t);
    navPontos.appendChild(a); dots.push({ a: a, s: s });
  });
  var alturaTotal = 1;
  function atualizarChrome(y) {
    var total = alturaTotal;
    elBarra.style.transform = 'scaleX(' + clamp(y / total, 0, 1).toFixed(4) + ')';
    elTopo.classList.toggle('cheio', y > 40);
    var meio = y + vh * .5, ativo = null;
    dots.forEach(function (d) { if (meio >= d.s.top && meio < d.s.fim + vh) ativo = d; });
    dots.forEach(function (d) {
      var on = d === ativo;
      d.a.classList.toggle('on', on);
      if (on) d.a.setAttribute('aria-current', 'true'); else d.a.removeAttribute('aria-current');
    });
  }

  /* ---------- rolagem suave e âncoras ---------- */
  var lenis = null;
  if (!reduzido && typeof Lenis === 'function') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95 });
  }
  function posicaoDe(id) {
    var s = porId[id];
    if (!s) return null;
    if (id === 'inicio') return 0;
    var d = s.fim - s.top;
    var f = { comprar: .6, anatomia: .1, ilha: .55, cidade: .4, disciplina: .7, frase: .5 }[id];
    return s.top + d * (f === undefined ? .22 : f);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var pos = posicaoDe(id);
      if (pos === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(pos, { duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
      else window.scrollTo({ top: pos, behavior: reduzido ? 'auto' : 'smooth' });
    });
  });

  /* ---------- mouse: inclinação, cursor, botão magnético, brilho da placa ---------- */
  var cursor = $('#cursor');
  var cxy = { x: -100, y: -100, tx: -100, ty: -100 };
  if (!toque) {
    window.addEventListener('pointermove', function (e) {
      sujo = true;
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.cx = (e.clientX / vw - .5) * 2; mouse.cy = (e.clientY / vh - .5) * 2;
      cxy.tx = e.clientX; cxy.ty = e.clientY;
      cursor.classList.add('on');
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.classList.remove('on'); });
    $$('a, button, [data-magnetico]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cursor.classList.add('hover'); });
      el.addEventListener('pointerleave', function () { cursor.classList.remove('hover'); el.style.translate = ''; });
    });
    $$('[data-magnetico]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.translate = ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px';
      });
    });
    var placa = $('#placa');
    placa.addEventListener('pointermove', function (e) {
      var r = placa.getBoundingClientRect();
      placa.style.setProperty('--mx', (e.clientX - r.left) + 'px'); placa.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }
  var laje = $('.laje');

  /* ---------- laço principal ---------- */
  var yLenis = -1, movendo = true, sujo = true;
  function quadro(t) {
    requestAnimationFrame(quadro);   // agenda primeiro: um erro isolado não pode parar a página
    if (lenis) lenis.raf(t);
    var y = lenis ? lenis.scroll : window.pageYOffset;
    // só trabalha quando algo mudou (rolagem, frasco em movimento ou mouse): o resto do tempo a página fica parada
    if (y !== yLenis || movendo || sujo) {
      yLenis = y;
      movendo = aplicarFrasco(y, 0.16);
      efeitos(y);
      atualizarChrome(y);
      if (!toque && sujo) {
        laje.style.setProperty('--ry', (-9 + mouse.cx * 5).toFixed(2) + 'deg');
        laje.style.setProperty('--rx', (-mouse.cy * 3).toFixed(2) + 'deg');
      }
      sujo = false;
    }
    if (!toque && (Math.abs(cxy.x - cxy.tx) > .2 || Math.abs(cxy.y - cxy.ty) > .2)) {
      cxy.x = lerp(cxy.x, cxy.tx, .2); cxy.y = lerp(cxy.y, cxy.ty, .2);
      cursor.style.transform = 'translate3d(' + cxy.x.toFixed(1) + 'px,' + cxy.y.toFixed(1) + 'px,0)';
    }
  }

  var tmr;
  window.addEventListener('resize', function () { clearTimeout(tmr); tmr = setTimeout(function () { medir(); }, 120); });
  medir();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
  window.addEventListener('load', medir);
  aplicarFrasco(window.pageYOffset, 1);
  requestAnimationFrame(quadro);
})();
