/* Vitton · Modo ON. Motor de rolagem: frasco 3D em sequência de quadros (com mistura entre quadros), seções em profundidade, textos por progresso. */
(function () {
  'use strict';

  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqCelular = window.matchMedia('(max-width: 820px)');
  var toque = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var cel0 = mqCelular.matches;           // define qual conjunto de quadros baixar
  var N = cel0 ? 48 : 90;                 // quadros da volta completa (celular 7,5 graus, computador 4 graus)
  var DIR = cel0 ? 'img/seqm/' : 'img/seq/';
  var GRAUS = 360 / N;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var suave = function (t) { return t * t * (3 - 2 * t); };

  var elFrasco = $('#frasco');
  var elCanvas = $('#frasco-canvas');
  var ctx = elCanvas.getContext('2d');
  var elBarra = $('#barra');
  var elTopo = $('#topo-fixo');

  var sujo = true, ultimoV = -1, tamanhoDefinido = false;

  /* ---------- sequência de quadros ---------- */
  var quadros = new Array(N);
  var prontos = new Array(N);
  function nomeQuadro(i) { return DIR + 'f' + (i < 10 ? '0' : '') + i + '.webp'; }
  function carregar(i, cb) {
    if (quadros[i]) { if (cb) cb(); return; }
    var im = new Image();
    quadros[i] = im;
    var concluido = false;
    var terminar = function (ok) {
      if (concluido) return; concluido = true;
      if (ok) {
        if (!tamanhoDefinido && im.naturalWidth) { elCanvas.width = im.naturalWidth; elCanvas.height = im.naturalHeight; tamanhoDefinido = true; }
        prontos[i] = true; ultimoV = -1; sujo = true;
      }
      if (cb) cb();
    };
    im.onerror = function () { terminar(false); };
    im.src = nomeQuadro(i);
    if (im.decode) im.decode().then(function () { terminar(true); }, function () { terminar(!!(im.complete && im.naturalWidth)); });
    else im.onload = function () { terminar(true); };
  }
  function ordemDeCarga() {
    var a = [], k;
    for (k = 1; k <= N / 2; k++) { a.push(k % N); a.push((N - k) % N); }
    return a.filter(function (v, idx) { return a.indexOf(v) === idx && v !== 0; });
  }
  function carregarTudo() {
    var fila = ordemDeCarga(), ativos = 0;
    function proximo() {
      while (ativos < 4 && fila.length) {
        ativos++;
        carregar(fila.shift(), function () { ativos--; proximo(); });
      }
    }
    proximo();
  }
  carregar(0, function () {
    if (prontos[0]) desenhar(0, true);
    document.body.classList.add('entrou');
    // baixa o resto logo depois da primeira tela, em segundo plano
    var comecar = function () { setTimeout(carregarTudo, 250); };
    if (document.readyState === 'complete') comecar(); else window.addEventListener('load', comecar);
  });

  function vizinhoCarregado(i) {
    for (var d = 0; d < N; d++) {
      var a = (i + d) % N, b = (i - d + N) % N;
      if (prontos[a]) return a;
      if (prontos[b]) return b;
    }
    return 0;
  }
  // v: posição contínua na volta (0 a N). Mistura o quadro de baixo com o de cima para o giro ficar liso.
  function desenhar(v, forcar) {
    v = ((v % N) + N) % N;
    if (!forcar && Math.abs(v - ultimoV) < 0.01) return;
    ultimoV = v;
    var i0 = Math.floor(v), t = v - i0, i1 = (i0 + 1) % N;
    t = clamp((t - .3) / .4, 0, 1);       // mistura só perto do meio entre dois quadros: giro liso sem imagem dupla
    var q0 = prontos[i0] ? i0 : vizinhoCarregado(i0);
    if (!prontos[q0]) return;
    var w = elCanvas.width, h = elCanvas.height;
    elFrasco.classList.add('pronto');
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(quadros[q0], 0, 0, w, h);
    if (t > 0.03 && prontos[i1] && prontos[i0] && i1 !== q0) {
      ctx.globalAlpha = t;
      ctx.drawImage(quadros[i1], 0, 0, w, h);
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
    var tick = function (a) { var p = (a || '0,0,1,1,0').split(',').map(parseFloat); return { x: p[0], y: p[1], s: p[2], o: p[3], r: p[4] / GRAUS }; };
    return {
      el: el, id: el.id, sticky: $('.sticky', el),
      k0d: tick(el.dataset.k0), k1d: tick(el.dataset.k1),
      k0m: tick(el.dataset.m0 || el.dataset.k0), k1m: tick(el.dataset.m1 || el.dataset.k1),
      top: 0, fim: 0
    };
  });
  var pontos = [];
  var vh = window.innerHeight, vw = window.innerWidth, alturaTotal = 1;

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
      pontos.push({ s: s.top, k: cel ? s.k0m : s.k0d, secao: s, dentro: false });
      if (s.fim > s.top) pontos.push({ s: s.fim, k: cel ? s.k1m : s.k1d, secao: s, dentro: true });
    });
    pontos.sort(function (a, b) { return a.s - b.s; });
    alturaTotal = Math.max(1, document.documentElement.scrollHeight - vh);
    sujo = true;
  }
  function alvo(y) {
    var n = pontos.length;
    if (!n) return { x: 0, y: 0, s: 1, o: 1, r: 0 };
    if (y <= pontos[0].s) return pontos[0].k;
    if (y >= pontos[n - 1].s) return pontos[n - 1].k;
    for (var i = 0; i < n - 1; i++) {
      var a = pontos[i], b = pontos[i + 1];
      if (y >= a.s && y <= b.s) {
        var t = b.s === a.s ? 1 : (y - a.s) / (b.s - a.s);
        // dentro da mesma seção a interpolação é linear (giro constante); entre seções é suavizada
        var mesma = b.dentro && b.secao === a.secao;
        var e = mesma ? t : suave(t);
        return { x: lerp(a.k.x, b.k.x, e), y: lerp(a.k.y, b.k.y, e), s: lerp(a.k.s, b.k.s, e), o: lerp(a.k.o, b.k.o, e), r: lerp(a.k.r, b.k.r, e) };
      }
    }
    return pontos[n - 1].k;
  }

  var atual = { x: 22, y: 2, s: 1, o: 0, r: 0 };
  var primeiro = true;

  function aplicarFrasco(y, k) {
    var a = alvo(y);
    if (reduzido) a = { x: a.x, y: a.y, s: a.s, o: a.o, r: 0 };
    if (primeiro || reduzido) k = 1;
    var dist = Math.abs(a.x - atual.x) + Math.abs(a.y - atual.y) + Math.abs(a.s - atual.s) * 10 + Math.abs(a.o - atual.o) * 10 + Math.abs(a.r - atual.r);
    if (dist < 0.004) k = 1;
    atual.x = lerp(atual.x, a.x, k); atual.y = lerp(atual.y, a.y, k);
    atual.s = lerp(atual.s, a.s, k); atual.o = lerp(atual.o, a.o, k);
    var oVis = suave(clamp((atual.o - .75) / .25, 0, 1));
    atual.r = lerp(atual.r, a.r, k);
    primeiro = false;
    elFrasco.style.transform = 'translate(-50%,-50%) translate3d(' + (atual.x * vw / 100).toFixed(1) + 'px,' + (atual.y * vh / 100).toFixed(1) + 'px,0) scale(' + atual.s.toFixed(4) + ')';
    elFrasco.style.opacity = oVis.toFixed(3);
    var emMovimento = dist >= 0.004;
    desenhar(emMovimento ? atual.r : Math.round(atual.r));   // parado: mostra o quadro nítido, sem mistura
    return emMovimento;
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

  var elIlhaFoto = $('#ilha-foto'), elIlhaImg = $('#ilha-foto img'), elDiscImg = $('#disc-foto img');
  var elHeroTxt = $('.hero-txt'), elHeroRodape = $('.hero-rodape'), elRolar = $('.rolar'), elIlhaTxt = $('.ilha-txt'), elCidadeTxt = $('.cidade-txt');
  var planos = $$('.plano');

  function efeitos(y) {
    var h = porId.inicio, an = porId.anatomia, il = porId.ilha, ci = porId.cidade, di = porId.disciplina;
    var p, cel = mqCelular.matches;

    if (visivel(h, y)) {
      p = progresso(h, y);
      var tx = elHeroTxt;
      var ot = 1 - clamp((p - .18) / .4, 0, 1);
      tx.style.opacity = ot.toFixed(3);
      tx.style.visibility = ot < .05 ? 'hidden' : '';
      elHeroRodape.style.opacity = ot.toFixed(3);
      if (!cel) tx.style.translate = '0 ' + (-p * 12).toFixed(2) + 'vh';
      elRolar.style.opacity = (1 - clamp(p * 6, 0, 1)).toFixed(2);
    }
    if (visivel(an, y)) {
      p = progresso(an, y);
      var n = clamp(Math.floor((p - .05) / .225), -1, 3);
      if (p < .03 || p > .985) n = -1;
      passos.forEach(function (li, i) { li.classList.toggle('on', i === n); });
      var li = passos[n];
      elFrasco.dataset.hot = li ? li.dataset.hot : '';
    } else if (elFrasco.dataset.hot) { elFrasco.dataset.hot = ''; passos.forEach(function (li) { li.classList.remove('on'); }); }

    if (visivel(il, y)) {
      p = progresso(il, y);
      var r = 34 + suave(clamp(p / .5, 0, 1)) * 60;
      elIlhaFoto.style.setProperty('--r', r.toFixed(1) + '%');
      if (!cel) elIlhaImg.style.translate = '0 ' + ((p - .5) * -6).toFixed(2) + '%';
      var tt = elIlhaTxt;
      var o = clamp((p - .1) / .2, 0, 1);
      tt.style.opacity = o.toFixed(3);
    }
    if (visivel(ci, y) && !cel && !toque) {
      p = progresso(ci, y);
      planos.forEach(function (pl) {
        var prof = parseFloat(pl.dataset.prof);
        var ry = mouse.cx * 5 * (prof > 0 ? 1 : .5), rx = -mouse.cy * 3;
        pl.style.transform = 'translate3d(0,' + ((p - .5) * prof * 26).toFixed(2) + 'vh,0) rotateY(' + (ry + (prof > 0 ? -6 : 0)).toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg)';
      });
    }
    if (visivel(ci, y)) {
      p = progresso(ci, y);
      var ct = elCidadeTxt;
      ct.style.opacity = clamp((p - .05) / .18, 0, 1).toFixed(3);
    }
    if (visivel(di, y)) {
      p = progresso(di, y);
      var total = palavras.length, ativas = Math.floor(clamp((p - .1) / .68, 0, 1) * (total + .999));
      for (var i = 0; i < total; i++) { var on = i < ativas; if (palavras[i]._on !== on) { palavras[i]._on = on; palavras[i].classList.toggle('on', on); } }
      if (!cel) elDiscImg.style.translate = '0 ' + ((p - .5) * -6).toFixed(2) + '%';
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
  function atualizarChrome(y) {
    elBarra.style.transform = 'scaleX(' + clamp(y / alturaTotal, 0, 1).toFixed(4) + ')';
    elTopo.classList.toggle('cheio', y > 40);
    var meio = y + vh * .5, ativo = null;
    dots.forEach(function (d) { if (meio >= d.s.top && meio < d.s.fim + vh) ativo = d; });
    dots.forEach(function (d) {
      var on = d === ativo;
      d.a.classList.toggle('on', on);
      if (on) d.a.setAttribute('aria-current', 'true'); else d.a.removeAttribute('aria-current');
    });
  }

  /* ---------- rolagem suave (só computador com mouse) e âncoras ---------- */
  var lenis = null;
  if (!reduzido && !toque && typeof Lenis === 'function') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95 });
  }
  function posicaoDe(id) {
    var s = porId[id];
    if (!s) return null;
    if (id === 'inicio') return 0;
    var d = s.fim - s.top;
    var f = { comprar: .5, anatomia: .1, ilha: .55, cidade: .4, disciplina: .7, frase: .1 }[id];
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

  /* ---------- mouse: cursor, botão magnético, brilho da placa, inclinação ---------- */
  var cursor = $('#cursor');
  var cxy = { x: -100, y: -100, tx: -100, ty: -100 };
  var laje = $('.laje');
  if (!toque) {
    window.addEventListener('pointermove', function (e) {
      sujo = true;
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.cx = (e.clientX / vw - .5) * 2; mouse.cy = (e.clientY / vh - .5) * 2;
      cxy.tx = e.clientX; cxy.ty = e.clientY;
      cursor.classList.add('on');
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { cursor.classList.remove('on'); });
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

  /* ---------- laço principal ---------- */
  var yAnterior = -1, movendo = true, tAnterior = 0;
  function quadro(t) {
    requestAnimationFrame(quadro);   // agenda primeiro: um erro isolado não pode parar a página
    var dt = tAnterior ? Math.min(.05, (t - tAnterior) / 1000) : .016;
    tAnterior = t;
    if (lenis) lenis.raf(t);
    var y = lenis ? lenis.scroll : window.pageYOffset;
    // só trabalha quando algo mudou (rolagem, frasco em movimento ou mouse): o resto do tempo a página fica parada
    if (y !== yAnterior || movendo || sujo) {
      yAnterior = y;
      // suavização pelo tempo (igual em tela de 60 ou 120 Hz): o frasco acompanha a rolagem sem trancos
      movendo = aplicarFrasco(y, 1 - Math.exp(-dt * 11));
      efeitos(y);
      atualizarChrome(y);
      if (!toque && laje) {
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
  var larguraAnterior = window.innerWidth;
  window.addEventListener('resize', function () {
    if (toque && window.innerWidth === larguraAnterior) return;   // celular: a barra de endereço mexe só na altura
    larguraAnterior = window.innerWidth;
    clearTimeout(tmr); tmr = setTimeout(function () { medir(); }, 120);
  });
  medir();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
  window.addEventListener('load', medir);
  aplicarFrasco(window.pageYOffset, 1);
  requestAnimationFrame(quadro);
})();
