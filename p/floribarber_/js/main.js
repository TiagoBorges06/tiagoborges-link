(function () {
  "use strict";
  window.__flori = true;
  document.documentElement.classList.add("js");

  /* cabecalho com linha ao rolar */
  var top = document.getElementById("top");
  var onScroll = function () { top.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* aparecer ao rolar (uma vez) */
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add("in"); });
  }
  window.addEventListener("load", function () {
    setTimeout(function () { rv.forEach(function (el) { el.classList.add("in"); }); }, 2500);
  });

  /* abas da tabela de precos */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
  function selectTab(i, focus) {
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(i); });
    t.addEventListener("keydown", function (e) {
      var n = tabs.length;
      if (e.key === "ArrowRight") { e.preventDefault(); selectTab((i + 1) % n, true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); selectTab((i - 1 + n) % n, true); }
      else if (e.key === "Home") { e.preventDefault(); selectTab(0, true); }
      else if (e.key === "End") { e.preventDefault(); selectTab(n - 1, true); }
    });
  });
  selectTab(0);

  /* filtro dos estilos */
  var chips = document.querySelectorAll(".chip");
  var items = document.querySelectorAll("#wall li");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-f");
      chips.forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
      items.forEach(function (li) {
        var tags = (li.getAttribute("data-t") || "").split(" ");
        li.hidden = !(f === "todos" || tags.indexOf(f) !== -1);
      });
    });
  });

  /* ampliar foto */
  var lb = document.getElementById("lb");
  var lbImg = document.getElementById("lb-img");
  var lbCap = document.getElementById("lb-cap");
  if (lb && typeof lb.showModal === "function") {
    document.querySelectorAll("#wall button").forEach(function (b) {
      b.addEventListener("click", function () {
        var img = b.querySelector("img");
        lbImg.src = b.getAttribute("data-full");
        lbImg.alt = img.alt;
        lbCap.textContent = b.querySelector("span").textContent;
        lb.showModal();
      });
    });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.closest(".lb-close")) lb.close(); });
    lb.addEventListener("close", function () { lbImg.removeAttribute("src"); });
  }

  /* hoje + aberto agora (horario de Sao Paulo) */
  var sched = { 0: [], 1: [], 2: [[9, 12], [13, 20]], 3: [[9, 12], [13, 20]], 4: [[9, 12], [13, 20]], 5: [[9, 12], [13, 21]], 6: [[8, 18]] };
  var dayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  var status = document.getElementById("status");
  function hh(n) { return (n < 10 ? "0" : "") + n + "h"; }
  function update() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
      var days = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
      var d = days[get("weekday")];
      var h = parseInt(get("hour"), 10) % 24 + parseInt(get("minute"), 10) / 60;
      document.querySelectorAll(".hours tr").forEach(function (r) {
        var today = r.getAttribute("data-d") === String(d);
        r.classList.toggle("today", today);
        if (today) r.setAttribute("aria-current", "date"); else r.removeAttribute("aria-current");
      });
      var msg = "";
      if (sched[d].some(function (r) { return h >= r[0] && h < r[1]; })) {
        msg = "está aberta agora.";
      } else {
        var next = null;
        for (var k = 0; k < 8 && !next; k++) {
          var dd = (d + k) % 7;
          for (var j = 0; j < sched[dd].length; j++) {
            if (k > 0 || sched[dd][j][0] > h) { next = { k: k, d: dd, at: sched[dd][j][0] }; break; }
          }
        }
        if (next) {
          var when = next.k === 0 ? "hoje" : next.k === 1 ? "amanhã" : dayNames[next.d];
          msg = "está fechada agora. Abre " + when + " às " + hh(next.at) + ".";
        }
      }
      if (status && msg) status.textContent = msg;
    } catch (e) { /* mantem o texto padrao */ }
  }
  update();
  setInterval(update, 60000);
})();
