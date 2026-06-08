import type { APIRoute } from "astro";
import { getBestRegionalSeoRecommendation, getDailySeoRecommendation, getSearchConsolePageSeoPlan } from "../../../lib/seoAgent.js";

export const prerender = false;

const regionalMarkets = [
  { geo: "AFRICA", market: "africa" },
  { geo: "NL", market: "amsterdam" },
  { geo: "DE", market: "munich" },
  { geo: "SE", market: "stockholm" },
  { geo: "US", market: "united-states" },
  { geo: "GB", market: "united-kingdom" },
  { geo: "DK", market: "denmark" },
  { geo: "CH", market: "switzerland" },
  { geo: "IE", market: "ireland" },
  { geo: "BE", market: "belgium" },
  { geo: "NO", market: "norway" },
];

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return new Response(JSON.stringify({ error: "CRON_SECRET is not configured." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [weeklySeo, regionalRecommendations, blogRecommendation] = await Promise.all([
    getSearchConsolePageSeoPlan(),
    Promise.all(
      regionalMarkets.map(({ geo, market }) => getDailySeoRecommendation({ forceRefresh: true, geo, market })),
    ),
    getBestRegionalSeoRecommendation({ forceRefresh: false }),
  ]);

  return new Response(JSON.stringify({
    ok: true,
    cadence: "weekly",
    weeklySource: weeklySeo.source,
    searchConsoleConfigured: weeklySeo.configured,
    searchConsoleProperty: weeklySeo.property,
    searchConsoleError: weeklySeo.error,
    weeklyPagePlan: weeklySeo.plan,
    regionalRecommendations,
    blogRecommendation,
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
