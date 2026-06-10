import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  let body: { reason?: string } = {};
  try { body = await request.json(); } catch { /* ignore */ }

  const reason = body.reason?.trim() || "Quick enquiry";
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

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
