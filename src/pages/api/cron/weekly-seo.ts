import type { APIRoute } from "astro";
import { getBestRegionalSeoRecommendation, getDailySeoRecommendation, getSearchConsolePageSeoPlan } from "../../../lib/seoAgent.js";
import { timingSafeEqual } from "../../../lib/security";

export const prerender = false;

const regionalMarkets = [
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

async function sendTelegramNotification(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Weekly SEO Telegram notification failed:", error);
    return false;
  }
}

function formatWeeklySeoMessage({
  weeklySeo,
  regionalRecommendations,
  blogRecommendation,
}: {
  weeklySeo: Awaited<ReturnType<typeof getSearchConsolePageSeoPlan>>;
  regionalRecommendations: Awaited<ReturnType<typeof getDailySeoRecommendation>>[];
  blogRecommendation: Awaited<ReturnType<typeof getBestRegionalSeoRecommendation>>;
}) {
  const pageLines = weeklySeo.plan
    .map((target: { page: string; primaryKeyword: string }) => `${target.page}: ${target.primaryKeyword}`)
    .join("\n");

  const regionalLines = regionalRecommendations
    .map((item: { geo: string; keyword: string }) => `${item.geo}: ${item.keyword}`)
    .join("\n");

  return [
    "Weekly SEO refresh completed",
    "",
    `Source: ${weeklySeo.source}`,
    weeklySeo.configured === false ? "Search Console: not configured, using rotation" : "",
    weeklySeo.error ? `Search Console issue: ${weeklySeo.error}` : "",
    "",
    "Page targets:",
    pageLines,
    "",
    "Regional signals:",
    regionalLines,
    "",
    `Next blog recommendation: ${blogRecommendation.keyword}`,
    `Blog source: ${blogRecommendation.source}`,
  ].filter(Boolean).join("\n");
}

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return new Response(JSON.stringify({ error: "CRON_SECRET is not configured." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!authHeader || !timingSafeEqual(authHeader, `Bearer ${cronSecret}`)) {
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
  const telegramNotified = await sendTelegramNotification(formatWeeklySeoMessage({
    weeklySeo,
    regionalRecommendations,
    blogRecommendation,
  }));

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
    telegramNotified,
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
