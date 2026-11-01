# Website Refresh — LuliDigital — November 2026

> Monthly design + content freshness audit of lulidigital.com (Astro + Tailwind).
> Routine spec: `routines/website-refresh-routine.md`. Report generated 2026-11-01.
> Branch with safe quick wins: `refresh/2026-11`.

---

## How this audit was run

- **Build:** `npm ci && npm run build` — **passes clean**, no warnings or errors
  (37 static blog pages + SSR routes built; sitemap generated).
- **Live pages:** `https://lulidigital.com` is **outside this cloud session's
  allowed network domains** (`getaddrinfo ENOTFOUND lulidigital.com`), so it could
  not be fetched directly. As a substitute I ran the site locally (`npm run dev`)
  and reviewed the real rendered HTML for home, `/ai-desk`, `/marketing-desk`,
  `/va-desk`, `/work`, `/founder`, `/blog`, and the market pages. All returned
  HTTP 200. To review the production site directly next month, add `lulidigital.com`
  to the session's allowed network domains.
- **Source audit:** components, pages, layouts, styles, links, image assets.
- **Trend comparison:** web search against current studio/agency sites and
  late-2026 design directions (sources at the end).

The site is in good shape: clean build, exactly one `<h1>` per page, no skipped
heading levels, every internal link resolves, meta descriptions present and
well-sized on every page, thorough `<head>` (OG, Twitter, JSON-LD, hreflang,
canonical, preconnect). The findings below are refinements, not rescues.

---

## Top 5 fixes (ranked by impact ÷ effort)

### 1. `/work` shows no actual work — the biggest credibility gap · HIGH impact / HIGH effort · report-only
`src/pages/work.astro` (lines 23–61) renders a hero, a single showreel `<video>`,
and a "Start a project →" CTA. There are **no case studies, outcomes, metrics,
client names, or project tiles** — yet the page title is "Recent Selected Work"
and the homepage CTA **"View selected work →"** (`src/pages/index.astro`) points
straight here. A prospect who clicks to see proof gets a looping video and a sales
button. This is the single highest-leverage improvement on the site, and it is
exactly the principle current agency-site write-ups stress: *an agency's own site
should demonstrate the capability it sells.*
**Recommendation (needs your input — not a safe auto-fix):** add 3–6 real project
entries (problem → what the desk built → measurable result), even if anonymised
("a Munich SaaS founder", "an Amsterdam e-commerce team"). Keep the showreel as the
header, add selected-work cards below it. This is a content + layout change, so it
is proposed here rather than applied.

### 2. Footer copyright year was hardcoded · MED impact / LOW effort · ✅ APPLIED
`src/components/SiteFooter.astro:2` read `const currentYear = 2026;`. This is the
live footer on all 19 BaseLayout pages. Hardcoded, it would silently show a stale
"© 2026" from 1 January 2027 (two months away). Changed to
`const currentYear = new Date().getFullYear();` — SSR computes it per request.
Verified in the rendered output ("© 2026 LuliDigital" today) and build passes.

### 3. SVG favicon added for crisp rendering · LOW impact / LOW effort · ✅ APPLIED
`public/favicon.svg` already exists but the `<head>` referenced only
`favicon.png`. Added `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
ahead of the PNG line in `src/layouts/BaseLayout.astro` (PNG kept as fallback).
Modern browsers now render the sharp, scalable mark on hi-DPI tabs and bookmarks.

### 4. Delete the dead `MainLayout.astro` · LOW impact / LOW effort · report-only (pending approval)
`src/layouts/MainLayout.astro` is **not imported anywhere** (`grep -rn MainLayout
src/` → zero references). It carries a *second, divergent* footer —
`© 2026 LULIDIGITAL` (line 47), hardcoded year, all-caps brand, no "All Rights
Reserved" — that contradicts the live `SiteFooter`. Dead code like this rots and
misleads future edits (someone fixes the wrong footer). **Recommendation:** delete
the file. Not applied this run because deleting a file sits above the conservative
quick-win bar — say "do fix 4" and I'll remove it on the branch.

### 5. Blog post cards are invisible without JavaScript · MED impact / MED effort · report-only
In `src/pages/blog/index.astro` the post cards (`.post-card`, line 159) start at
`opacity: 0` and only become visible when an `IntersectionObserver` adds
`.is-visible` (script at lines 245–256). If JS is blocked, fails, or is slow, the
**entire post grid stays invisible** — the header animates safely via CSS
keyframes with `both` fill, but the content does not. **Recommendation:** default
the cards to visible and layer the reveal on top (e.g. a `.js` gate on `<html>`, or
set the visible state as the base and only animate when
`(prefers-reduced-motion: no-preference)`). Low-risk but touches the reveal
pattern, so proposed rather than auto-applied.

---

## Freshness issues

- **Copyright year** — hardcoded `2026` in the live footer. **Fixed** (Top 5 #2).
  A second hardcoded `2026` lives in the dead `MainLayout.astro` (Top 5 #4).
- **Blog is current and correctly surfaced** — `src/pages/blog/index.astro`
  filters drafts and future-dated posts, sorts newest-first, and renders a featured
  post + grid. Latest live post is dated **2026-10-30** (today is 2026-11-01), so
  the index is fresh. No action needed.
- **No stale claims found** — no "since 20xx", "founded in", or "N years of
  experience" copy anywhere in source; no leftover 2024/2025 references in content.
- **No dead links** — all 56 internal links across the audited pages resolve to
  real routes or existing blog slugs; favicon and asset references serve 200.
- **Not a site defect:** the dev log showed `SEO agent keyword research failed …
  ENOTFOUND trends.google.com`. That host is simply outside this sandbox's network
  allow-list; the SEO agent falls back gracefully and every page still renders 200.
  On Vercel this call works. No change required.

---

## Trend notes — current directions worth adopting (direction, not imitation)

1. **Type as the hero, with restraint ("bold minimalism").** Current studio sites
   pair clean, uncluttered layouts with oversized, confident type and *selective*
   bursts of colour/motion. LuliDigital already lives here — warm cream, Fraunces
   display serif, black/red accents, strong statement headlines. **Keep it.** The
   adjacent move is *subtle kinetic typography* on one or two hero lines (a single
   animated word on load), used once, not everywhere.
2. **Proof as the design.** The strongest agency sites make their own work the
   centrepiece — case studies with real outcomes, not a reel. This is the direction
   behind Top 5 #1: the gap isn't aesthetic, it's evidential.
3. **Personality as a differentiator.** Roundups note most agency sites hide the
   team; the ones that stand out lead with it. LuliDigital's Fiker avatar system and
   `/founder` page already do this well — an underused edge that's worth leaning
   into on `/work` and service pages (a named human next to each desk's promise).

---

## What's working — protect these, don't churn

- **Clean build, clean semantics.** One `<h1>` per page, no skipped heading levels,
  meta descriptions everywhere, exhaustive structured data (Organization, Service,
  LocalBusiness, Blog JSON-LD), hreflang + canonical on market pages.
- **Images are already optimised.** `FikerAvatar.tsx` serves WebP (28–136 KB) via
  `<picture>` with a PNG fallback; no page references the heavy source PNGs
  (639 KB–1 MB) directly. This is done right — leave it.
- **Editorial, statement-led copy.** "The studio that runs your business.",
  "AI automation that does the work, not just the talking.", "You lead. Your virtual
  assistant handles the rest." Confident, specific, on-voice. The question-form H2s
  ("What founders ask before a campaign starts") are FAQ headers — legitimately
  questions, not filler. Don't flatten them.
- **Market pages are properly engineered** — shared `LocalizedStudioLanding` with
  per-market SEO schema, hreflang alternates, and localised copy.
- **Blog index freshness logic** — draft + future-date filtering and newest-first
  sort. Robust; only the no-JS reveal (Top 5 #5) needs hardening.

---

## In the PR branch `refresh/2026-11`

Two safe quick wins, build verified (`npm run build` passes):

| File | Change |
|---|---|
| `src/components/SiteFooter.astro` | Footer year `2026` → `new Date().getFullYear()` (auto-updates) |
| `src/layouts/BaseLayout.astro` | Added crisp `favicon.svg` as primary icon, PNG kept as fallback |

Nothing else was modified. No layout, branding, content-collection, workflow, or
redesign changes. Hard rules respected: not pushed to main; `src/content/blog/`,
`social/`, `.github/workflows/`, and `scripts/lana-memory.json` untouched.

---

## Sources (trend comparison)
- Awwwards — Design Agencies: https://www.awwwards.com/inspiration_search/design-agencies/
- KrishaWeb — Best Creative Agency Website Designs 2026: https://www.krishaweb.com/blog/best-creative-agency-websites/
- Line25 — Web Design Trends 2026: https://line25.com/articles/web-design-trends-2026/
- Figma — Web design trends: https://www.figma.com/resource-library/web-design-trends/
