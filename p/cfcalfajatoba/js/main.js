(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Depois da entrada, libera a placa para a inclinação 3D */
  [].slice.call(document.querySelectorAll(".hero__in")).forEach(function (el) {
    el.addEventListener("animationend", function () { el.classList.add("done"); });
  });

  /* Revelar ao rolar: só esconde o que está abaixo da primeira tela */
  var reveals = [].slice.call(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var t = e.target;
          t.classList.add("in");
          io.unobserve(t);
          window.setTimeout(function () {
            t.classList.remove("rv");
            if (!t.classList.contains("shifter")) { t.classList.remove("in"); }
          }, 1300);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    var limit = window.innerHeight * 0.92;
    var tops = reveals.map(function (el) { return el.getBoundingClientRect().top; });
    reveals.forEach(function (el, i) {
      if (tops[i] > limit) {
        el.classList.add("rv");
        io.observe(el);
      } else {
        el.classList.add("in");
      }
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* Câmbio: a alavanca engata o D ao entrar na tela */
  var shifter = document.querySelector(".shifter");
  if (shifter) {
    if ("IntersectionObserver" in window) {
      var so = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { shifter.classList.add("in"); so.disconnect(); }
      }, { threshold: 0.5 });
      so.observe(shifter);
    } else {
      shifter.classList.add("in");
    }
  }

  /* Rolagem: topo com fundo, carro na pista, rota que se desenha */
  var top = document.querySelector(".top");
  var route = document.querySelector(".route__path");
  var endSec = document.getElementById("onde");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    var prog = null;
    if (route && endSec) {
      var r = endSec.getBoundingClientRect();
      prog = (window.innerHeight * 0.85 - r.top) / (r.height * 0.9);
    }
    root.style.setProperty("--p", Math.min(1, Math.max(0, y / max)).toFixed(4));
    if (top) { top.classList.toggle("is-scrolled", y > 40); }
    if (prog !== null) {
      route.style.strokeDashoffset = String(1 - Math.min(1, Math.max(0, prog)));
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.requestAnimationFrame(onScroll);

  /* Inclinação 3D suave nas placas (só com mouse) */
  if (fine && !reduce) {
    [].slice.call(document.querySelectorAll(".tilt")).forEach(function (el) {
      var raf = 0;
      el.addEventListener("pointermove", function (ev) {
        var b = el.getBoundingClientRect();
        var x = (ev.clientX - b.left) / b.width - 0.5;
        var yv = (ev.clientY - b.top) / b.height - 0.5;
        if (raf) { return; }
        raf = window.requestAnimationFrame(function () {
          el.style.transform = "perspective(800px) rotateX(" + (-yv * 7).toFixed(2) + "deg) rotateY(" + (x * 9).toFixed(2) + "deg) translateZ(0)";
          raf = 0;
        });
      });
      el.addEventListener("pointerleave", function () {
        if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
        el.style.transform = "";
      });
    });
  }

  /* Aberto agora, no horário de Brasília (atualiza a cada minuto) */
  var status = document.getElementById("status");
  var txt = document.getElementById("status-txt");
  function atualizarHorario() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var d = dias[map.weekday];
    var mins = (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10);
    var open = false;
    if (d >= 1 && d <= 5) { open = mins >= 7 * 60 && mins < 20 * 60; }
    else if (d === 6) { open = mins >= 8 * 60 && mins < 12 * 60; }
    var novo = open ? "Aberto agora" : "Fechado agora";
    if (txt.textContent !== novo) {
      status.classList.remove("is-open", "is-closed");
      status.classList.add(open ? "is-open" : "is-closed");
      txt.textContent = novo;
    }
    [].slice.call(document.querySelectorAll("[data-dia]")).forEach(function (tr) {
      tr.classList.toggle("is-today", tr.getAttribute("data-dia").split(",").indexOf(String(d)) > -1);
    });
  }
  if (status && txt && window.Intl && Intl.DateTimeFormat) {
    try {
      atualizarHorario();
      window.setInterval(function () { try { atualizarHorario(); } catch (err) { /* mantém o último estado */ } }, 60000);
    } catch (err) { /* mantém o texto padrão */ }
  }

  /* Botão para pausar os movimentos contínuos */
  var pauseBtn = document.querySelector(".pause");
  if (pauseBtn) {
    pauseBtn.addEventListener("click", function () {
      var on = root.classList.toggle("is-paused");
      pauseBtn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
})();
