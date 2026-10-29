/* Sapará Dev — movimento com GSAP 3.13 (ScrollTrigger, ScrollSmoother, SplitText, DrawSVG).
 *
 * Feito a partir das skills motion-design (LottieFiles) e gsap-* (GreenSock):
 *
 * Identidade de movimento — personalidade "Premium" (elegante, sem quique):
 *   curva-assinatura  power3.out nas entradas · power2.in nas saídas · sine.inOut no ambiente
 *   durações          rápida 0.35s · padrão 0.5s · lenta 0.8s · revelação 0.9s
 *   entrada padrão    sobe 16–24px; títulos se revelam por máscara, linha a linha
 * Regras seguidas
 *   · stagger total < 0.5s e no máx. 1/3 dos elementos em movimento ao mesmo tempo
 *   · três camadas: principal, secundária (atraso de 50–150ms) e ambiente (≤ 20% da energia)
 *   · só transform, opacity e clip-path; nada de width/height/top/left
 *   · parallax só no desktop, deslocamento < 100px, nunca em texto
 *   · celular: 0.8× das durações, sem parallax, rolagem nativa
 *   · prefers-reduced-motion: nada se mexe, tudo aparece completo
 */
(function () {
  "use strict";
  var root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove("motion"); return; }

  var plugins = [ScrollTrigger];
  if (window.ScrollSmoother) plugins.push(ScrollSmoother);
  if (window.SplitText) plugins.push(SplitText);
  if (window.DrawSVGPlugin) plugins.push(DrawSVGPlugin);
  gsap.registerPlugin.apply(gsap, plugins);

  var EASE = "power3.out", Q = 0.35, STD = 0.5, SLOW = 0.8, REVEAL = 0.9;
  var smoother = null;
  var mm = gsap.matchMedia();

  mm.add({
    motion: "(prefers-reduced-motion: no-preference)",
    desktop: "(min-width: 1024px)",
    finePointer: "(pointer: fine)"
  }, function (ctx) {
    var c = ctx.conditions;
    if (!c.motion) { root.classList.remove("motion"); return; }
    root.classList.add("motion"); // o GSAP chegou: desliga as animações em CSS de novo

    var k = c.desktop ? 1 : 0.8;          // escala de duração por plataforma
    var big = c.desktop && c.finePointer;  // desktop "de verdade": parallax e cursor
    window.__gsapScroll = true;            // o site.js deixa a rolagem com o GSAP

    /* ── 0. Rolagem suave (ScrollSmoother) — só no desktop com mouse ───── */
    if (big && window.ScrollSmoother) {
      smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.1,          // segundos para "alcançar" a rolagem
        effects: true,        // habilita data-speed / data-lag
        smoothTouch: false,   // celular continua com a rolagem nativa
        normalizeScroll: false
      });
      root.classList.add("is-smooth");
    }

    // links internos (#pacotes) rolam suave, já descontando o topo fixo
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        if (smoother) smoother.scrollTo(target, true, "top 88px");
        else target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    /* ── 1. Topo: some ao descer, volta ao subir (desktop, onde é fixo) ── */
    var header = document.querySelector(".header");
    if (header && c.desktop) {
      var showHeader = gsap.from(header, { yPercent: -110, paused: true, duration: Q, ease: EASE }).progress(1);
      ScrollTrigger.create({
        start: 120,
        end: "max",
        onUpdate: function (self) {
          if (self.direction === 1) showHeader.reverse(); else showHeader.play();
        },
        onLeaveBack: function () { showHeader.play(); }
      });
    }

    /* ── 2. Hero: preparação → ação → resolução ─────────────────────────── */
    var hero = document.querySelector(".hero--center");
    if (hero) {
      var stage = hero.querySelector(".stage");
      var phone = stage && stage.querySelector(".phone");
      var floats = hero.querySelectorAll(".float");
      if (stage) stage.classList.add("gsap-on");

      var tl = gsap.timeline({ defaults: { ease: EASE } });
      tl.addLabel("setup", 0)
        .from(".dial", { autoAlpha: 0, scale: 0.96, transformOrigin: "50% 100%", duration: SLOW * k }, "setup")
        .from(".dial line", { drawSVG: 0, duration: 0.9 * k, stagger: { amount: 0.45, from: "center" }, ease: "power2.out" }, "setup")
        .from(".hero--center .place-pill", { y: 12, autoAlpha: 0, duration: Q * k }, "setup+=0.05")
        .addLabel("action", 0.12)
        // 13 palavras × 0.025s = 0.3s de stagger (< 0.5s)
        .fromTo(".hero__title .w",
          { yPercent: 40, autoAlpha: 0, filter: "blur(6px)" },
          { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.7 * k, stagger: 0.025, clearProps: "filter" }, "action")
        .fromTo(".hero--center .hero__answer", { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: STD * k }, "action+=0.33")
        .from(".pick__legend, .pick__chip", { y: 10, autoAlpha: 0, duration: Q * k, stagger: 0.03 }, "action+=0.48")
        .from(".pick__actions > *, .pick__hint", { y: 12, autoAlpha: 0, duration: Q * k, stagger: 0.06 }, "action+=0.63")
        .addLabel("reveal", 0.7);
      if (phone) tl.from(phone, { y: 90, rotationX: 22, autoAlpha: 0, duration: REVEAL * k, ease: "power4.out" }, "reveal");
      // secundária: chega depois do celular, do centro para fora
      tl.from(floats, { y: 22, scale: 0.96, autoAlpha: 0, duration: STD * k, stagger: { each: 0.08, from: "center" } }, "reveal+=0.45")
        .from(".mock-note--stage, .trust--facts p", { autoAlpha: 0, duration: Q, stagger: 0.04 }, "reveal+=0.65");

      // ambiente: o traço das 22h respira (opacidade 0.45–1, 1.6s)
      gsap.to(".dial__tick.is-22, .dial__label.is-22", { opacity: 0.45, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.6 });

      // ambiente: os cards flutuam devagar, cada um num ritmo (não sincronizam)
      if (big) {
        floats.forEach(function (el, i) {
          gsap.to(el, { yPercent: i % 2 ? -6 : 6, duration: 3.5 + i * 0.7, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.8 + i * 0.3 });
        });
      }

      // rolagem: profundidade por velocidade (fundo 0.2×, celular 1×, cards mais rápido)
      if (big && stage) {
        var st = { trigger: hero, start: "top top", end: "bottom top", scrub: 1 };
        gsap.to(".dial", { y: 60, rotation: -4, transformOrigin: "50% 100%", ease: "none", scrollTrigger: st });
        if (phone) gsap.fromTo(phone, { rotationX: 8, y: 0 }, { rotationX: 0, y: -30, ease: "none", immediateRender: false, scrollTrigger: st });
        floats.forEach(function (el, i) { gsap.fromTo(el, { y: 0 }, { y: -40 - i * 14, ease: "none", immediateRender: false, scrollTrigger: st }); });

        // cursor: quickTo reaproveita uma tween por eixo (skill gsap-performance)
        var layers = [phone].concat(Array.prototype.slice.call(floats));
        // (o y fica com a rolagem; o cursor mexe só no x e num leve giro do celular)
        var movers = layers.map(function (el, i) {
          var depth = i === 0 ? 6 : 12 + i * 3; // primeiro plano ≤ 20px
          return { d: depth, x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }) };
        });
        var turn = phone ? gsap.quickTo(phone, "rotationY", { duration: 0.8, ease: "power3" }) : null;
        hero.addEventListener("pointermove", function (e) {
          var r = stage.getBoundingClientRect();
          var nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
          movers.forEach(function (m) { m.x(nx * m.d); });
          if (turn) turn(nx * 6);
        });
        hero.addEventListener("pointerleave", function () { movers.forEach(function (m) { m.x(0); }); if (turn) turn(0); });
      }
    }

    /* ── 3. Títulos de seção: máscara linha a linha (SplitText) ─────────── */
    var splits = [];
    if (window.SplitText) {
      gsap.utils.toArray(".title:not(.hero__title)").forEach(function (title) {
        var s = SplitText.create(title, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self.lines, {
              yPercent: 105, duration: SLOW * k, ease: "power4.out", stagger: 0.08,
              scrollTrigger: { trigger: title, start: "top 85%", once: true }
            });
          }
        });
        splits.push(s);
      });
    }

    // rótulos (kicker): revelam da esquerda para a direita (ordem de leitura)
    gsap.utils.toArray(".kicker").forEach(function (el) {
      gsap.from(el, { clipPath: "inset(0 100% 0 0)", duration: STD * k, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });

    // frases de apoio: chegam logo depois do título (follow-through ~120ms)
    gsap.utils.toArray(".lede, .person__lede, .who__more, .plans__foot").forEach(function (el) {
      gsap.from(el, { y: 16, autoAlpha: 0, duration: STD * k, ease: EASE, delay: 0.12,
        scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });

    /* ── 4. "Não precisa ser assim": as palavras acendem com a rolagem ──── */
    var statementWords = gsap.utils.toArray(".statement .w");
    if (statementWords.length) {
      gsap.set(statementWords, { opacity: 0.16 });
      gsap.to(statementWords, {
        opacity: 1, ease: "none", stagger: 0.1,
        scrollTrigger: { trigger: ".statement", start: "top 80%", end: "bottom 45%", scrub: 0.6 }
      });
    }
    ScrollTrigger.batch(".diff", {
      start: "top 88%", once: true,
      onEnter: function (b) { gsap.from(b, { y: 22, autoAlpha: 0, duration: STD * k, ease: EASE, stagger: 0.08 }); }
    });

    /* ── 5. Showcase: mensagem → resposta → horário na agenda ──────────── */
    if (document.querySelector(".showcase")) {
      if (big) {
        gsap.from(".browser", {
          y: 60, scale: 0.94, rotationX: 12, transformPerspective: 1600, transformOrigin: "50% 0%", ease: "none",
          scrollTrigger: { trigger: ".browser", start: "top 95%", end: "top 45%", scrub: 1 }
        });
      }
      var story = gsap.timeline({ defaults: { ease: EASE }, scrollTrigger: { trigger: ".browser", start: "top 60%", once: true } });
      story.from(".dash__list li", { x: -10, autoAlpha: 0, duration: Q, stagger: 0.04 })
        .from(".dash__msgs .b", { y: 14, autoAlpha: 0, duration: Q, stagger: 0.45 }, 0.2)
        .from(".dash__agenda li:not(.is-new)", { autoAlpha: 0, duration: Q, stagger: 0.05 }, 0.2)
        .addLabel("resolve", ">")
        .from(".dash__agenda .is-new", { scale: 0.92, autoAlpha: 0, duration: STD }, "resolve-=0.05")
        .fromTo(".dash__agenda .is-new", { boxShadow: "0 0 0 0 rgba(232,131,74,.55)" },
          { boxShadow: "0 0 0 10px rgba(232,131,74,0)", duration: 0.9, ease: "power2.out" }, "resolve+=0.1");
      var kpi = document.querySelector(".dash__kpi b");
      if (kpi) {
        var n = { v: 20 };
        story.to(n, { v: 21, duration: Q, ease: "none", onUpdate: function () { kpi.textContent = Math.round(n.v); } }, "resolve");
      }
    }

    /* ── 6. Pacotes e cases: em grupo (ScrollTrigger.batch) ─────────────── */
    ["plan", "case", "post", "who__row"].forEach(function (cls) {
      var els = gsap.utils.toArray("." + cls);
      if (!els.length) return;
      gsap.set(els, { y: 28, autoAlpha: 0 });
      ScrollTrigger.batch(els, {
        start: "top 90%", once: true,
        onEnter: function (b) { gsap.to(b, { y: 0, autoAlpha: 1, duration: STD * k, ease: EASE, stagger: 0.08, overwrite: true }); }
      });
    });
    // pacote em destaque: brilho que respira devagar (ambiente, 0.7–1)
    var featured = document.querySelector(".plan--featured");
    if (featured) gsap.fromTo(featured, { "--glow": 0.7 }, { "--glow": 1, duration: 2.5, ease: "sine.inOut", yoyo: true, repeat: -1 });

    // cases: a ilustração assenta dentro do card ao rolar (parallax interno, desktop)
    if (big) {
      gsap.utils.toArray(".case__visual > *:not(.mock-note)").forEach(function (el) {
        gsap.fromTo(el, { scale: 1.08, yPercent: 4 }, { scale: 1, yPercent: -4, ease: "none",
          scrollTrigger: { trigger: el.closest(".case"), start: "top bottom", end: "bottom top", scrub: 1 } });
      });
    }

    // ícones de traço se desenham ao aparecer (DrawSVG)
    if (window.DrawSVGPlugin) {
      gsap.utils.toArray(".who__icon svg, .promises__icon svg").forEach(function (svg) {
        var strokes = svg.querySelectorAll("path, circle, rect, ellipse, line, polyline");
        gsap.from(strokes, { drawSVG: 0, duration: SLOW * k, ease: "power2.inOut", stagger: 0.06,
          scrollTrigger: { trigger: svg, start: "top 90%", once: true } });
      });
    }

    /* ── 7. Como funciona: título preso + trilho que enche ──────────────── */
    var steps = document.querySelector("[data-steps]");
    if (steps) {
      var items = gsap.utils.toArray("[data-step-item]");
      var counter = document.querySelector("[data-step-current]");
      gsap.fromTo(".steps__fill", { scaleY: 0 }, { scaleY: 1, transformOrigin: "50% 0%", ease: "none",
        scrollTrigger: { trigger: steps, start: "top 55%", end: "bottom 55%", scrub: 0.5 } });
      items.forEach(function (item) {
        ScrollTrigger.create({
          trigger: item, start: "top 55%", end: "bottom 55%",
          onToggle: function (self) {
            if (!self.isActive) return;
            items.forEach(function (it) { it.classList.toggle("is-active", it === item); });
            if (counter) counter.textContent = item.getAttribute("data-step-item");
          }
        });
      });
      if (c.desktop) {
        ScrollTrigger.create({ trigger: ".process__grid", start: "top 140px", end: function () { return "+=" + Math.max(0, steps.offsetHeight - document.querySelector(".process__head").offsetHeight); }, pin: ".process__head", pinSpacing: false });
      }
    }

    /* ── 8. Quem faz: a foto se revela, o selo e os compromissos seguem ── */
    if (document.querySelector(".person")) {
      gsap.timeline({ defaults: { ease: EASE }, scrollTrigger: { trigger: ".person", start: "top 70%", once: true } })
        .fromTo(".person__photo img, .person__photo .maker__photo--placeholder",
          { clipPath: "inset(14% 14% 14% 14% round 24px)", scale: 1.08 },
          { clipPath: "inset(0% 0% 0% 0% round 24px)", scale: 1, duration: REVEAL * k, ease: "power4.out" })
        .from(".person__tag", { y: 18, autoAlpha: 0, duration: STD }, 0.45)
        .from(".promises li", { x: -8, autoAlpha: 0, duration: Q, stagger: 0.07 }, 0.5)
        .from(".person__actions > *", { y: 12, autoAlpha: 0, duration: Q, stagger: 0.06 }, 0.75);
      if (big) gsap.to(".person__photo img", { yPercent: -4, ease: "none", scrollTrigger: { trigger: ".person", start: "top bottom", end: "bottom top", scrub: 1 } });
    }

    /* ── 9. CTA final: palavras sobem por máscara, o brilho cresce ──────── */
    var finalTitle = document.querySelector(".final__title");
    if (finalTitle && window.SplitText) {
      SplitText.create(finalTitle, {
        type: "words", mask: "words", wordsClass: "split-word", autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.words, { yPercent: 110, duration: REVEAL * k, ease: "power4.out", stagger: 0.1,
            scrollTrigger: { trigger: finalTitle, start: "top 85%", once: true } });
        }
      });
      gsap.from(".final__text, .final__actions", { y: 16, autoAlpha: 0, duration: STD * k, ease: EASE, stagger: 0.1,
        scrollTrigger: { trigger: finalTitle, start: "top 80%", once: true }, delay: 0.25 });
      gsap.fromTo(".final__glow", { scale: 0.8, opacity: 0.4 }, { scale: 1.05, opacity: 1, ease: "none",
        scrollTrigger: { trigger: ".final", start: "top bottom", end: "center center", scrub: 1 } });
    }

    // botões principais "magnéticos" (desktop com mouse; deslocamento ≤ 10px)
    if (big) {
      gsap.utils.toArray(".btn--accent.btn--lg, .btn--accent.btn--xl").forEach(function (btn) {
        var xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
        var yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
        btn.addEventListener("pointermove", function (e) {
          var r = btn.getBoundingClientRect();
          xTo(((e.clientX - r.left) / r.width - 0.5) * 16);
          yTo(((e.clientY - r.top) / r.height - 0.5) * 10);
        });
        btn.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
      });
    }

    /* ── 10. Rodapé: a marca gigante sobe conforme o rodapé aparece ─────── */
    if (document.querySelector(".wordmark")) {
      gsap.from(".wordmark", { yPercent: 45, ease: "none",
        scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: 1 } });
    }

    // o reveal antigo por IntersectionObserver fica desligado aqui
    document.querySelectorAll(".reveal.is-pending").forEach(function (el) { el.classList.remove("is-pending"); });

    return function () {
      window.__gsapScroll = false;
      splits.forEach(function (s) { s.revert(); });
      if (smoother) { smoother.kill(); smoother = null; root.classList.remove("is-smooth"); }
      root.classList.remove("motion");
    };
  });

  // fontes e imagens mudam alturas: recalcula os pontos da rolagem
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
