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

The homepage, South Africa landing page, and European landing pages use a small SEO agent that researches Google Trends every morning and renders selected keywords server-side for crawlers.

Files:

- `src/lib/seoAgent.js` researches Google Trends RSS, filters for LuliDigital-relevant keywords, and falls back to rotating service keywords when trends are noisy or irrelevant.
- `src/pages/api/seo-keyword.ts` returns the current recommendation as JSON.
- `src/pages/api/cron/seo-agent.ts` refreshes the South Africa, Amsterdam, Munich, and Stockholm recommendations for Vercel Cron.
- `vercel.json` schedules the cron at `0 4 * * *`, which is 06:00 in Johannesburg.
- `scripts/generate-post.mjs` can use the same multi-region keyword research for automatic blog posts when `BLOG_USE_SEO_AGENT=true`.

Environment variables:

- `CRON_SECRET`: protects the cron route. Vercel Cron should call the route with `Authorization: Bearer <CRON_SECRET>`.
- `SEO_AGENT_GEO`: optional Google Trends country code. Defaults to `ZA`.
- `BLOG_USE_SEO_AGENT`: optional. Set to `true` in the auto-blog workflow to generate the next blog from the researched daily keyword.
- `BLOG_SEO_AGENT_GEOS`: optional comma-separated list for blog keyword research. Defaults to `NL,DE,SE,ZA`.

Manual test:

```sh
curl http://localhost:4321/api/seo-keyword
curl "http://localhost:4321/api/seo-keyword?geo=ZA&market=south-africa"
curl "http://localhost:4321/api/seo-keyword?geo=NL&market=amsterdam"
curl "http://localhost:4321/api/seo-keyword?all=true"
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:4321/api/cron/seo-agent
```
