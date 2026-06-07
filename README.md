# LuliDigital Website

Astro site for `lulidigital.com`, deployed on Vercel.

## Commands

```sh
npm install
npm run dev
npm run build
npm run preview
```

## SEO Agent

The site uses a small SEO agent in two cadences:

- Daily market pulse: regional landing pages research Google Trends every morning and render selected keywords server-side for crawlers.
- Weekly page optimization: every Monday morning, the site refreshes the page-level keyword plan for the home, service, Africa, South Africa, Amsterdam, Munich, and Stockholm landing pages.
- Monthly technical audit: run a manual page-speed, indexing, schema, sitemap, and Search Console review.

Actual ranking keywords come from Google Search Console when `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN` and `GOOGLE_SEARCH_CONSOLE_PROPERTY` are configured. Until those are connected, weekly page optimization uses curated service keyword sets plus regional Google Trends signals where available.

Files:

- `src/lib/seoAgent.js` researches Google Trends RSS, filters for LuliDigital-relevant keywords, and falls back to rotating service keywords when trends are noisy or irrelevant.
- `src/pages/api/seo-keyword.ts` returns the current recommendation as JSON.
- `src/pages/api/seo-plan.ts` returns the weekly page keyword target for all landing pages, or one page with `?path=/ai`.
- `src/pages/api/cron/seo-agent.ts` refreshes the Africa, South Africa, Amsterdam, Munich, and Stockholm recommendations for Vercel Cron.
- `src/pages/api/cron/weekly-seo.ts` refreshes the weekly page keyword plan for Vercel Cron.
- `vercel.json` schedules the daily cron at `0 4 * * *`, which is 06:00 in Johannesburg, and the weekly cron at `15 4 * * 1`, which is 06:15 every Monday in Johannesburg.
- `scripts/generate-post.mjs` can use the same multi-region keyword research for automatic blog posts when `BLOG_USE_SEO_AGENT=true`.

Environment variables:

- `CRON_SECRET`: protects the cron route. Vercel Cron should call the route with `Authorization: Bearer <CRON_SECRET>`.
- `SEO_AGENT_GEO`: optional Google Trends country code. Defaults to `ZA`.
- `GOOGLE_CLIENT_ID`: Google OAuth client ID used to refresh Search Console access.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret used to refresh Search Console access.
- `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN`: refresh token generated with `https://www.googleapis.com/auth/webmasters.readonly`.
- `GOOGLE_SEARCH_CONSOLE_PROPERTY`: Search Console property URL, for example `https://lulidigital.com/` or `sc-domain:lulidigital.com`.
- `BLOG_USE_SEO_AGENT`: optional. Set to `true` in the auto-blog workflow to generate the next blog from the researched daily keyword.
- `BLOG_SEO_AGENT_GEOS`: optional comma-separated list for blog keyword research. Defaults to `AFRICA,NL,DE,SE,ZA`.

Manual test:

```sh
curl http://localhost:4321/api/seo-keyword
curl "http://localhost:4321/api/seo-keyword?geo=AFRICA&market=africa"
curl "http://localhost:4321/api/seo-keyword?geo=ZA&market=south-africa"
curl "http://localhost:4321/api/seo-keyword?geo=NL&market=amsterdam"
curl "http://localhost:4321/api/seo-keyword?all=true"
curl http://localhost:4321/api/seo-plan
curl "http://localhost:4321/api/seo-plan?path=/ai"
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:4321/api/cron/seo-agent
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:4321/api/cron/weekly-seo
```
