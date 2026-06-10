import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }

  let body: {
    name?: string; email?: string; phone?: string;
    whatsapp?: string; pref?: string; note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }

  const { name = "–", email = "–", phone = "–", whatsapp = "–", pref = "–", note = "–" } = body;

  const lines = [
    "New lead from Lana",
    "",
    `Name:      ${name}`,
    `Email:     ${email}`,
    `Phone:     ${phone}`,
    `WhatsApp:  ${whatsapp}`,
    `Prefers:   ${pref}`,
    `Note:      ${note}`,
    "",
    "Follow up within 1 business day.",
  ];

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines.join("\n") }),
    });
  } catch { /* non-blocking */ }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
