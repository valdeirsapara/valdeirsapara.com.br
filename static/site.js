/* Sapará Dev — interações do site comercial (sem dependências). */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;
  var raf = window.requestAnimationFrame.bind(window);

  /* Topo: borda ao rolar */
  var header = document.querySelector(".header");
  if (header) {
    var onScrollHeader = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
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
  }

  /* Palco do hero: camadas reagem ao mouse em profundidades diferentes */
  var stage = document.querySelector("[data-stage]");
  if (stage) {
    stage.querySelectorAll("[data-depth]").forEach(function (el) {
      el.style.setProperty("--depth", el.getAttribute("data-depth"));
    });
    if (finePointer && !reduce) {
      var hero = document.querySelector(".hero");
      hero.addEventListener("pointermove", function (event) {
        var r = stage.getBoundingClientRect();
        var x = (event.clientX - (r.left + r.width / 2)) / r.width;
        var y = (event.clientY - (r.top + r.height / 2)) / r.height;
        stage.style.setProperty("--px", Math.max(-1, Math.min(1, x)).toFixed(3));
        stage.style.setProperty("--py", Math.max(-1, Math.min(1, y)).toFixed(3));
      });
      hero.addEventListener("pointerleave", function () {
        stage.style.setProperty("--px", "0");
        stage.style.setProperty("--py", "0");
      });
    }
  }

  /* Conversa do mockup sendo respondida sozinha */
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
      void el.offsetWidth;
      el.classList.remove("is-entering");
    };
    var play = function () {
      clear();
      items.forEach(function (el) { el.setAttribute("data-hidden", ""); });
      typing.setAttribute("data-hidden", "");
      var t = 700;
      items.forEach(function (el) {
        if (el.getAttribute("data-step") === "out") {
          later(function () { chat.appendChild(typing); show(typing); }, t);
          t += 1400;
          later(function () { typing.setAttribute("data-hidden", ""); show(el); }, t);
          t += 1000;
        } else {
          later(function () { show(el); }, t);
          t += 1200;
        }
      });
      later(play, t + 4500);
    };
    var start = function () {
      if (running) return;
      running = true;
      later(play, 4000); // começa preenchido; depois de 4 s mostra a conversa acontecendo
    };
    var stop = function () {
      running = false;
      clear();
      items.forEach(function (el) { el.removeAttribute("data-hidden"); });
      typing.setAttribute("data-hidden", "");
    };
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { entry.isIntersecting ? start() : stop(); });
      }, { threshold: 0.3 }).observe(chat);
    } else { start(); }
  }

  /* Números contando até o valor final */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduce && hasIO) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var t0 = null;
        var step = function (now) {
          if (t0 === null) t0 = now;
          var p = Math.min(1, (now - t0) / 1600);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 4))));
          if (p < 1) raf(step);
        };
        raf(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* Scroll: frase que acende + trilho do processo */
  var statement = document.querySelector(".statement");
  var words = statement ? statement.querySelectorAll(".w") : [];
  var stepsList = document.querySelector("[data-steps]");
  var stepItems = stepsList ? stepsList.querySelectorAll("[data-step-item]") : [];
  var stepCurrent = document.querySelector("[data-step-current]");
  var ticking = false;

  var onScroll = function () {
    ticking = false;
    var vh = window.innerHeight;

    if (words.length && !reduce) {
      var r = statement.getBoundingClientRect();
      var start = vh * 0.85, end = vh * 0.35;
      var p = (start - r.top) / (start - end + r.height * 0.6);
      p = Math.max(0, Math.min(1, p));
      var lit = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle("is-lit", i < lit);
    }

    if (stepItems.length) {
      var lr = stepsList.getBoundingClientRect();
      var line = vh * 0.55;
      var prog = (line - lr.top) / lr.height;
      stepsList.style.setProperty("--progress", Math.max(0, Math.min(1, prog)).toFixed(3));
      var active = 0;
      for (var s = 0; s < stepItems.length; s++) {
        if (stepItems[s].getBoundingClientRect().top < line) active = s;
      }
      for (var k = 0; k < stepItems.length; k++) stepItems[k].classList.toggle("is-active", k === active);
      if (stepCurrent) stepCurrent.textContent = stepItems[active].getAttribute("data-step-item");
    }
  };
  var requestScroll = function () { if (!ticking) { ticking = true; raf(onScroll); } };
  onScroll();
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll, { passive: true });

  /* Cases: animações só rodam quando o card está na tela; spotlight no mouse */
  var cases = document.querySelectorAll("[data-inview]");
  if (hasIO) {
    var caseIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle("is-in", entry.isIntersecting); });
    }, { threshold: 0.35 });
    cases.forEach(function (el) { caseIO.observe(el); });
  } else {
    cases.forEach(function (el) { el.classList.add("is-in"); });
  }
  if (finePointer && !reduce) {
    document.querySelectorAll("[data-spotlight]").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (event.clientX - r.left) + "px");
        card.style.setProperty("--my", (event.clientY - r.top) + "px");
      });
    });
  }

  /* Botão de WhatsApp fixo some quando já há um CTA grande na tela */
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
