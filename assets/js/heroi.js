/* Herói: a máscara (canvas) se abre por onde o cursor/dedo passa e se fecha devagar.
   Camada de baixo = <img> do rosto; camada de cima = canvas com a máscara desenhada em "cover". */
(() => {
  document.documentElement.classList.add('js'); // reforço: o <head> já adiciona antes do primeiro desenho

  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navegação sólida ao rolar ---------- */
  const nav = document.querySelector('[data-nav]');
  const onScroll = () => nav && nav.classList.toggle('is-solida', scrollY > 50);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  montarFaixas(); // independe do herói

  /* ---------- Herói ---------- */
  const heroi = document.querySelector('[data-heroi]');
  const canvas = heroi && heroi.querySelector('[data-mascara]');
  if (!heroi || !canvas) return;
  const ctx = canvas.getContext('2d');

  // "furos" acumulados: canvas fora da tela, em resolução reduzida (mais leve)
  const furos = document.createElement('canvas');
  const fctx = furos.getContext('2d');
  const ESCALA_FURO = 0.5;

  const mascara = new Image();
  mascara.decoding = 'async';
  mascara.src = (() => { const px = innerWidth * Math.min(devicePixelRatio || 1, 2); return canvas.getAttribute(px > 1700 ? 'data-src-2560' : px > 950 ? 'data-src-1600' : 'data-src-900'); })();

  let W = 0, H = 0, dpr = 1, raio = 90;
  let alvo = null, pos = null, ultimo = null;
  let ultimaPincelada = 0, rodando = false, visivel = true;

  function medir() {
    const r = heroi.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.round(r.width); H = Math.round(r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    furos.width = Math.max(1, Math.round(W * ESCALA_FURO)); furos.height = Math.max(1, Math.round(H * ESCALA_FURO));
    raio = Math.max(60, Math.min(120, W * 0.065));
    desenhar();
  }

  // mesma conta do CSS object-fit: cover + object-position (50% 30% no desktop, 50% 20% no celular)
  function capa() {
    const iw = mascara.naturalWidth, ih = mascara.naturalHeight;
    const s = Math.max(W / iw, H / ih);
    const dw = iw * s, dh = ih * s;
    const py = innerWidth <= 760 ? 0.2 : 0.3;
    return [(W - dw) * 0.5, (H - dh) * py, dw, dh];
  }

  function desenhar() {
    if (!mascara.complete || !mascara.naturalWidth || !W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    const [x, y, w, h] = capa();
    ctx.drawImage(mascara, x, y, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(furos, 0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  function pincel(x, y) {
    const fx = x * ESCALA_FURO, fy = y * ESCALA_FURO, fr = raio * ESCALA_FURO;
    const g = fctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
    g.addColorStop(0, 'rgba(0,0,0,.55)');
    g.addColorStop(0.55, 'rgba(0,0,0,.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    fctx.fillStyle = g;
    fctx.beginPath(); fctx.arc(fx, fy, fr, 0, Math.PI * 2); fctx.fill();
  }

  function pincelada(a, b) {
    // carimba ao longo do caminho para não deixar buracos em movimentos rápidos
    const dx = b.x - a.x, dy = b.y - a.y;
    const passos = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (raio * 0.25)));
    for (let i = 1; i <= passos; i++) pincel(a.x + dx * i / passos, a.y + dy * i / passos);
  }

  function quadro(t) {
    rodando = false;
    if (!visivel) return;
    if (alvo) {
      if (!pos) pos = { ...alvo };
      pos.x += (alvo.x - pos.x) * 0.28; pos.y += (alvo.y - pos.y) * 0.28;
      if (ultimo) pincelada(ultimo, pos);
      ultimo = { ...pos };
    }
    // a máscara "cicatriza" devagar (some ~2 s depois de parar)
    fctx.globalCompositeOperation = 'destination-out';
    fctx.fillStyle = 'rgba(0,0,0,.035)';
    fctx.fillRect(0, 0, furos.width, furos.height);
    fctx.globalCompositeOperation = 'source-over';
    desenhar();
    const ocioso = t - ultimaPincelada > 3200 && !heroi.classList.contains('is-ativo');
    if (!ocioso) agenda();
    else { fctx.clearRect(0, 0, furos.width, furos.height); desenhar(); }
  }
  function agenda() { if (!rodando) { rodando = true; requestAnimationFrame(quadro); } }

  function mover(e) {
    const r = heroi.getBoundingClientRect();
    alvo = { x: e.clientX - r.left, y: e.clientY - r.top };
    ultimaPincelada = performance.now();
    heroi.classList.add('is-ativo', 'is-tocado');
    agenda();
  }
  function sair() { heroi.classList.remove('is-ativo'); alvo = null; ultimo = null; pos = null; agenda(); }

  heroi.addEventListener('pointermove', mover, { passive: true });
  heroi.addEventListener('pointerdown', mover, { passive: true });
  heroi.addEventListener('pointerleave', sair);
  heroi.addEventListener('pointercancel', sair);

  // só trabalha quando o herói está na tela
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visivel = en.isIntersecting; if (visivel) agenda(); }).observe(heroi);

  let espera;
  addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(medir, 120); });

  // primeira visita: a revelação faz sozinha um arco sobre os olhos
  function arcoAutomatico() {
    if (reduz) return;
    const [x, y, w, h] = capa();
    const cx = x + w * 0.557, cy = y + h * 0.39; // centro dos olhos na imagem
    const amp = w * 0.07, inicio = performance.now(), dur = 1800;
    heroi.classList.add('is-ativo');
    (function passo(agora) {
      if (heroi.classList.contains('is-tocado')) return;
      const k = Math.min(1, (agora - inicio) / dur);
      const ang = Math.PI + k * Math.PI;
      alvo = { x: cx + Math.cos(ang) * amp, y: cy + Math.sin(ang) * amp * 0.35 + amp * 0.1 };
      ultimaPincelada = agora;
      agenda();
      if (k < 1) requestAnimationFrame(passo);
      else { heroi.classList.remove('is-ativo'); alvo = null; ultimo = null; pos = null; }
    })(inicio);
  }

  let iniciou = false; // o load pode chegar duas vezes (cache + disparo manual)
  function iniciar() {
    if (iniciou) return;
    iniciou = true;
    medir();
    heroi.classList.add('is-pronto');
    setTimeout(arcoAutomatico, 1300);
  }
  mascara.addEventListener('load', iniciar);
  if (mascara.complete && mascara.naturalWidth) iniciar();
  else heroi.classList.add('is-pronto');

  /* ---------- Faixas cruzadas ---------- */
  function montarFaixas() {
    const itens = ['Sites institucionais', 'High-conversion Sales Pages', 'Sistemas sob medida', 'Agentes de IA', 'CRM personalizado', 'Automações', 'Aplicativos', 'Infraestrutura e deploy'];
    const sep = '<svg class="faixa__sep" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c4 0 7 3.2 7 7.4 0 3-1.4 5.3-3 6.9-.6.6-1.6.6-2.2 0l-.8-.9-.8.9c-.6.6-1.6.6-2.2 0-1.6-1.6-3-3.9-3-6.9C5 5.2 8 2 12 2zm-3 6.5c-.8 0-1.4.6-1.4 1.3S8.2 11 9 11s1.6-.5 1.6-1.2S9.9 8.5 9 8.5zm6 0c-.9 0-1.6.6-1.6 1.3S14.1 11 15 11s1.4-.5 1.4-1.2-.6-1.3-1.4-1.3zM10 19h4v3h-4z"/></svg>';
    const bloco = itens.map((t) => `<span class="faixa__item">${t}${sep}</span>`).join('');
    document.querySelectorAll('[data-trilho]').forEach((tr) => {
      tr.innerHTML = bloco + bloco; // duas cópias para o laço sem emenda
      if (reduz) return;
      const dir = Number(tr.dataset.trilho);
      let x = dir > 0 ? 0 : -0.5, vel = 1, ativo = true, laco = false;
      const base = dir > 0 ? 1 / 18000 : 1 / 22000; // fração da largura por ms
      const faixas = tr.closest('[data-faixas]');
      faixas.addEventListener('pointerenter', () => { vel = 0.15; });
      faixas.addEventListener('pointerleave', () => { vel = 1; });
      let antes = performance.now();
      if (!('IntersectionObserver' in window)) { laco = true; requestAnimationFrame(anda); return; }
      new IntersectionObserver(([en]) => { ativo = en.isIntersecting; if (ativo && !laco) { laco = true; antes = performance.now(); requestAnimationFrame(anda); } }).observe(faixas);
      function anda(agora) {
        const dt = Math.min(64, agora - antes); antes = agora;
        x -= dir * base * dt * vel;
        if (x <= -0.5) x += 0.5; if (x > 0) x -= 0.5;
        tr.style.transform = `translate3d(${x * 100}%,0,0)`;
        if (ativo) requestAnimationFrame(anda); else laco = false;
      }
    });
  }
})();
