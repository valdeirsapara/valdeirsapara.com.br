/* Sapará Dev — interações do site comercial (sem dependências). */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  /* Topo: borda ao rolar */
  var header = document.querySelector(".header");
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });
  }

  /* Menu mobile */
  var menuBtn = document.querySelector(".menu-btn");
  var mobileNav = document.getElementById("menu-mobile");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      mobileNav.hidden = open;
    });
    mobileNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        menuBtn.setAttribute("aria-expanded", "false");
        mobileNav.hidden = true;
      }
    });
  }

  /* Entrada das seções: só o que está abaixo da dobra começa escondido */
  if (!reduce && hasIO) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("is-pending");
          entry.target.classList.add("is-in");
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });

    document.querySelectorAll(".reveal, .steps").forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
        if (el.classList.contains("reveal")) el.classList.add("is-pending");
        revealIO.observe(el);
      } else {
        el.classList.add("is-in");
      }
    });
  } else {
    document.querySelectorAll(".steps").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Statement: palavras acendem conforme a página rola */
  var statement = document.querySelector(".statement");
  if (statement && !reduce) {
    var words = statement.querySelectorAll(".w");
    var ticking = false;
    var update = function () {
      ticking = false;
      var rect = statement.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 quando o topo entra a 85% da tela; 1 quando o fim chega a 45%
      var start = vh * 0.85;
      var end = vh * 0.45;
      var progress = (start - rect.top) / (start - end + rect.height);
      progress = Math.max(0, Math.min(1, progress));
      var lit = Math.round(progress * words.length);
      for (var i = 0; i < words.length; i++) {
        words[i].classList.toggle("is-lit", i < lit);
      }
    };
    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  /* Mockup: conversa de WhatsApp respondida sozinha */
  var chat = document.querySelector("[data-chat]");
  if (chat && !reduce) {
    var items = Array.prototype.slice.call(chat.querySelectorAll("[data-step]"));
    var typing = chat.querySelector(".typing");
    var timers = [];
    var running = false;

    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    var clear = function () { timers.forEach(clearTimeout); timers = []; };

    var show = function (el) {
      el.removeAttribute("data-hidden");
      el.classList.add("is-entering");
      void el.offsetWidth; // força o reflow para a transição rodar
      el.classList.remove("is-entering");
    };

    var reset = function () {
      items.forEach(function (el) { el.setAttribute("data-hidden", ""); });
      typing.setAttribute("data-hidden", "");
    };

    var play = function () {
      clear();
      reset();
      var t = 500;
      items.forEach(function (el) {
        var who = el.getAttribute("data-step");
        if (who === "out") {
          later(function () { typing.parentNode.appendChild(typing); show(typing); }, t);
          t += 1300;
          later(function () { typing.setAttribute("data-hidden", ""); show(el); }, t);
          t += 900;
        } else if (who === "event") {
          t += 300;
          later(function () { show(el); }, t);
          t += 900;
        } else {
          later(function () { show(el); }, t);
          t += 1100;
        }
      });
      later(play, t + 4200);
    };

    var start = function () { if (!running) { running = true; play(); } };
    var stop = function () {
      running = false;
      clear();
      items.forEach(function (el) { el.removeAttribute("data-hidden"); });
      typing.setAttribute("data-hidden", "");
    };

    if (hasIO) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { entry.isIntersecting ? start() : stop(); });
      }, { threshold: 0.35 }).observe(chat);
    } else {
      start();
    }
  }

  /* Spotlight nos cards: o brilho segue o cursor */
  if (!reduce) {
    document.querySelectorAll("[data-spotlight]").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (event.clientX - r.left) + "px");
        card.style.setProperty("--my", (event.clientY - r.top) + "px");
      });
    });
  }

  /* Números que contam até o valor final quando aparecem */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduce && hasIO) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var textNode = el.firstChild;
        var t0 = null;
        var tick = function (now) {
          if (t0 === null) t0 = now;
          var p = Math.min(1, (now - t0) / 1400);
          var eased = 1 - Math.pow(1 - p, 3);
          textNode.nodeValue = String(Math.round(target * eased));
          if (p < 1) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* Botão de WhatsApp fixo: some quando já tem um CTA grande na tela */
  var float = document.querySelector(".wa-float");
  var bigCtas = document.querySelectorAll("[data-cta]");
  if (float && bigCtas.length && hasIO) {
    var visible = new Set();
    var ctaIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target);
      });
      float.classList.toggle("is-hidden", visible.size > 0);
    });
    bigCtas.forEach(function (el) { ctaIO.observe(el); });
  }
})();
