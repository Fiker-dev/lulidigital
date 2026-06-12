/**
 * LuliDigital Hive Vitality System
 * Scroll-driven progressive ecosystem awakening.
 * No WebGL. SVG-first. RAF-throttled. Reduced-motion safe.
 */

export function initHive() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initScrollEnergy();
  initHexGrid(reduced);

  if (reduced) {
    document.querySelectorAll('[data-atmosphere]').forEach((el) => {
      el.classList.add('is-atmosphere-active');
    });
    return;
  }

  initCursorField();
  initParticleZones();
  initSectionAtmospheres();
  initConnectionPaths();
  initLanaTrailCells();
  initDeskTransforms();
}

// ── 1. Scroll Energy ─────────────────────────────────────────────
// --hive-energy: 0 → 1 as the visitor descends the page.
// Phase attr drives CSS state selectors (0=dormant → 3=alive).
function initScrollEnergy() {
  let last = -1;
  let ticking = false;
  const root = document.documentElement;

  const update = () => {
    const docH = document.body.scrollHeight - window.innerHeight;
    const raw  = docH > 0 ? Math.min(window.scrollY / docH, 1) : 0;
    // Ease-in so early sections feel fresh and depth feels rewarding
    const energy = Math.round(Math.pow(raw, 0.72) * 1000) / 1000;

    if (Math.abs(energy - last) > 0.002) {
      last = energy;
      root.style.setProperty('--hive-energy', energy);
      root.setAttribute(
        'data-hive-phase',
        energy < 0.18 ? '0' : energy < 0.46 ? '1' : energy < 0.78 ? '2' : '3'
      );
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  update();
}

// ── 2. Fixed Hex Grid ────────────────────────────────────────────
// Fills the viewport with ⬡ characters in a honeycomb layout.
// Opacity driven by --hive-energy; each cell stores its own offset.
function initHexGrid(reduced) {
  const container = document.getElementById('hive-ambient-grid');
  if (!container) return;

  const build = () => {
    container.innerHTML = '';
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;
    const cw  = 44;   // column spacing
    const rh  = 38;   // row spacing
    const cols = Math.ceil(vw  / cw)  + 2;
    const rows = Math.ceil(vh  / rh)  + 2;
    const frag = document.createDocumentFragment();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const span = document.createElement('span');
        span.className = 'hcell';
        span.textContent = '⬡';
        const x = c * cw + (r % 2 === 0 ? 0 : cw / 2);
        const y = r * rh;
        const ci  = (r * cols + c) % 20;
        const del = ((r + c) % 8) * 0.35;
        span.style.cssText = `left:${x}px;top:${y}px;--ci:${ci};--cd:${del}s`;
        if (reduced) span.classList.add('is-reduced');
        frag.appendChild(span);
      }
    }
    container.appendChild(frag);
  };

  build();

  // Rebuild on resize (debounced)
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 260);
  }, { passive: true });
}

// ── 3. Cursor Proximity Field ────────────────────────────────────
// Hex cells near the cursor glow and pulse — subtle, never distracting.
function initCursorField() {
  let rafId = 0;
  let mx = -999, my = -999;

  window.addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const cells = document.querySelectorAll('.hcell');
      cells.forEach((cell) => {
        const r   = cell.getBoundingClientRect();
        const cx  = r.left + r.width  / 2;
        const cy  = r.top  + r.height / 2;
        const d   = Math.hypot(mx - cx, my - cy);
        const prx = Math.max(0, 1 - d / 130);

        if (prx > 0.02) {
          cell.style.setProperty('--cell-prox', prx.toFixed(3));
          cell.classList.add('is-prox');
        } else if (cell.classList.contains('is-prox')) {
          cell.style.removeProperty('--cell-prox');
          cell.classList.remove('is-prox');
        }
      });
    });
  }, { passive: true });
}

// ── 4. Particle Zones ────────────────────────────────────────────
// Each desk card is a particle zone; particles flow according to
// the zone type: marketing=converge, ai=network, va=organize.
function initParticleZones() {
  const zones = document.querySelectorAll('[data-particle-zone]');

  zones.forEach((zone) => {
    const type = zone.dataset.particleZone;
    let active   = false;
    let interval = null;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !active) {
          active = true;
          for (let i = 0; i < 6; i++) {
            setTimeout(() => emitParticle(zone, type), i * 140);
          }
          interval = setInterval(() => emitParticle(zone, type), 700);
        } else if (!e.isIntersecting && active) {
          active = false;
          clearInterval(interval);
        }
      });
    }, { threshold: 0.25 });

    io.observe(zone);
  });
}

function emitParticle(container, type) {
  const p = document.createElement('div');
  p.className = `hive-particle hive-particle--${type}`;

  // Target patterns: each zone type tells a visual story
  const patterns = {
    marketing: () => {
      // Signals scatter then converge toward a central nexus
      const edge = Math.random() > 0.5;
      return {
        sx: edge ? (Math.random() > 0.5 ? 5  : 90) : Math.random() * 90 + 5,
        sy: edge ? Math.random() * 80 + 10 : (Math.random() > 0.5 ? 5 : 90),
        tx: 48 + (Math.random() - 0.5) * 16,
        ty: 50 + (Math.random() - 0.5) * 12,
      };
    },
    ai: () => {
      // Dot-to-dot network: particles hop between fixed nodes
      const nodes = [[18,22],[50,12],[82,28],[34,68],[66,62],[50,50]];
      const from  = nodes[Math.floor(Math.random() * nodes.length)];
      const to    = nodes[Math.floor(Math.random() * nodes.length)];
      return { sx: from[0], sy: from[1], tx: to[0], ty: to[1] };
    },
    va: () => {
      // Chaos → order: particles drift from random positions to left-aligned rows
      return {
        sx: Math.random() * 80 + 10,
        sy: Math.random() * 70 + 15,
        tx: 8 + Math.random() * 25,
        ty: 22 + Math.floor(Math.random() * 4) * 18,
      };
    },
    web: () => {
      // Scattered elements snap into a structured grid layout
      const cols = [16, 50, 84];
      const rows = [22, 50, 78];
      return {
        sx: Math.random() * 80 + 10,
        sy: Math.random() * 80 + 10,
        tx: cols[Math.floor(Math.random() * cols.length)],
        ty: rows[Math.floor(Math.random() * rows.length)],
      };
    },
    default: () => ({
      sx: Math.random() * 80 + 10,
      sy: Math.random() * 80 + 10,
      tx: Math.random() * 80 + 10,
      ty: Math.random() * 80 + 10,
    }),
  };

  const { sx, sy, tx, ty } = (patterns[type] || patterns.default)();
  const dur = 1600 + Math.random() * 1400;

  p.style.cssText = `
    --sx:${sx.toFixed(1)}%;--sy:${sy.toFixed(1)}%;
    --tx:${tx.toFixed(1)}%;--ty:${ty.toFixed(1)}%;
    animation-duration:${dur}ms;
    animation-delay:${Math.random() * 200}ms;
  `;

  container.appendChild(p);
  setTimeout(() => p.remove(), dur + 350);
}

// ── 5. Section Atmospheres ───────────────────────────────────────
// Each section carries an emotional target. When it enters view,
// it activates and broadcasts the current emotion to the document.
function initSectionAtmospheres() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const wasActive = e.target.classList.contains('is-atmosphere-active');
      e.target.classList.toggle('is-atmosphere-active', e.isIntersecting);

      if (e.isIntersecting && !wasActive) {
        document.documentElement.setAttribute(
          'data-emotion',
          e.target.dataset.atmosphere || ''
        );
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('[data-atmosphere]').forEach((s) => io.observe(s));
}

// ── 6. SVG Connection Paths ──────────────────────────────────────
// Paths between sections draw themselves via stroke-dashoffset.
// After drawing, a golden dot travels the path on a loop.
function initConnectionPaths() {
  const paths = document.querySelectorAll('[data-hive-path]');

  paths.forEach((path) => {
    const len = path.getTotalLength?.();
    if (!len) return;

    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;

    const nodeId = path.dataset.hivePath;
    const trigger = document.querySelector(`[data-hive-node="${nodeId}"]`);
    if (!trigger) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        path.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1)';
        path.style.strokeDashoffset = '0';
        path.closest('svg')?.classList.add('is-drawn');
        setTimeout(() => schedulePathTraveler(path), 1700);
        io.unobserve(e.target);
      });
    }, { threshold: 0.28 });

    io.observe(trigger);
  });
}

function schedulePathTraveler(path) {
  const svg = path.closest('svg');
  if (!svg) return;

  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('r', '3.5');
  dot.setAttribute('class', 'path-traveler');

  const filterId = 'hive-glow-filter';
  dot.setAttribute('filter', `url(#${filterId})`);
  svg.appendChild(dot);

  const len   = path.getTotalLength();
  const dur   = 1800;
  let   start = null;

  const step = (ts) => {
    if (!start) start = ts;
    const t      = Math.min((ts - start) / dur, 1);
    const eased  = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const pt     = path.getPointAtLength(eased * len);
    dot.setAttribute('cx', pt.x.toFixed(2));
    dot.setAttribute('cy', pt.y.toFixed(2));
    dot.setAttribute('opacity', String(Math.sin(t * Math.PI).toFixed(3)));
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      dot.remove();
      setTimeout(() => schedulePathTraveler(path), 3200 + Math.random() * 1600);
    }
  };

  requestAnimationFrame(step);
}

// ── 7. Lana's Golden Trail ───────────────────────────────────────
// Lana leaves tiny ⬡ cells at fixed coords as she flies past.
// Each cell brightens on entry and fades to nothing.
function initLanaTrailCells() {
  const container = document.getElementById('lana-trail');
  if (!container) return;

  let lastTrail = 0;

  window.addEventListener('luli:bee-pass', (ev) => {
    const { x, y, landed } = ev.detail || {};
    if (typeof x !== 'number' || landed) return;

    const now = performance.now();
    if (now - lastTrail < 900) return;
    lastTrail = now;

    const cell = document.createElement('div');
    cell.className = 'lana-trail-cell';
    // Bee coordinates are viewport-relative (translate())
    // Offset slightly so the trail doesn't block the bee body
    cell.style.setProperty('--lx', `${(x + 6).toFixed(0)}px`);
    cell.style.setProperty('--ly', `${(y + 4).toFixed(0)}px`);
    container.appendChild(cell);

    setTimeout(() => cell.classList.add('is-fading'), 1400);
    setTimeout(() => cell.remove(), 2800);
  }, { passive: true });
}

// ── 8. Desk Transformation Sequences ────────────────────────────
// Each desk card has a micro-animation that plays on scroll entry
// illustrating the before → after transformation.
function initDeskTransforms() {
  // ── Marketing: scattered signals → coordinated growth
  watchTransform('[data-desk-transform="marketing"]', (zone) => {
    const dots = zone.querySelectorAll('.mkt-dot');
    dots.forEach((d, i) =>
      setTimeout(() => d.classList.add('is-converging'), i * 60)
    );
    const center = zone.querySelector('.mkt-center');
    if (center) setTimeout(() => center.classList.add('is-lit'), dots.length * 60 + 200);
  });

  // ── AI: disconnected nodes → intelligent network
  watchTransform('[data-desk-transform="ai"]', (zone) => {
    const nodes = zone.querySelectorAll('.ai-node');
    const lines = zone.querySelectorAll('.ai-line');
    nodes.forEach((n, i) =>
      setTimeout(() => n.classList.add('is-active'), i * 100)
    );
    lines.forEach((l, i) =>
      setTimeout(() => l.classList.add('is-drawn'), i * 80 + 320)
    );
  });

  // ── Web Design: plain layout → premium branded experience
  watchTransform('[data-desk-transform="web"]', (zone) => {
    setTimeout(() => zone.classList.add('is-designed'), 80);
  });

  // ── VA: chaos → calm, ordered system
  watchTransform('[data-desk-transform="va"]', (zone) => {
    const items = zone.querySelectorAll('.va-item');
    items.forEach((item, i) => {
      setTimeout(() => item.classList.add('is-chaotic'), i * 35);
      setTimeout(() => {
        item.classList.remove('is-chaotic');
        item.classList.add('is-ordered');
      }, i * 35 + 520);
    });
  });
}

function watchTransform(selector, callback) {
  // Watch ALL matching elements (multiple cards on same page)
  const zones = document.querySelectorAll(selector);
  if (!zones.length) return;

  zones.forEach((zone) => {
    let fired = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || fired) return;
        fired = true;
        // Mark the parent card so desk-state-tag CSS triggers
        const card = zone.closest('.glow-card, .bento-card, article');
        if (card) {
          card.classList.add('is-hive-active');
          // Add to parent section too for atmosphere CSS selectors
          const section = zone.closest('[data-atmosphere]');
          if (section) section.classList.add('is-atmosphere-active');
        }
        callback(zone);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 }); // Fire early — user just needs to see it

    io.observe(zone);
  });
}
