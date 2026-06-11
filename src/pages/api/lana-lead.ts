import type { APIRoute } from "astro";
import { assertSameOrigin, jsonResponse, rateLimit, readJsonBody } from "../../lib/security";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { request, url } = context;
  const originError = assertSameOrigin(request, url);
  if (originError) return originError;

  const limited = rateLimit(context, { key: "lana-lead", limit: 4, windowMs: 60_000 });
  if (limited) return limited;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return jsonResponse({ ok: false }, { status: 500 });
  }

  type LeadBody = {
    name?: string; email?: string; phone?: string; whatsapp?: string;
    pref?: string; business?: string; desk?: string; urgency?: string;
    challenge?: string; quote?: string;
  };
  const parsed = await readJsonBody<LeadBody>(request, 6_144);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const normalize = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 500) : "");
  const none = (v: unknown) => {
    const normalized = normalize(v);
    return (normalized === "none" || normalized === "–" || !normalized) ? "–" : normalized;
  };
  const name = none(body.name);
  const email = none(body.email);
  const phone = none(body.phone);
  const whatsapp = none(body.whatsapp);
  const pref = none(body.pref);
  const business = none(body.business);
  const desk = none(body.desk);
  const urgency = none(body.urgency);
  const challenge = none(body.challenge);
  const quote = none(body.quote);

  const lines = [
    "Meeting Brief — Fiker x " + name,
    "",
    "WHO",
    "Name:       " + none(name),
    "Email:      " + none(email),
    "Phone:      " + none(phone),
    "WhatsApp:   " + none(whatsapp) + (pref !== "–" ? "  |  Prefers: " + none(pref) : ""),
    "",
    "THEIR BUSINESS",
    none(business),
    "",
    "DESK INTEREST",
    none(desk),
    "",
    "CORE CHALLENGE",
    none(challenge),
    "",
    "URGENCY / TIMELINE",
    none(urgency),
    "",
    "WHAT LANA HEARD",
    none(quote) !== "–" ? `"${none(quote)}"` : "–",
    "",
    "Walk in prepared. Follow up within 1 business day.",
  ];

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines.join("\n") }),
    });
  } catch { /* non-blocking */ }

  return jsonResponse({ ok: true });
};
