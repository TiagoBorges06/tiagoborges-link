/* Revela as seções ao entrar na tela (uma vez) e numera itens para atrasos em cascata. */
(() => {
  document.querySelectorAll('[data-ano]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  document.querySelectorAll('.pilulas li, .servico, .projeto').forEach((el) => el.style.setProperty('--i', [...el.parentNode.children].indexOf(el)));
  const alvos = document.querySelectorAll('[data-revela]');
  const revelar = (el) => {
    el.classList.add('is-visivel');
    // terminada a entrada em cascata, tira o atraso para o hover responder na hora
    setTimeout(() => el.classList.add('is-assentado'), 2200);
  };
  if (!('IntersectionObserver' in window)) { alvos.forEach(revelar); return; }
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) { revelar(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -20% 0px' });
  alvos.forEach((el) => io.observe(el));
})();
