(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Cabeçalho com fundo depois da rolagem */
  const head = $("[data-head]");
  if (head) {
    const updateHead = () => head.classList.toggle("is-stuck", window.scrollY > 8);
    updateHead();
    window.addEventListener("scroll", updateHead, { passive: true });
  }

  /* Menu mobile */
  const menu = $("[data-menu]");
  const menuOpen = $("[data-menu-open]");
  const menuClose = $("[data-menu-close]");
  const pageRegions = $$("[data-page-region]");
  const supportsInert = "inert" in HTMLElement.prototype;
  let lastFocus = null;

  const setInert = (state) => {
    if (!supportsInert) return;
    pageRegions.forEach((element) => {
      element.inert = state;
    });
  };

  const setMenu = (open, restoreFocus = true) => {
    if (!menu || !menuOpen) return;
    menu.hidden = !open;
    menuOpen.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    setInert(open);

    if (open) {
      lastFocus = document.activeElement;
      (menuClose || menu).focus();
    } else if (restoreFocus && lastFocus && typeof lastFocus.focus === "function" && !lastFocus.hidden) {
      lastFocus.focus();
    }
  };

  if (menu && menuOpen) {
    menuOpen.addEventListener("click", () => setMenu(true));

    if (menuClose) {
      menuClose.addEventListener("click", () => setMenu(false));
    }

    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    menu.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusables = $$("a[href], button:not([disabled])", menu).filter(
        (element) => element.offsetParent !== null
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!menu.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) setMenu(false);
    });

    window.addEventListener("resize", () => {
      if (!menu.hidden && window.innerWidth > 960) setMenu(false);
    });
  }

  /* Revelação suave dos blocos */
  const revealItems = $$("[data-reveal]");
  if (revealItems.length) {
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-in"));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      revealItems.forEach((item) => revealObserver.observe(item));
    }
  }

  /* Carrossel do pátio */
  const rail = $("[data-rail]");
  const railPrev = $("[data-rail-prev]");
  const railNext = $("[data-rail-next]");

  if (rail && railPrev && railNext) {
    const step = () => {
      const card = $(".bike", rail);
      if (!card) return rail.clientWidth * 0.8;
      const styles = window.getComputedStyle(rail);
      const gap = parseFloat(styles.columnGap || styles.gap) || 16;
      return card.getBoundingClientRect().width + gap;
    };

    const behavior = () => (reduceMotion.matches ? "auto" : "smooth");

    const updateRail = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      railPrev.disabled = rail.scrollLeft <= 2;
      railNext.disabled = rail.scrollLeft >= max - 2;
    };

    railPrev.addEventListener("click", () => {
      rail.scrollBy({ left: -step(), behavior: behavior() });
    });

    railNext.addEventListener("click", () => {
      rail.scrollBy({ left: step(), behavior: behavior() });
    });

    rail.addEventListener("scroll", updateRail, { passive: true });
    window.addEventListener("resize", updateRail);
    window.addEventListener("load", updateRail);
    requestAnimationFrame(updateRail);
  }

  /* Ticker de condições: controle de pausa */
  const ticker = $(".ticker");
  const tickerToggle = $("[data-ticker-toggle]");

  if (ticker && tickerToggle) {
    tickerToggle.addEventListener("click", () => {
      const paused = ticker.classList.toggle("is-paused");
      tickerToggle.setAttribute("aria-pressed", String(paused));
      tickerToggle.setAttribute(
        "aria-label",
        paused ? "Retomar a faixa de condições" : "Pausar a faixa de condições"
      );
    });
  }

  /* Reels: toca e pausa pelo botão, um por vez */
  const reels = $$("[data-reel]");

  reels.forEach((video) => {
    const figure = video.closest(".reel");
    const toggle = figure ? $("[data-reel-toggle]", figure) : null;
    if (!toggle) return;

    const sync = (playing) => {
      toggle.setAttribute("aria-pressed", String(playing));
      const label = video.getAttribute("aria-label") || "vídeo";
      toggle.setAttribute("aria-label", `${playing ? "Pausar" : "Reproduzir"} ${label.charAt(0).toLowerCase()}${label.slice(1)}`);
    };

    const play = () => {
      reels.forEach((other) => {
        if (other !== video && !other.paused) other.pause();
      });
      video.muted = false;
      video.volume = 1;
      const attempt = video.play();
      if (attempt && typeof attempt.then === "function") {
        attempt.then(() => sync(true)).catch(() => sync(false));
      } else {
        sync(true);
      }
    };

    toggle.addEventListener("click", () => {
      if (video.paused) play();
      else video.pause();
    });

    video.addEventListener("click", () => {
      if (video.paused) play();
      else video.pause();
    });

    video.addEventListener("play", () => sync(true));
    video.addEventListener("pause", () => sync(false));
  });

  /* Galeria e lightbox da página da moto */
  const gallery = $("[data-gallery]");
  if (gallery) {
    const main = $("[data-gallery-main]", gallery);
    const mainLink = main ? main.closest("a") : null;
    const thumbs = $$("[data-gallery-thumb]", gallery);
    const dialog = $("[data-lightbox]");
    const lightboxImage = dialog ? $("[data-lightbox-image]", dialog) : null;
    const lightboxCount = dialog ? $("[data-lightbox-count]", dialog) : null;
    const lightboxPrev = dialog ? $("[data-lightbox-prev]", dialog) : null;
    const lightboxNext = dialog ? $("[data-lightbox-next]", dialog) : null;
    const lightboxClose = dialog ? $("[data-lightbox-close]", dialog) : null;

    const slides = thumbs.length
      ? thumbs.map((thumb, index) => ({
          src: thumb.getAttribute("href"),
          card: $("img", thumb) ? $("img", thumb).getAttribute("src") : thumb.getAttribute("href"),
          alt: thumb.getAttribute("data-alt") || `${main ? main.alt : ""} ${index + 1}`,
        }))
      : main
        ? [{ src: mainLink ? mainLink.getAttribute("href") : main.getAttribute("src"), card: main.getAttribute("src"), alt: main.alt }]
        : [];

    let current = 0;

    const setCurrent = (index, updateMain = true) => {
      if (!slides.length) return;
      current = (index + slides.length) % slides.length;
      const slide = slides[current];

      if (lightboxImage && dialog && dialog.open) {
        lightboxImage.src = slide.src;
        lightboxImage.alt = slide.alt;
      }
      if (lightboxCount) lightboxCount.textContent = `${current + 1} / ${slides.length}`;

      if (updateMain && main) {
        main.src = slide.src || slide.card;
        main.alt = slide.alt;
        if (mainLink) mainLink.href = slide.src;
      }

      thumbs.forEach((thumb, thumbIndex) => {
        thumb.classList.toggle("is-active", thumbIndex === current);
      });
    };

    const openLightbox = (index) => {
      if (!dialog || !lightboxImage) {
        if (mainLink) window.open(mainLink.href, "_blank", "noopener");
        return;
      }
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
        setCurrent(index, false);
        document.body.classList.add("lightbox-open");
        if (lightboxClose) lightboxClose.focus();
      } else {
        setCurrent(index, false);
        window.open(slides[current].src, "_blank", "noopener");
      }
    };

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener("click", (event) => {
        event.preventDefault();
        setCurrent(index);
      });
    });

    if (mainLink) {
      mainLink.addEventListener("click", (event) => {
        event.preventDefault();
        openLightbox(current);
      });
    }

    if (dialog) {
      dialog.addEventListener("close", () => {
        document.body.classList.remove("lightbox-open");
      });
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
      if (lightboxClose) lightboxClose.addEventListener("click", () => dialog.close());
      if (lightboxPrev) lightboxPrev.addEventListener("click", () => setCurrent(current - 1, false));
      if (lightboxNext) lightboxNext.addEventListener("click", () => setCurrent(current + 1, false));
      dialog.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setCurrent(current - 1, false);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          setCurrent(current + 1, false);
        }
      });
    }
  }

  /* Ano atual no rodapé */
  $$("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
})();
