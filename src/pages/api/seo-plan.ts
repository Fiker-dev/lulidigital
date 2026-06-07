import type { APIRoute } from "astro";
import { getWeeklyPageSeoPlan, getWeeklyPageSeoTarget } from "../../lib/seoAgent.js";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const path = url.searchParams.get("path")?.trim();
  const plan = path ? getWeeklyPageSeoTarget(path) : getWeeklyPageSeoPlan();

  return new Response(JSON.stringify(plan), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800",
    },
  });
};
