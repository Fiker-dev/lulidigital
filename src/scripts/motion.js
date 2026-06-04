export function initMotion() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── 1. Scroll Reveal [data-reveal] ───────────────────────────
  const reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const delay = parseInt(e.target.dataset.revealDelay ?? "0", 10);
          setTimeout(() => e.target.classList.add("is-in"), delay);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => {
      if (reduced) el.classList.add("is-in");
      else io.observe(el);
    });
  }

  // ── 2. Blur-in [data-blur-in] ────────────────────────────────
  const blurs = document.querySelectorAll("[data-blur-in]");
  if (blurs.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const delay = parseInt(e.target.dataset.blurDelay ?? "0", 10);
          e.target.style.setProperty("--blur-delay", `${delay}ms`);
          setTimeout(() => e.target.classList.add("is-in"), delay);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.15 }
    );
    blurs.forEach((el) => {
      if (reduced) el.classList.add("is-in");
      else io.observe(el);
    });
  }

  // ── 3. Word-by-word [data-word-reveal] ───────────────────────
  document.querySelectorAll("[data-word-reveal]").forEach((el) => {
    if (reduced) { el.classList.add("is-in"); return; }
    const raw = el.textContent ?? "";
    const tokens = raw.split(/(\s+)/);
    let wordIdx = 0;
    el.innerHTML = tokens
      .map((t) => {
        if (/^\s+$/.test(t)) return t;
        const span = `<span class="word" style="--word-delay:${wordIdx * 55}ms">${t}</span>`;
        wordIdx++;
        return span;
      })
      .join("");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);
  });

  // ── 4. Stagger children [data-stagger] ───────────────────────
  document.querySelectorAll("[data-stagger]").forEach((parent) => {
    const gap = parseInt(parent.dataset.staggerGap ?? "80", 10);
    Array.from(parent.children).forEach((child, i) => {
      child.style.setProperty("--stagger-delay", `${i * gap}ms`);
    });
    if (reduced) { parent.classList.add("is-in"); return; }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    );
    io.observe(parent);
  });

  // ── 5. Number counter [data-count] ───────────────────────────
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.countSuffix ?? "";
          const dur = 1400;
          const t0 = performance.now();
          const tick = (now) => {
            const p = Math.min((now - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => {
      const suffix = el.dataset.countSuffix ?? "";
      if (reduced) {
        el.textContent = el.dataset.count + suffix;
      } else {
        el.textContent = "0" + suffix;
        io.observe(el);
      }
    });
  }

  // ── 6. Glow card mousemove ───────────────────────────────────
  document.querySelectorAll(".glow-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      card.style.setProperty("--glow-x", `${x}%`);
      card.style.setProperty("--glow-y", `${y}%`);
      card.style.setProperty("--glow-angle", `${angle}deg`);
    });
  });

  // ── 7. Sticky header ─────────────────────────────────────────
  const header = document.querySelector(".site-header");
  if (header) {
    let lastY = 0;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 60);
      header.classList.toggle("is-hidden", y > lastY && y > 160);
      lastY = y;
    }, { passive: true });
  }
}
