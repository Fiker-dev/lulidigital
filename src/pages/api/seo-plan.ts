import type { APIRoute } from "astro";
import { getSearchConsolePageSeoPlan, getWeeklyPageSeoPlan, getWeeklyPageSeoTarget } from "../../lib/seoAgent.js";
import { jsonResponse, rateLimit } from "../../lib/security";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const { url } = context;
  const limited = rateLimit(context, { key: "seo-plan", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const path = url.searchParams.get("path")?.trim();
  const useSearchConsole = url.searchParams.get("source") !== "fallback";
  const seoPlan = useSearchConsole ? await getSearchConsolePageSeoPlan() : null;
  const fallbackPlan = path ? null : getWeeklyPageSeoPlan();
  const plan = path
    ? (seoPlan?.plan.find((target: { path: string }) => target.path === path) ?? getWeeklyPageSeoTarget(path))
    : (seoPlan?.plan ?? fallbackPlan);

  return jsonResponse(path ? plan : {
    source: seoPlan?.source ?? "LuliDigital weekly page keyword rotation",
    searchConsoleConfigured: seoPlan?.configured ?? false,
    searchConsoleProperty: seoPlan?.property,
    searchConsoleError: seoPlan?.error,
    plan,
  }, {
    status: 200,
    headers: {
      "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800",
    },
  });
};
