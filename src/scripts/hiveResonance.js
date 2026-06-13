/**
 * LuliDigital — Hive Resonance System
 * ------------------------------------------------------------------
 * A premium tactile interaction layer. The hive senses the visitor's
 * presence: cells *anticipate* the cursor before hover, surface tension
 * propagates microscopically to neighbours, energy ripples travel like a
 * disturbance on water, the honey data stream + Lana acknowledge the
 * pointer, and supported phones get a single, restrained haptic tap on
 * meaningful actions only.
 *
 * Principles:
 *  - Transform/opacity-only (GPU). No layout thrash in the hot loop.
 *  - Spatially indexed cells → per-frame work stays local to the cursor.
 *  - rAF idles when nothing is moving (battery-safe).
 *  - Effects so subtle the visitor never *notices* them — only feels them.
 *  - Reduced-motion and touch safe.
 */

export function initHiveResonance() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // Haptics belong to touch devices; bind regardless of pointer type.
  initHaptics();

  // The pointer-driven field is for fine pointers only (mouse / trackpad),
  // and never runs under reduced-motion.
  if (reduced || !finePointer) return;

  initResonanceField();
}

/* ── Mobile haptics ──────────────────────────────────────────────
 * One short pulse, on deliberate + important interactions only:
 * opening a Desk, a primary CTA, landing on a major hive node.
 * Never repetitive. */
function initHaptics() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;

  const tap = () => {
    try { navigator.vibrate(8); } catch (_) { /* no-op */ }
  };

  const SELECTOR = [
    'a[href$="-desk"]',     // opening any Desk
    '.pill--filled',        // primary CTA
    '[data-haptic]',        // explicit opt-in (major hive nodes)
  ].join(', ');

  document.querySelectorAll(SELECTOR).forEach((el) => {
    // `click` fires once per activation — inherently non-repetitive.
    el.addEventListener('click', tap, { passive: true });
  });

  // The bee landing on the final node is a "major hive node" moment.
  let lastBeeTap = 0;
  window.addEventListener('luli:bee-pass', (ev) => {
    const detail = ev.detail || {};
    if (!detail.landed) return;
    const now = performance.now();
    if (now - lastBeeTap < 4000) return;
    lastBeeTap = now;
    tap();
  }, { passive: true });
}

/* ── Resonance field ─────────────────────────────────────────────
 * Anticipation + surface tension + energy ripples over the ambient
 * hex grid, plus honey-stream / Lana acknowledgement. */
function initResonanceField() {
  const grid = document.getElementById('hive-ambient-grid');
  if (!grid) return;

  // Tunables — restrained on purpose.
  const PROX_R       = 150;   // anticipation radius (px) — reacts before hover
  const RIPPLE_MAX_R = 132;   // how far a ripple travels
  const RIPPLE_BAND  = 28;    // ripple ring thickness
  const RIPPLE_LIFE  = 850;   // ripple lifespan (ms)
  const RIPPLE_GAP   = 520;   // min ms between ripples
  const SPEED_TRIG   = 0.55;  // px/ms flick speed that births a ripple
  const BUCKET       = 80;    // spatial-hash bucket size (px)
  const IDLE_AFTER   = 700;   // ms of stillness before the loop sleeps
  const LANA_R       = 92;    // cursor↔Lana proximity for sparks (px)
  const LANA_GAP     = 720;   // min ms between Lana spark bursts

  let index = null;           // { buckets:Map, BUCKET }
  const active = new Set();    // cells lit last frame (for cheap clearing)
  const ripples = [];          // { x, y, t0 }

  // Pointer state
  let px = -9999, py = -9999;
  let lastPx = px, lastPy = py, lastMoveT = 0, lastRippleT = 0;
  let pointerSeen = false;

  // Lana state (viewport coords, broadcast by the bee guide)
  let beeX = -9999, beeY = -9999, beeLanded = true, lastSparkT = 0;

  // Stream / connection-line targets (small, cached set)
  let streamEls = [];
  let lastStreamT = 0;

  let running = false;
  let rafId = 0;

  // ── Spatial index: read cell centres once (single batched layout) ──
  function buildIndex() {
    const cells = grid.querySelectorAll('.hcell');
    if (!cells.length) { index = null; return; }
    const buckets = new Map();
    cells.forEach((el) => {
      // #hive-ambient-grid is position:fixed inset:0 → offset == viewport.
      const x = el.offsetLeft + el.offsetWidth / 2;
      const y = el.offsetTop + el.offsetHeight / 2;
      const item = { el, x, y };
      const key = (x / BUCKET | 0) + ':' + (y / BUCKET | 0);
      let arr = buckets.get(key);
      if (!arr) buckets.set(key, (arr = []));
      arr.push(item);
    });
    index = { buckets };
  }

  function refreshStreamEls() {
    streamEls = [
      ...document.querySelectorAll('[data-hive-path]'),
      ...document.querySelectorAll('.signal-node'),
    ];
  }

  buildIndex();
  refreshStreamEls();

  // The ambient grid rebuilds ~260ms after resize (hive.js); re-index after.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    index = null; // pause field until cells are rebuilt
    resizeTimer = window.setTimeout(() => {
      buildIndex();
      refreshStreamEls();
    }, 360);
  }, { passive: true });

  // ── Pointer tracking ──────────────────────────────────────────
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const now = e.timeStamp || performance.now();
    const dt = now - lastMoveT;
    if (dt > 0 && pointerSeen) {
      const speed = Math.hypot(e.clientX - lastPx, e.clientY - lastPy) / dt;
      if (speed > SPEED_TRIG && now - lastRippleT > RIPPLE_GAP && ripples.length < 2) {
        ripples.push({ x: e.clientX, y: e.clientY, t0: now });
        lastRippleT = now;
      }
    }
    px = e.clientX; py = e.clientY;
    lastPx = px; lastPy = py; lastMoveT = now;
    pointerSeen = true;
    wake();
  }, { passive: true });

  // Lana's position, broadcast by the flying bee guide.
  window.addEventListener('luli:bee-pass', (ev) => {
    const d = ev.detail || {};
    if (typeof d.x === 'number') { beeX = d.x; beeY = d.y; beeLanded = !!d.landed; }
  }, { passive: true });

  // ── Lifecycle ─────────────────────────────────────────────────
  function wake() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(tick);
  }

  function clearCell(item) {
    item.el.style.removeProperty('--cell-prox');
    item.el.style.removeProperty('--cell-ripple');
    item.el.classList.remove('is-prox');
  }

  // ── Frame ─────────────────────────────────────────────────────
  function tick(now) {
    const next = new Set();

    if (index) {
      // Radius covering both the proximity halo and any live ripple.
      const reach = Math.max(PROX_R, RIPPLE_MAX_R) + RIPPLE_BAND;
      const minbx = (px - reach) / BUCKET | 0, maxbx = (px + reach) / BUCKET | 0;
      const minby = (py - reach) / BUCKET | 0, maxby = (py + reach) / BUCKET | 0;

      for (let bx = minbx; bx <= maxbx; bx++) {
        for (let by = minby; by <= maxby; by++) {
          const arr = index.buckets.get(bx + ':' + by);
          if (!arr) continue;

          for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            const d = Math.hypot(item.x - px, item.y - py);

            // Anticipation + surface tension: quadratic falloff concentrates
            // response near the cursor; outer cells get the microscopic edge.
            let prox = 0;
            if (d < PROX_R) {
              const t = 1 - d / PROX_R;
              prox = t * t;
            }

            // Energy ripple: a travelling annulus, fading with age.
            let rip = 0;
            for (let r = 0; r < ripples.length; r++) {
              const age = now - ripples[r].t0;
              if (age < 0 || age > RIPPLE_LIFE) continue;
              const rd = Math.hypot(item.x - ripples[r].x, item.y - ripples[r].y);
              const front = (age / RIPPLE_LIFE) * RIPPLE_MAX_R;
              const band = Math.abs(rd - front);
              if (band < RIPPLE_BAND) {
                const decay = 1 - age / RIPPLE_LIFE;
                rip += (1 - band / RIPPLE_BAND) * decay;
              }
            }
            if (rip > 1) rip = 1;

            if (prox > 0.012 || rip > 0.012) {
              const el = item.el;
              el.style.setProperty('--cell-prox', prox.toFixed(3));
              el.style.setProperty('--cell-ripple', rip.toFixed(3));
              el.classList.add('is-prox');
              next.add(item);
            }
          }
        }
      }
    }

    // Clear cells that were lit last frame but not this one.
    active.forEach((item) => { if (!next.has(item)) clearCell(item); });
    active.clear();
    next.forEach((item) => active.add(item));

    // Retire expired ripples.
    for (let r = ripples.length - 1; r >= 0; r--) {
      if (now - ripples[r].t0 > RIPPLE_LIFE) ripples.splice(r, 1);
    }

    // Honey data stream + connection lines: gently acknowledge the cursor.
    if (now - lastStreamT > 110) {
      lastStreamT = now;
      for (let i = 0; i < streamEls.length; i++) {
        const el = streamEls[i];
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight || rect.width === 0) {
          el.classList.remove('is-resonant');
          continue;
        }
        const near =
          px > rect.left - 60 && px < rect.right + 60 &&
          py > rect.top - 60 && py < rect.bottom + 60;
        el.classList.toggle('is-resonant', near);
      }
    }

    // Lana acknowledgement: cursor crosses her flight path → tiny sparks.
    if (!beeLanded && now - lastSparkT > LANA_GAP &&
        Math.hypot(px - beeX, py - beeY) < LANA_R) {
      lastSparkT = now;
      emitLanaSparks(beeX, beeY);
    }

    const idle = now - lastMoveT > IDLE_AFTER;
    if (idle && active.size === 0 && ripples.length === 0) {
      running = false; // sleep until the next pointer move
      return;
    }
    rafId = requestAnimationFrame(tick);
  }
}

/* ── Lana sparks ─────────────────────────────────────────────────
 * A short burst of golden motes near the bee, dropped into the
 * existing #lana-trail layer. Self-cleaning, never blocking. */
function emitLanaSparks(x, y) {
  const trail = document.getElementById('lana-trail');
  if (!trail) return;
  const count = 3;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'lana-spark';
    const jx = (Math.random() - 0.5) * 18;
    const jy = (Math.random() - 0.5) * 14;
    const dx = (Math.random() - 0.5) * 22;
    const dy = -10 - Math.random() * 16;
    s.style.cssText =
      `--sx:${(x + jx).toFixed(0)}px;--sy:${(y + jy).toFixed(0)}px;` +
      `--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;` +
      `animation-delay:${(i * 60)}ms`;
    trail.appendChild(s);
    window.setTimeout(() => s.remove(), 1100 + i * 60);
  }
}
