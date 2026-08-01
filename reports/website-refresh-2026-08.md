# Website Refresh — August 2026

_LuliDigital monthly design-engineering audit · branch `refresh/2026-08` · build passes (`npm run build`, exit 0, zero warnings)._

## Scope note — live-site review was blocked

The routine calls for reviewing the live pages at https://lulidigital.com via WebFetch. **WebFetch is blocked by this session's egress policy** — every fetch (including `example.com`) returns HTTP 403, and the proxy status endpoint records `connect_rejected … 403 to CONNECT` for `lulidigital.com:443`. Per the proxy README, a 403 policy denial must not be routed around. Because the site is a **server-rendered Astro build**, the source _is_ the substantive equivalent of what the live pages serve, so this audit is a thorough source review instead. WebSearch works and was used for the trend comparison. Every finding below cites a `file:line` or command output and is independently verifiable.

---

## Top 5 fixes (ranked by impact ÷ effort)

### 1. Site-wide social-share (OG) image is a broken 1×1 pixel — HIGH impact, LOW effort
`public/assets/imagery/working-bee-lulidigital.png` is **68 bytes — a 1×1 gray PNG** (`file` → `PNG image data, 1 x 1, 8-bit gray+alpha`). It is the default OG/Twitter image for the whole site (`src/layouts/BaseLayout.astro:30`, `resolvedOgImage`), yet `og:image:width`/`:height` are hard-declared **1200 × 630** (`BaseLayout.astro:234-235`). Only `founder.astro:32` overrides it with a real image. So the homepage, all four desk pages, `/work`, `/blog`, `/contact`, and all 11 market pages preview as a **blank/broken thumbnail** when shared on LinkedIn, WhatsApp, Slack, iMessage, X — exactly the surfaces a studio's links travel through.
**Recommendation:** produce one real 1200×630 branded OG image (cream/black/red editorial lockup) at that path; optionally add per-desk variants. Fixes ~20 pages with one asset. _(Not applied here — creating brand imagery is out of scope for the safe-quick-win pass; flagged for approval.)_

### 2. Desk pages assert fabricated "Live" real-time stats — MED-HIGH impact, LOW-MED effort
Three desk pages render a **"Live"** badge (pulsing dot) over hardcoded, specific numbers that read as genuine real-time activity:
- `src/pages/ai-desk.astro:357` badge `Live`; feed L361-366 — _"47 customer queries handled — zero human hours spent"_, _"Lead qualification workflow triggered — 12 leads scored"_, _"…answered in 0.4 seconds"_.
- `src/pages/va-desk.astro:349` badge `Live`; feed L353-357 — _"Inbox cleared — 47 emails handled this morning"_, _"Follow-up sequence sent to 5 warm leads"_.
- `src/pages/marketing-desk.astro:109` `Live` label over a hardcoded rising chart L111-135 (`--bh:38%` … `--bh:91%`) titled "Campaign Performance".

They're `aria-hidden` decorative loops, but to a sighted visitor a **"Live" label + exact counts = a truth claim**. For a studio whose brand is operational honesty, fabricated live metrics are a credibility risk.
**Recommendation:** relabel `Live` → `Illustrative` / `Sample feed`, or replace counts with clearly-generic phrasing. Copy/design decision — propose, don't auto-apply.

### 3. Brand red is fragmented into three different hexes — MED impact, LOW effort
The design token is `--wine: #7f1a1a; --red: var(--wine)` (`src/styles/global.css:9,37`), but components **bypass the token** and hardcode `#7b2d2d` in ~11 files (`SiteHeader`, `SiteFooter`, `FaqSection`, `ShowreelSection`, `founder`, `work`, `marketing-desk`, `web-design-desk`, `contact`, `motion.css`, `hive.css`). Two more off-brand reds ship live:
- `src/pages/blog/index.astro:184,232` — `#b01616` (a brighter red on the blog).
- `src/components/LocalizedStudioLanding.astro:1316` — `#b94040` (`.form-error`, renders on every market page).
- `src/layouts/MainLayout.astro:88` — `#7f1a1a` (dead file, see #5).

**Recommendation:** pick one brand red, expose it as `--brand`, and replace the hardcoded hexes with `var(--brand)`. Mechanical and low-risk, but it changes pixels, so it's a report item rather than an unattended quick win.

### 4. Heavy non-WebP raster images — MED impact (LCP + sustainability), LOW-MED effort
`public/assets/mini-fiker/` ships **11 PNGs of 210–251 KB each with no WebP sibling** (`story-phone.png` 251 KB, `story-mop.png` 233 KB, `idea.png` 231 KB, … `mop.png` 212 KB). The `fiker-avatar-pack/` PNGs are larger still (up to `thinking.png` ~1.0 MB) but already have WebP siblings served via `<picture>` in `FikerAvatar.tsx:52-56`, so those are only fallbacks. The mini-fiker set has no such optimization.
**Recommendation:** convert the 11 mini-fiker PNGs to WebP (`sharp` is already a dependency) and serve via `<picture>`. 2026 trend research repeatedly flags image weight / "digital sustainability" as a premium-vs-templated differentiator (see Trend notes). Deferred from the quick-win pass to avoid unverifiable visual regressions on binary assets.

### 5. Dead code + repo hygiene — LOW-MED impact, LOW effort
- `src/layouts/MainLayout.astro` is **unused** (`grep -rl MainLayout src/pages` → nothing). It still carries a **duplicated `IntersectionObserver` block** (lines 60-69 repeated verbatim at 70-78), a hardcoded `© 2026 LULIDIGITAL` (L47), and the placeholder title default. `src/components/WorkingBeeBlock.astro` is likewise unused and is the only other on-page consumer of the broken 1×1 image.
- Repo root contains `Lulidigital founder.png.jpeg` (142292 bytes, **double extension**) — a stray duplicate of `public/images/founder/fiker-portrait.jpg` (identical size), committed by accident in `6e746e9`. Not served, but pollutes the repo.
**Recommendation:** delete both dead files and the stray root image. Left for approval rather than auto-deleted, since they weren't created by this routine — reply "do fix 5" and I'll remove them on the branch.

---

## Other findings (below the Top 5, still verifiable)

- **Primary nav omits `/work`.** `src/components/SiteHeader.astro:4-11` lists Marketing / AI / VA / Web Design / Blog / Founder but **not the Work/portfolio page**, though the footer (`SiteFooter.astro:9`) and homepage bento both link to it. The portfolio is unreachable from the top nav.
- **Spelling/voice is mixed site-wide.** British `-ise/-isation` dominates the desk pages ("Optimise/Optimisation") while market data uses American `-ize/-ization` ("Optimization", `organiz` in all 11 market pages). "judgment" (5×) vs "judgement" (1×) across the site. Pick one convention (recommend American, since it's already the majority) and normalize. _(The single in-file outlier `va-desk.astro:188` was fixed in the quick-win pass — see below.)_
- **Low-contrast text.** `src/pages/founder.astro:294` `.f-who__list li { color: rgba(20,19,18,.28) }` (28% ink on cream) and `:336` `.f-lift__before { color: rgba(245,240,232,.22) }` on near-black — both fall below WCAG contrast until hover.
- **Heading-hierarchy skips.** `src/pages/ai-desk.astro` "All Services" section is introduced by an `.eyebrow` span (L315) with `<h4>` cards (L326) after a preceding `<h3>` — h3→h4 with no section heading. `src/pages/founder.astro` sections `.f-arc`/`.f-who`/`.f-lift` (L64/85/97) are headless landmarks (large text is `<p>`/`<span>`), so the page jumps h1→h2 skipping structure.
- **`/contact` diverges from the brand palette entirely** — full amber/honey system (`#8f5200`, `#9d6a16`, `#c87600`, `#8c340f`) with no brand red. Intentional-looking, but worth a conscious call.
- **Render-blocking web fonts.** `BaseLayout.astro:224` loads Fraunces + DM Sans from Google Fonts in `<head>` (has `display=swap` + preconnect, so acceptable) — self-hosting would remove a third-party round-trip if perf is pushed.

---

## Freshness issues

- **FIXED this run:** hardcoded `const currentYear = 2026` in the live footer (`SiteFooter.astro:2`) → now `new Date().getFullYear()`, so it never goes stale again.
- **Broken default OG image** (Top 5 #1) — a freshness/quality defect on every shared link.
- **Stray root duplicate** `Lulidigital founder.png.jpeg` (Top 5 #5).
- **Dead `MainLayout.astro`** still hardcodes `© 2026` (Top 5 #5).
- **Blog freshness is healthy** — latest published post is `why-your-ai-experiment-didnt-stick.md` (pubDate **2026-07-29**, `draft:false`), 3 days old; the index correctly filters drafts and future-dated posts and sorts newest-first (`src/pages/blog/index.astro:5-8`). No stale years, lorem, TODO, "coming soon", or dead internal links were found anywhere in source.

---

## Trend notes — current directions worth adopting (direction, not imitation)

Drawn from 2026 design-press surveys ([Elementor](https://elementor.com/blog/web-design-trends-2026/), [Fireart](https://fireart.studio/blog/the-best-web-design-trends/), [DesignMonks typography](https://www.designmonks.co/blog/typography-trends-2026), [Figma](https://www.figma.com/resource-library/web-design-trends/)):

1. **Editorial serif + kinetic/variable typography.** The 2026 consensus is a serif revival for editorial authority, with variable fonts that shift weight/width on scroll. LuliDigital already ships Fraunces (a variable serif) — it's under-used as _static_ weights. Pushing considered variable-weight scroll transitions on section titles would read as premium and is on-brand, not a redesign.
2. **"Tactile brutalism / proof of human authorship" as the anti-AI-template signal.** As AI floods the baseline with generic gradient-and-orb heroes, premium studios lean into raw geometry, real texture, and bespoke motifs to prove a human made it. LuliDigital's hive/bee motif, canvas signal-field, and honeycomb are genuinely distinctive assets — lean _further_ into that bespoke texture and _away_ from the generic hero orbs (`index.astro:48-51`), which are the one part that reads as default.
3. **Performance & digital sustainability as a differentiator.** 2026 press repeatedly frames lean JS, optimized images, and "machine experience" as what separates premium sites from templated ones. This reinforces Top 5 #4 (WebP) and suggests a performance budget for the heavy homepage runtime (canvas + GSAP + Motion).

---

## What's working — protect these, don't churn

- **The homepage is genuinely not templated.** Signal-field `<canvas>`, dual counter-scrolling marquees, honeycomb ASCII, animated typewriter, magnetic CTAs (`index.astro:47-123`). This is the studio's strongest design asset.
- **Honest homepage metrics.** The metrics strip uses qualitative claims — "24/7", "Less admin", "Clear story" (`index.astro:446-461`) — no fabricated numbers. This is the right posture; it makes the desk-page "Live" feeds (Top 5 #2) look like the outlier they are.
- **Strong SEO/meta hygiene.** Canonical URLs, full OpenGraph + Twitter scaffold, hreflang alternates, JSON-LD (WebSite/WebPage/LocalBusiness/Breadcrumb), and an intentional AI-crawler allow-list in `robots.txt` (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot). `BaseLayout.astro:211-240`.
- **Accessibility basics hold.** Every `<img>` has an `alt`; decorative images correctly use `alt=""` inside `aria-hidden`; reduced-motion is handled throughout; mobile nav is a well-built "comb" menu with aria labels.
- **Clean, warning-free build** and **all internal links resolve** (verified across pages, components, layouts).

---

## Quick wins applied on `refresh/2026-08` (build passes)

| # | File | Change |
|---|------|--------|
| 1 | `src/components/SiteFooter.astro:2` | Hardcoded `const currentYear = 2026` → `new Date().getFullYear()` — footer year self-updates. |
| 2 | `src/pages/va-desk.astro:188` | `"judgement calls"` → `"judgment calls"` — internal consistency (file already used "judgment" 2×). |

Nothing else was auto-applied: the OG image (#1), Live-stat relabel (#2), red consolidation (#3), and WebP conversion (#4) change pixels or brand assets and belong in a reviewed change; the dead-file/stray-file deletions (#5) touch files this routine didn't create, so they're offered for approval rather than removed unattended.
