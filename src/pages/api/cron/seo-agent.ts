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


/**
 * Fire the blog publish workflow.
 *
 * GitHub's own scheduler is the reason posts keep landing late: the 04:23 UTC
 * cron has fired at ~10:30 every day, and 13:41 at ~19:00 — a steady six-hour
 * slip, so a post meant for Fiker's morning appears at lunchtime. Vercel's
 * scheduler runs on time, and this route already runs daily at 04:00 UTC, so it
 * kicks the workflow itself.
 *
 * The workflow is idempotent — it publishes only drafts whose scheduledFor is
 * due and still draft:true — so the GitHub crons stay on as a backstop and a
 * duplicate run costs nothing.
 */
async function dispatchBlogPublish() {
  const token = process.env.GITHUB_WORKFLOW_TOKEN;
  if (!token) return { ok: false, reason: "no GITHUB_WORKFLOW_TOKEN" };
  try {
    const res = await fetch(
      "https://api.github.com/repos/Fiker-dev/lulidigital/actions/workflows/publish-scheduled.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main" }),
      },
    );
    return res.ok ? { ok: true } : { ok: false, reason: `${res.status} ${await res.text()}` };
  } catch (error) {
    return { ok: false, reason: String(error) };
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

  // Publishing goes FIRST and is isolated: the SEO sweep below makes a dozen
  // network calls, and a slow or failing sweep must never hold up the blog.
  const publish = await dispatchBlogPublish();
  if (publish.ok) {
    console.log("Blog publish workflow dispatched.");
  } else {
    console.error(`Blog publish dispatch failed: ${publish.reason}`);
    await sendTelegramNotification(
      `⚠️ Could not start the blog publish job from the Vercel cron (${publish.reason}). GitHub's own schedule is the backstop, but it runs hours late — check if today's post is missing.`,
    );
  }

  const markets = await Promise.all([
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
