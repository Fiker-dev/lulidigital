import type { APIRoute } from "astro";
import { getBestRegionalSeoRecommendation, getDailySeoRecommendation } from "../../../lib/seoAgent.js";
import { timingSafeEqual } from "../../../lib/security";

export const prerender = false;

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
    console.error("SEO agent Telegram notification failed:", error);
    return false;
  }
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

  const markets = await Promise.all([
    getDailySeoRecommendation({ forceRefresh: true, geo: "AFRICA", market: "africa" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "NL", market: "amsterdam" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "DE", market: "munich" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "SE", market: "stockholm" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "US", market: "united-states" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "GB", market: "united-kingdom" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "DK", market: "denmark" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "CH", market: "switzerland" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "IE", market: "ireland" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "BE", market: "belgium" }),
    getDailySeoRecommendation({ forceRefresh: true, geo: "NO", market: "norway" }),
  ]);
  const blogRecommendation = await getBestRegionalSeoRecommendation({ forceRefresh: false });
  const telegramNotified = await sendTelegramNotification([
    "Daily SEO agent refreshed",
    "",
    "Regional signals:",
    ...markets.map((item) => `${item.geo}: ${item.keyword}`),
    "",
    `Blog recommendation: ${blogRecommendation.keyword}`,
    `Source: ${blogRecommendation.source}`,
  ].join("\n"));

  return new Response(JSON.stringify({ ok: true, markets, blogRecommendation, telegramNotified }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
