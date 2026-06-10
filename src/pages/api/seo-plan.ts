import type { APIRoute } from "astro";
import { getSearchConsolePageSeoPlan, getWeeklyPageSeoPlan, getWeeklyPageSeoTarget } from "../../lib/seoAgent.js";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const path = url.searchParams.get("path")?.trim();
  const useSearchConsole = url.searchParams.get("source") !== "fallback";
  const seoPlan = useSearchConsole ? await getSearchConsolePageSeoPlan() : null;
  const fallbackPlan = path ? null : getWeeklyPageSeoPlan();
  const plan = path
    ? (seoPlan?.plan.find((target: { path: string }) => target.path === path) ?? getWeeklyPageSeoTarget(path))
    : (seoPlan?.plan ?? fallbackPlan);

  return new Response(JSON.stringify(path ? plan : {
    source: seoPlan?.source ?? "LuliDigital weekly page keyword rotation",
    searchConsoleConfigured: seoPlan?.configured ?? false,
    searchConsoleProperty: seoPlan?.property,
    searchConsoleError: seoPlan?.error,
    plan,
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800",
    },
  });
};
