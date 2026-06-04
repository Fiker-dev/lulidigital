import type { APIRoute } from "astro";
import { getBestRegionalSeoRecommendation, getDailySeoRecommendation } from "../../../lib/seoAgent.js";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const markets = await Promise.all([
    getDailySeoRecommendation({ forceRefresh: true, geo: "AFRICA", market: "africa" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "ZA", market: "south-africa" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "NL", market: "amsterdam" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "DE", market: "munich" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "SE", market: "stockholm" }),
  ]);
  const blogRecommendation = await getBestRegionalSeoRecommendation({ forceRefresh: false });

  return new Response(JSON.stringify({ ok: true, markets, blogRecommendation }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
