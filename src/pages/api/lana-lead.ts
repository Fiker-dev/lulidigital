import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }

  let body: { name?: string; email?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }

  const { name = "Unknown", email = "–", note = "–" } = body;

  const text = [
    "New lead from Lana",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Note: ${note}`,
    "",
    "Reply to this email or reach out within 1 business day.",
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // non-blocking — don't fail the response
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
