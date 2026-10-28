(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var STORES = {
    barreiro: { nome: 'Barreiro', fone: '553133842277' },
    buritis: { nome: 'Buritis', fone: '553121182343' }
  };

  var USOS = {
    gamer: {
      cor: '#b65cff', img: 'img/pc-roxo.webp', alt: 'PC gamer com iluminação roxa e azul',
      titulo: 'PC Gamer',
      texto: 'PCs gamer sob medida, com desempenho e suporte especializado. Você monta o seu setup ideal com quem entende, sem erro na escolha.',
      itens: ['Montagem profissional e segura', 'Configuração certa para o seu objetivo', 'Upgrade facilitado com recompra garantida'],
      msg: 'Olá! Quero montar um PC Gamer.'
    },
    notebook: {
      cor: '#6ea8ff', img: 'img/notebook.webp', alt: 'Atendente da Narigation segurando um notebook',
      titulo: 'Notebooks',
      texto: 'Venda e configuração de equipamentos ideais para o seu uso, sem erro na escolha.',
      itens: ['Notebooks novos e seminovos com garantia', 'Atendimento consultivo antes da compra', 'Conserto, manutenção e upgrade'],
      msg: 'Olá! Quero ajuda para escolher um notebook.'
    },
    workstation: {
      cor: '#2fe6e0', img: 'img/pc-ciano.webp', alt: 'PC com iluminação ciano e placa de vídeo GeForce RTX',
      titulo: 'Workstation',
      texto: 'Workstations de alto desempenho para arquitetura, engenharia e projetos exigentes, com estabilidade e confiabilidade.',
      itens: ['Alto desempenho para projetos exigentes', 'Estabilidade e confiabilidade', 'Suporte profissional'],
      msg: 'Olá! Quero saber sobre uma workstation.'
    },
    trabalho: {
      cor: '#ffc43d', img: 'img/pc-amarelo.webp', alt: 'PC com gabinete preto e iluminação amarela',
      titulo: 'Computador para trabalho',
      texto: 'Computadores para trabalho com desempenho, confiabilidade e suporte profissional.',
      itens: ['Desempenho para o dia a dia', 'Confiabilidade', 'Suporte profissional'],
      msg: 'Olá! Preciso de um computador para trabalho.'
    },
    empresa: {
      cor: '#36e04f', img: 'img/atendimento-balcao.webp', alt: 'Atendimento no balcão da loja Narigation',
      titulo: 'Soluções para empresas',
      texto: 'Estrutura em tecnologia com suporte e equipamentos sob medida para a sua operação.',
      itens: ['Equipamentos sob medida', 'Suporte para a sua operação', 'Atendimento presencial e suporte online'],
      msg: 'Olá! Quero soluções de tecnologia para a minha empresa.'
    },
    setup: {
      cor: '#ff6b5e', img: 'img/setup-gamer.webp', alt: 'Setup gamer com teclado iluminado e PC com ventoinhas coloridas',
      titulo: 'Setup completo',
      texto: 'Setup completo com computador, mesa e cadeira, combinando desempenho, ergonomia e produtividade em uma solução única.',
      itens: ['Computador, mesa e cadeira', 'Desempenho e ergonomia', 'Produtividade em uma solução única'],
      msg: 'Olá! Quero montar um setup completo.'
    }
  };

  var loja = 'barreiro';
  try {
    var salva = localStorage.getItem('narigation-loja');
    if (salva && STORES[salva]) loja = salva;
  } catch (e) {}

  function waUrl(msg) {
    return 'https://wa.me/' + STORES[loja].fone + '?text=' + encodeURIComponent(msg);
  }

  function aplicarLoja() {
    document.querySelectorAll('[data-wa]').forEach(function (a) {
      a.href = waUrl(a.getAttribute('data-wa'));
    });
    document.querySelectorAll('.store-name').forEach(function (n) { n.textContent = STORES[loja].nome; });
    document.querySelectorAll('.store-btn').forEach(function (b) {
      var on = b.getAttribute('data-store') === loja;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-store-card]').forEach(function (c) {
      c.classList.toggle('is-mine', c.getAttribute('data-store-card') === loja);
    });
  }

  document.querySelectorAll('.store-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      loja = b.getAttribute('data-store');
      try { localStorage.setItem('narigation-loja', loja); } catch (e) {}
      aplicarLoja();
    });
  });
  aplicarLoja();

  /* Seletor de uso: a luz do site muda com a escolha */
  var card = document.getElementById('pick-card');
  var img = document.getElementById('pick-img');
  var titulo = document.getElementById('pick-title');
  var texto = document.getElementById('pick-text');
  var ticks = document.getElementById('pick-ticks');
  var wa = document.getElementById('pick-wa');

  function escolher(k) {
    var u = USOS[k];
    if (!u) return;
    root.style.setProperty('--rgb', u.cor);
    document.querySelectorAll('.opt').forEach(function (o) {
      var on = o.getAttribute('data-k') === k;
      o.classList.toggle('is-on', on);
      o.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    titulo.textContent = u.titulo;
    texto.textContent = u.texto;
    ticks.textContent = '';
    u.itens.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t;
      ticks.appendChild(li);
    });
    wa.setAttribute('data-wa', u.msg);
    wa.href = waUrl(u.msg);
    img.classList.add('swap');
    var pre = new Image();
    var fim = function () {
      img.src = u.img;
      img.alt = u.alt;
      img.classList.remove('swap');
    };
    var t = setTimeout(fim, 1500);
    pre.onload = function () { clearTimeout(t); setTimeout(fim, 180); };
    pre.src = u.img;
    card.classList.remove('fade');
    void card.offsetWidth;
    card.classList.add('fade');
  }

  document.querySelectorAll('.opt').forEach(function (o) {
    o.addEventListener('click', function () { escolher(o.getAttribute('data-k')); });
  });

  /* Inclinação suave da foto principal (só com mouse) */
  var frame = document.getElementById('frame');
  var fino = window.matchMedia('(pointer:fine)').matches;
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (frame && fino && !reduzido) {
    var vis = frame.parentElement;
    vis.addEventListener('pointermove', function (e) {
      var r = vis.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      frame.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
      frame.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
      frame.style.setProperty('--sx', (x * 60).toFixed(1) + '%');
    });
    vis.addEventListener('pointerleave', function () {
      frame.style.setProperty('--ry', '0deg');
      frame.style.setProperty('--rx', '0deg');
      frame.style.setProperty('--sx', '-30%');
    });
  }

  /* Aparecer ao rolar */
  var itens = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    itens.forEach(function (el) { io.observe(el); });
    window.addEventListener('load', function () {
      setTimeout(function () { itens.forEach(function (el) { el.classList.add('in'); }); }, 4000);
    });
  } else {
    itens.forEach(function (el) { el.classList.add('in'); });
  }
})();
