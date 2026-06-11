import type { APIRoute } from "astro";
import { assertSameOrigin, jsonResponse, rateLimit, readJsonBody } from "../../lib/security";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { request, url } = context;
  const originError = assertSameOrigin(request, url);
  if (originError) return originError;

  const limited = rateLimit(context, { key: "lana-enquiry", limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return jsonResponse({ ok: true });
  }

  const parsed = await readJsonBody<{ reason?: string }>(request, 2_048);
  const body = parsed.ok ? parsed.data : {};

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "Quick enquiry";
  const text = [
    "Quick Enquiry ↗",
    "",
    `"${reason}"`,
    "",
    "Offered: Email + WhatsApp",
    "info@lulidigital.com  |  +27 60 255 1513",
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch { /* non-blocking */ }

  return jsonResponse({ ok: true });
};
