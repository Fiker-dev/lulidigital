# Website Refresh — 2026-10

_Monthly design-engineering audit of lulidigital.com (Astro + Tailwind)._
_Run date: 2026-10-01. Branch: `refresh/2026-10`._

## How this run was done
- **Build:** `npm ci && npm run build` — **passes clean**, no warnings or errors
  (Astro 6, Vercel adapter, 29 blog routes + contact prerendered). Note: the repo
  pins `engines.node: "24.x"` / `.nvmrc 24`, but this environment runs Node 22.22.
  The build still succeeds; flagging only so local/CI parity stays intentional.
- **Live-site review (WebFetch):** **could not be completed this run** — the
  environment's network egress policy blocked `lulidigital.com` (all pages). The
  audit below is therefore sourced from the repo (the deploy source of truth) and
  from built output, not from the rendered production pages. To restore live
  review next month, allow `lulidigital.com` in the environment's Network access
  settings (cloud environment menu → Edit). Every finding below is cited to a
  file/line so it is verifiable without the live site.
- **Source audit:** components, pages, styles, data, layouts.
- **Benchmarks:** current studio/agency work (By-Kin, Westerly Creative, AKQA,
  Typewolf's 2026 studio list) + 2026 trend reports (Figma, Lounge Lizard).

---

## Top 5 fixes (ranked by impact / effort)

### 1. The default social-share image is a blank 1×1 pixel — HIGH impact
`public/assets/imagery/working-bee-lulidigital.png` is a **68-byte, 1×1
transparent PNG** (verified: `PNG image data, 1 x 1, 8-bit gray+alpha`).
`src/layouts/BaseLayout.astro:34` uses it as the site-wide `og:image` fallback,
and declares it as `1200×630` (`BaseLayout.astro:241-242`). Any page that does
not set its own `ogImage` — **including the homepage** — shares a blank image on
LinkedIn, X, WhatsApp, iMessage, Slack. For a studio whose go-to-market is
social (per `routines/brand/social-brand-system.md`), this is the single highest-
leverage defect on the site.
**Recommendation:** produce a real 1200×630 OG card (honey brand, wordmark, one
line) and replace the placeholder; optionally give the homepage its own
`ogImage`. _Not auto-applied — needs a real design asset, outside this routine's
"no new design" scope._

### 2. Two competing brand palettes ship at once — honey vs. maroon
`src/styles/theme.css:17` defines `--brand: #b66d00` (deep honey), and the whole
documented palette is honey/amber. But **104 lines across 16 files** hardcode a
legacy **maroon** (`rgba(123,45,45,…)`, `#7b2d2d`, `#6a2828`) that never
references the token. Because the honey value only reaches elements that read
`var(--brand)`, the two palettes render side by side. Most visible example:
`src/pages/index.astro:598-599` — the primary hero CTA is **honey at rest and
flips to maroon `#6a2828` on hover**, over a maroon drop-shadow
(`rgba(123,45,45,.35)`). The blog introduces a *third* red, `#b01616`
(`src/pages/blog/index.astro`, category labels + "Read" links).
Heaviest offenders: `src/styles/motion.css` (20), `src/pages/index.astro` (17),
`SiteHeader.astro` (11), `marketing-desk.astro` (14), `web-design-desk.astro`
(14), `founder.astro` (10).
**Recommendation:** pick one brand direction (the honey system is the
documented one and the stronger story — see Trends), then migrate the maroon
literals to tokens (`--brand`, `--honey-dark #6b3b00`, `--wine-strong #7a4300`,
all already defined) and point `#b01616` at `--brand`. _Report-only: this is a
palette decision + multi-file migration, not a quick win — it would change the
visible look and should be done deliberately, in one pass, not piecemeal._

### 3. An unvetted live Google-Trends keyword is published into structured data
`src/pages/amsterdam.astro:16-18` and `src/pages/munich.astro:15-18` prepend
`seoRecommendation.keyword` as the **first** entry of the JSON-LD
`serviceSchema.serviceType`. That keyword comes from
`getDailySeoRecommendation()` → live `trends.google.com` RSS
(`src/lib/seoAgent.js`), filtered by a loose relevance check that needs only one
service-signal word and whose `geoSignals` list includes terms like "nigeria",
"lagos", "kenya". So a machine-picked trending phrase can be emitted **daily, to
crawlers, with no human review**, as a claim about what the business does — the
clearest fabricated/off-brand-claim path on the site, and it conflicts with the
brand rule against invented claims and the "no South/other-market positioning"
guidance. It is schema-only (not visible body copy), which caps the severity.
**Recommendation:** gate the injected keyword behind an allow-list or a human-
approved set, or drop it from `serviceType` entirely and keep live keywords to
`meta keywords`/internal SEO only. _Report-only: logic change, needs your call on
the SEO agent's behaviour._

### 4. Ten market pages are near-duplicate templated output
All 10 market pages (`amsterdam`, `munich`, `stockholm`, `united-states`,
`united-kingdom`, `denmark`, `switzerland`, `ireland`, `belgium`, `norway`) are a
~34-line wrapper over one component (`src/components/LocalizedStudioLanding.astro`
+ `src/data/localizedMarkets.ts`). `amsterdam.astro` and `munich.astro` are
byte-for-byte identical but for the market key, geo code, and canonical path. The
hero "working principles" list (`LocalizedStudioLanding.astro:23-26`) and the
entire "delivery commitments" block (`:103-114`) are **word-for-word identical on
all 10 pages**, and each market's `localContext.points` is rendered **twice on
the same page** (`:33-39` and `:90-92`). Only `munich` gets an extra timeline and
only `stockholm` gets a colour accent; the other 8 are structurally
indistinguishable. `src/data/marketLocalContext.ts` carries the only genuinely
unique prose. Dead data fields in the shape: `secondaryCta` and `intro` are never
rendered. This reads as templated to a careful visitor and risks search-engine
dedup.
**Recommendation:** differentiate the hero reassurance + commitments per market
(or cut them to one shared section that doesn't pretend to be local), remove the
duplicated `points` render, and delete the dead `secondaryCta`/`intro` fields.
_Report-only: content + component work._

### 5. The `/work` proof page is thin, and two mockups invent specifics
Every page funnels to `/work` ("See recent work →"), but `src/pages/work.astro`
contains **only an autoplaying showreel video + a CTA** — no case studies, no
project names, no outcomes. The payoff for the whole site's strongest internal
CTA is a single reel. Separately, the `va-desk` hero task board
(`src/pages/va-desk.astro:102`) shows invented specifics dressed as live
operations — **"Inbox cleared — 47 emails", "3 exec calls scheduled", "Q3 brief
sent to team"** — and "Q3" will read as dated. These are `aria-hidden` decorative
mockups (so not headline stats), but they're the closest the site comes to
breaking the "no fabricated metrics" rule. Good contrast: the `marketing-desk`
mockups deliberately avoid fake numbers ("Offer / clearer", not "+37%") — that is
the brand-safe pattern to copy.
**Recommendation:** add 2–3 real (even anonymised) case cards to `/work`; swap the
va-desk board's invented counts for category labels like marketing-desk already
does. _Report-only: needs real content from you._

---

## Freshness issues
- **Broken default OG image** (Top-5 #1) — stale/blank social previews now.
- **Footer year was hardcoded** `const currentYear = 2026`
  (`src/components/SiteFooter.astro:2`) — would have shown "© 2026" through all of
  2027. **Fixed on this branch** → `new Date().getFullYear()`.
- **Homepage desk-status strip is out of date** (`src/pages/index.astro:147-163`):
  it lists 3 desks (Marketing "active", AI "building", VA "running") but the site
  now has **4** desks everywhere else — the bento grid (`:277-302`), header nav,
  and footer all include the **Web Design Desk**, which the strip omits. The strip
  also still labels **AI Desk "building"** although it ships as a full service with
  its own page. Update the strip to match (needs the real current status of each
  desk — not guessed here).
- **`va-desk` "Q3 brief"** (`src/pages/va-desk.astro:102`) hardcodes a quarter.
- **Dead `MainLayout.astro`** (`src/layouts/MainLayout.astro`) is unused by any
  page (every page uses `BaseLayout`), and still carries a hardcoded
  "© 2026 LULIDIGITAL" and a stale 4-item nav (no Web Design / Blog / Founder).
  Safe to delete; left in place this run to keep the quick-win diff minimal.
- **Blog freshness is healthy:** 33 posts, newest `2026-09-22` (9 days old),
  correctly sorted newest-first with drafts and future-dated posts filtered
  (`src/pages/blog/index.astro:5-8`); all posts carry `readingTime`.
- **No dead internal links** — every `href="/…"` across the site resolves to a
  real page (incl. all 10 market routes and `regionalAlternates`).

---

## Trend notes (direction, not imitation)
1. **Warm "unbleached" paper palettes are the 2026 default** — studios are
   dropping pure white for sand/limestone/cream to cut eye strain and feel human
   (Figma, Lounge Lizard 2026 reports; Westerly Creative, Golden Launch). **This
   is already LuliDigital's strongest asset** (`--paper #fff7df` honey cream). It
   is a reason to **resolve Top-5 #2 toward the honey system** rather than the
   maroon — the honey palette *is* the on-trend move; the stray maroon is what
   dates it. Protect the cream, commit to the honey.
2. **Kinetic / variable-font headlines** — animated emphasis on key phrases and
   hero headlines that move (By-Kin, Mat Voyce, Typewolf 2026). LuliDigital's
   cycling typewriter hero (`index.astro:56-62`) is on-trend; worth extending the
   same considered motion to one or two section headings rather than adding more
   ambient ornament.
3. **"Less is more" micro-interaction restraint** — 2026 best-in-class use subtle,
   feedback-driven motion matched to tone (AKQA's restraint is the reference).
   LuliDigital runs heavy ambient motion (flying bee guide + Web-Audio buzz, hive
   grid, honey-drip, tilt/glow on every card). It is distinctive — but it is the
   one place the site risks reading busier than the current premium-restraint
   benchmark. Worth a deliberate audit of what to keep vs. calm (the bee and
   honey identity are the brand; the buzz audio and per-card tilt are the
   candidates to dial back). Direction only — not a redesign ask.

---

## What's working — protect these, don't churn
- **Copy is genuinely editorial** — no lorem, no "coming soon", no TODO, no
  fabricated client names or testimonials anywhere. Voice matches the founder
  brand system.
- **Honey/cream editorial identity** is distinctive and on-trend (see Trends #1).
  Do not flatten it into a generic AI-default look.
- **Build is clean**; reduced-motion is handled thoroughly across components;
  the founder portrait is done right (descriptive `alt`, explicit dimensions,
  `loading="eager"` + `fetchpriority="high"`).
- **Blog desk** structure (featured + grid, correct sorting/filtering, reading
  time) is solid.
- **Marketing-desk mockups avoid fake numbers** — keep that as the house pattern.

---

## Cleanup backlog (low priority, safe later)
- Unused `*Marquee` constants in `ai-desk`/`marketing-desk`/`va-desk`/
  `web-design-desk` and `marqueeItems`/`marqueeItems2` in `index.astro` — defined,
  never rendered; plus orphaned `.marquee-item` CSS.
- `--font-serif` is read (`src/styles/global.css:635`, `theme.css:228`) but never
  defined; both consumers (`.desk-stamp`, `.delegatable-line`) are themselves
  unused, so no live impact — define the token or delete the dead rules.
- Market-page fallback contact text is low-contrast (`rgba(20,19,18,.42)` /
  `.58` on cream, `LocalizedStudioLanding.astro:675-685`) — real contact info near
  the WCAG floor; darken it.
- Stray unreferenced file in repo root: `Lulidigital founder.png.jpeg` (142 KB).
- Fiker avatar PNGs are large (0.7–1.0 MB each, `public/assets/fiker-avatar-pack/`);
  the pack already ships `.webp` variants — ensure components reference the `.webp`
  (the blog host avatar already does) and drop/defer the heavy PNGs where unused.

---

## Applied on `refresh/2026-10` (safe quick wins only — build passes)
1. **Footer copyright year is now dynamic** — `src/components/SiteFooter.astro`:
   `const currentYear = 2026` → `new Date().getFullYear()`. Prevents the "© 2026"
   stale-date defect in 2027; no visual change today.
2. **A11y: decorative service-card icons marked `aria-hidden`** — `ai-desk.astro`
   (3), `marketing-desk.astro` (6), `web-design-desk.astro` (6) now match the
   pattern `va-desk.astro` already uses (`<div class="svc-icon" aria-hidden="true">`).
   Hides purely decorative SVGs from screen readers; no visual change.

Nothing else was changed. Every larger fix above is left as a proposal for you to
approve.
