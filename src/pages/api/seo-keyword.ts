import type { APIRoute } from "astro";
import { getBestRegionalSeoRecommendation, getDailySeoRecommendation } from "../../lib/seoAgent.js";
import { jsonResponse, rateLimit } from "../../lib/security";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const { url } = context;
  const limited = rateLimit(context, { key: "seo-keyword", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const geo = url.searchParams.get("geo")?.trim().toUpperCase();
  const market = url.searchParams.get("market")?.trim();
  const allMarkets = url.searchParams.get("all") === "true";
  const recommendation = allMarkets
    ? await getBestRegionalSeoRecommendation()
    : await getDailySeoRecommendation({ geo, market });

  return jsonResponse(recommendation, {
    status: 200,
    headers: {
      "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400",
    },
  });
};
