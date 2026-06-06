let animatePromise;

const loadAnimate = () => {
  animatePromise ??= import("motion").then((mod) => mod.animate);
  return animatePromise;
};

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

  // ── 8. 3D Tilt Cards [data-tilt] ─────────────────────────────
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const strength = parseFloat(card.dataset.tilt || "10");
      let rafId = 0;
      let tx = 0, ty = 0, tz = 0;
      let cx = 0, cy = 0;

      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        tx = -y * strength;
        ty =  x * strength;
        tz = strength * 0.8;

        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          cx += (tx - cx) * 0.18;
          cy += (ty - cy) * 0.18;
          card.style.transform = `perspective(800px) rotateX(${cx}deg) rotateY(${cy}deg) translateZ(${tz}px) scale(1.02)`;
          card.style.transition = "none";
        });
      });

      card.addEventListener("mouseleave", () => {
        cancelAnimationFrame(rafId);
        cx = 0; cy = 0;
        card.style.transition = "transform 600ms cubic-bezier(.16,1,.3,1)";
        card.style.transform = "perspective(800px) rotateX(0) rotateY(0) translateZ(0) scale(1)";
      });
    });
  }

  // ── 9. Floating text lines [data-text-float] ─────────────────
  // Stagger-animates each line of text inside the element
  document.querySelectorAll("[data-text-float]").forEach((el) => {
    const direction = el.dataset.textFloat || "up";
    const lines = el.querySelectorAll(".float-line");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          lines.forEach((line, i) => {
            setTimeout(() => line.classList.add("is-in"), i * 90);
          });
          io.unobserve(e.target);
        });
      },
      { threshold: 0.2 }
    );
    if (reduced) {
      lines.forEach((l) => l.classList.add("is-in"));
    } else {
      io.observe(el);
    }
  });

  // ── 10. Card float after reveal ──────────────────────────────
  const floatCards = document.querySelectorAll(".glow-card[data-reveal]");
  if (floatCards.length) {
    const fio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const delay = parseInt(el.dataset.revealDelay ?? "0", 10);
          setTimeout(() => {
            el.classList.add("is-in");
            setTimeout(() => el.classList.add("card-float-active"), 700);
          }, delay);
          fio.unobserve(el);
        });
      },
      { threshold: 0.12 }
    );
    floatCards.forEach((el) => {
      if (reduced) { el.classList.add("is-in", "card-float-active"); }
      else fio.observe(el);
    });
  }

  // ── 11. Dramatic card motion for hover and touch ─────────────
  const storyCards = document.querySelectorAll(".glow-card");
  if (storyCards.length) {
    let lastGlazedCard = null;
    let lastGlazeAt = 0;

    const glazeCard = async (card, intensity = 1) => {
      if (reduced || !card) return;
      const now = performance.now();
      if (card === lastGlazedCard && now - lastGlazeAt < 1300) return;
      lastGlazedCard = card;
      lastGlazeAt = now;
      const animate = await loadAnimate();

      let glaze = card.querySelector(".honey-glaze");
      if (!glaze) {
        glaze = document.createElement("span");
        glaze.className = "honey-glaze";
        glaze.setAttribute("aria-hidden", "true");
        card.appendChild(glaze);
      }

      card.classList.add("is-honey-glazed");
      animate(glaze, {
        opacity: [0, 0.95 * intensity, 0.62 * intensity, 0],
        x: ["-42%", "8%", "68%", "128%"],
        scaleX: [0.72, 1, 1.08, 0.86],
      }, {
        duration: 1.18,
        ease: [0.16, 1, 0.3, 1],
      });
      animate(card, {
        filter: [
          "drop-shadow(0 0 0 rgba(245,164,31,0))",
          `drop-shadow(0 18px 28px rgba(245,164,31,${0.16 * intensity}))`,
          "drop-shadow(0 0 0 rgba(245,164,31,0))",
        ],
      }, {
        duration: 1.18,
        ease: "easeOut",
      });
      window.setTimeout(() => card.classList.remove("is-honey-glazed"), 1350);
    };

    storyCards.forEach((card, i) => {
      card.style.setProperty("--card-drift-delay", `${(i % 6) * -0.55}s`);
      card.dataset.motionKind = card.dataset.motionKind || ["rise", "pop", "float", "steam"][i % 4];
      card.addEventListener("pointerenter", () => {
        card.classList.add("is-card-engaged");
        glazeCard(card, 0.74);
      });
      card.addEventListener("pointerleave", () => card.classList.remove("is-card-engaged"));
      card.addEventListener("pointerdown", () => {
        card.classList.add("is-card-engaged", "is-card-tapped");
        glazeCard(card, 1);
        window.setTimeout(() => card.classList.remove("is-card-tapped"), 520);
      }, { passive: true });
    });

    window.addEventListener("luli:bee-pass", (event) => {
      if (reduced) return;
      const detail = event.detail || {};
      const x = detail.x;
      const y = detail.y;
      if (typeof x !== "number" || typeof y !== "number") return;

      let closest = null;
      let closestDistance = Infinity;
      storyCards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const withinY = y >= r.top - 56 && y <= r.bottom + 56;
        const withinX = x >= r.left - 72 && x <= r.right + 72;
        if (!withinX || !withinY) return;
        const dx = x - (r.left + r.width / 2);
        const dy = y - (r.top + r.height / 2);
        const distance = Math.hypot(dx, dy);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = card;
        }
      });
      if (closest) glazeCard(closest, detail.landed ? 1 : 0.82);
    }, { passive: true });

    if (!reduced) {
      const cardIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle("is-card-near", entry.isIntersecting);
          });
        },
        { threshold: 0.45 }
      );
      storyCards.forEach((card) => cardIo.observe(card));
    }
  }

  // ── 12. Typewriter snippets inside cards ─────────────────────
  document.querySelectorAll("[data-card-type]").forEach((el) => {
    const node = el;
    const raw = (node.dataset.cardType || node.textContent || "").trim();
    if (!raw) return;
    node.textContent = reduced ? raw : "";
    if (reduced) return;
    let started = false;
    const typeIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || started) return;
          started = true;
          let i = 0;
          const tick = () => {
            node.textContent = raw.slice(0, i);
            i += 1;
            if (i <= raw.length) window.setTimeout(tick, 28);
          };
          window.setTimeout(tick, 180);
          typeIo.unobserve(node);
        });
      },
      { threshold: 0.62 }
    );
    typeIo.observe(node);
  });
}
