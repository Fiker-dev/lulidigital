import type { APIRoute } from "astro";
import { getBestRegionalSeoRecommendation, getDailySeoRecommendation } from "../../lib/seoAgent.js";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const geo = url.searchParams.get("geo")?.trim().toUpperCase();
  const market = url.searchParams.get("market")?.trim();
  const allMarkets = url.searchParams.get("all") === "true";
  const recommendation = allMarkets
    ? await getBestRegionalSeoRecommendation()
    : await getDailySeoRecommendation({ geo, market });

  return new Response(JSON.stringify(recommendation), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400",
    },
  });
};
