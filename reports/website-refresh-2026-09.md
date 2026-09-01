# Website Refresh — September 2026

_LuliDigital monthly design-engineering audit • run 2026-09-01 • auditor: Claude (Website Refresh routine)_

**Scope:** Astro + Tailwind source, local production build, and design-standard
comparison against current studio/agency sites. Every claim below carries a file
reference or source URL.

> **Note on method:** The live site (`https://lulidigital.com`) is blocked by this
> environment's egress policy, so I could not WebFetch the rendered pages. Instead I
> audited the **local production build** (`npm ci && npm run build`, exit 0, no
> warnings) and the source directly — the same code the live site serves. Everything
> below is verifiable in-repo.

---

## Build health

- `npm ci` → clean, exit 0.
- `npm run build` → **exit 0, no warnings/errors**, 35 blog routes + service/market
  pages prerendered, sitemap generated.
- ⚠️ `package.json` `engines.node` = `24.x`; this run used Node **v22.22.2**. Build
  passed anyway, but Vercel/CI pinned to 24 vs. local 22 is a drift worth aligning
  (`package.json:5`).
- All internal links resolve — every `href="/…"` maps to an existing route in
  `src/pages/` (checked home, all four desks, `/work`, `/blog`, `/founder`,
  `/contact`, footer, header).
- Contact details consistent site-wide: `info@lulidigital.com`, `+27 60 255 1513`
  (27× / 22× references, no mismatches).

---

## Top 5 fixes (ranked by impact ÷ effort)

### 1. [HIGH impact / LOW effort] The default social-share image is a blank 1×1 pixel
`public/assets/imagery/working-bee-lulidigital.png` is **68 bytes — a 1×1 transparent
PNG** (`file` reports `PNG image data, 1 x 1, 8-bit gray+alpha`). That file is the
site-wide Open Graph / Twitter fallback image (`src/layouts/BaseLayout.astro:31-33`).
Only **two** pages override it — `/founder` (`founder.astro:32`) and `/hello`
(`hello.astro:40`). **Every other page** — the homepage, `/work`, `/blog`, all four
desks, all nine market pages, `/contact`, and all 35 blog articles — ships a blank
image in its link preview.

For a studio that sells marketing, blank preview cards on LinkedIn / X / WhatsApp /
Slack are a direct credibility cost. **Recommendation:** produce a real **1200×630**
branded OG card (the `og:image:width/height` meta already declares those dimensions —
`BaseLayout.astro:237-238`) and repoint the fallback at it. A valid 400×400 logo
already exists at `public/favicon.png` if an interim square card is acceptable, but a
purpose-built editorial 1200×630 card is the right fix. _Not auto-applied — this is a
brand-asset decision for Fiker (see reply options)._

### 2. [HIGH / MEDIUM] `/work` has no actual work on it
`src/pages/work.astro` is a hero + a single showreel `<video>` + a CTA (lines 23-59).
No named engagements, no case studies, no outcomes, no metrics, no dates. The page
title promises "Recent Selected Work" but shows one undated video. This is the
weakest proof-point on the site and the page a prospect visits to decide.
**Recommendation:** add 2–3 real case studies (client/context → what was built →
measurable outcome). This is content + light layout work, so it's a report proposal,
not a quick win.

### 3. [MEDIUM / LOW] Footer copyright year was hardcoded — **fixed in this branch**
`src/components/SiteFooter.astro:2` had `const currentYear = 2026;`. Correct today,
silently stale every January. Changed to `new Date().getFullYear()`. Renders
identically now; self-corrects going forward. ✅ Applied.

### 4. [MEDIUM / MEDIUM] Avatar PNG payload bloats the deploy
The Fiker avatar pack ships **18 PNGs at 650 KB–1.04 MB each (~15 MB total)** in
`public/assets/fiker-avatar-pack/` (e.g. `thinking.png` = 1,039,271 bytes). The good
news: `FikerAvatar.tsx` already serves the ~20 KB WebP via `<picture>` with the PNG
only as a legacy fallback (`FikerAvatar.tsx:51-63`) — so **modern-browser page weight
is already fine** (this is a "what's working" win, below). The cost is deploy/repo
size and any bandwidth spent serving 1 MB fallbacks to the rare non-WebP client.
**Recommendation:** the README notes these full-res PNGs are kept for social/video
use — move that set to a separate asset store (or a `raw/` dir excluded from the web
build) and ship only WebP to `public/`, trimming ~15 MB from every deploy. Keep every
pose and the WebP set exactly as-is.

### 5. [LOW-MEDIUM / LOW] Dead component + placeholder asset
`src/components/WorkingBeeBlock.astro` is **imported nowhere** (grep across `src/`).
It renders the same 1×1 placeholder from fix #1. Either wire it into a page with a
real image or delete both the component and the placeholder to remove the loose end.
Left untouched this run (removal touches a component; flagging for direction).

---

## Freshness

- ✅ **Blog is excellent and current.** 35 posts; index correctly filters drafts and
  future-dated posts and sorts newest-first (`src/pages/blog/index.astro:5-8`); latest
  post `2026-08-31` (yesterday). No stale dates, no dead links.
- ⚠️ **`/work` reads as stale by omission** — one undated showreel, no dated projects
  (see fix #2).
- ⚠️ **Default OG image broken** (see fix #1) — a freshness/credibility defect on
  every share.
- ✅ Contact details, nav, and footer links all current and resolving.

---

## Trend notes — 2026 directions worth a light touch (not a redesign)

Grounded in current write-ups of 2026 studio/editorial design:

1. **Kinetic / variable typography** — type that maps weight or width to scroll or
   hover is the defining 2026 editorial move
   ([envato](https://elements.envato.com/learn/web-design-trends),
   [designmonks](https://www.designmonks.co/blog/typography-trends-2026)). LuliDigital
   already loads the **variable** Fraunces face and runs a hero typewriter cycle
   (`index.astro:56-62`) — it's 80% of the way there. A restrained scroll-linked weight
   shift on the hero H1 would land the trend without a redesign.
2. **Editorial serif resurgence + "brand-owned character over interchangeable
   polish"** ([fireart](https://fireart.studio/blog/the-best-web-design-trends/),
   [AND Academy](https://www.andacademy.com/resources/blog/graphic-design/typography-trends/)).
   The cream / black / editorial-red palette and the bee/honeycomb motif already give
   the site distinct character — **protect this**, don't sand it down.
3. **Fuller color systems, layered depth, selective texture** (same sources). The site
   leans clean-editorial; there's room for *selective* depth (subtle layering on the
   bento/desk cards) but resist adding generic gradients — the current restraint is an
   asset.

Sources: [Envato — 2026 web design trends](https://elements.envato.com/learn/web-design-trends),
[DesignMonks — Typography Trends 2026](https://www.designmonks.co/blog/typography-trends-2026),
[Fireart — Best Web Design Trends](https://fireart.studio/blog/the-best-web-design-trends/),
[AND Academy — Typography Trends](https://www.andacademy.com/resources/blog/graphic-design/typography-trends/),
[Awwwards — Design agency sites](https://www.awwwards.com/websites/design-agencies/).

---

## What's working — protect these, don't churn

- **Bespoke, high-craft homepage.** Typewriter cycling, `data-blur-in` / `data-stagger`
  reveals, `data-tilt` cards, magnetic buttons, honeycomb motif (`index.astro`). This
  is not an AI-default template — it earns its motion. Meets standard #1 and #4.
- **Typography as design.** Variable Fraunces + DM Sans, fluid `clamp()` scale, clean
  H1→H3 hierarchy, editorial red accent (`BaseLayout.astro:227`, `blog/index.astro`).
  Meets standard #2.
- **Correct responsive images for avatars.** `<picture>` WebP + PNG fallback, `loading="lazy"`,
  `decoding="async"` (`FikerAvatar.tsx:51-63`). Meets standard #7.
- **Serious SEO/schema layer.** Organization + Service + Breadcrumb JSON-LD, canonical,
  hreflang, OG/Twitter scaffolding (`BaseLayout.astro:38-244`).
- **Blog engineering.** Draft + future-date filtering, newest-first sort, featured +
  grid, `IntersectionObserver` reveals (`blog/index.astro`).
- **Editorial copy.** Statements over questions, specifics over filler
  ("Marketing feeds the machine. The VA runs it. AI scales it." — `index.astro:309`).
  Meets standard #5.
- **Clean build, resolving links, consistent contact info.**

---

## What's in the PR branch `refresh/2026-09`

- `src/components/SiteFooter.astro` — dynamic copyright year (fix #3).
- `reports/website-refresh-2026-09.md` — this report.

Build re-verified green after the change. Nothing else applied — fixes #1, #2, #4, #5
are proposals awaiting Fiker's direction.
