(function () {
  // Link de pagamento do Mercado Pago. Preencher quando estiver criado.
  var LINK_PAGAMENTO = 'https://mpago.la/2ButjXt';

  var form = document.getElementById('form');
  var erro = document.getElementById('erro');
  var nota = document.getElementById('nota');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = document.getElementById('adulto').checked;
    erro.hidden = ok;
    if (!ok) return;
    if (!LINK_PAGAMENTO) { nota.hidden = false; return; }
    window.location.href = LINK_PAGAMENTO;
  });
})();
