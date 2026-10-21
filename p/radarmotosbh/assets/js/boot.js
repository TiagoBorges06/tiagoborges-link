document.documentElement.className += ' js';
// rede de segurança: se o script principal não carregar, nada fica escondido
setTimeout(function () { if (!window.__radarOk) document.documentElement.className += ' rv-all'; }, 4000);
