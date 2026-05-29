import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

type ContactBody = {
  name: string;
  email: string;
  company?: string;
  looking_for: string;
  timeline: string;
  budget?: string;
  preferred_channel?: string;
  message: string;
};

export const POST: APIRoute = async ({ request }) => {
  const resendKey = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  if (!resendKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: ContactBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { name, email, company, looking_for, timeline, budget, preferred_channel, message } = body;

  if (!name || !email || !looking_for || !timeline || !message) {
    return new Response(JSON.stringify({ error: "Missing required fields." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resend = new Resend(resendKey);

  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#888;font-size:12px;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;padding-right:24px;vertical-align:top">${label}</td><td style="padding:8px 0;font-size:15px;color:#141414;vertical-align:top">${value}</td></tr>`;

  const internalHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f5f1e8;margin:0;padding:32px 0">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e0d5">
  <div style="background:#141414;padding:28px 32px">
    <p style="margin:0;color:#f5f1e8;font-size:11px;letter-spacing:.18em;text-transform:uppercase">LuliDigital · New Brief</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700">${name}${company ? ` · ${company}` : ""}</h1>
  </div>
  <div style="padding:28px 32px">
    <table style="width:100%;border-collapse:collapse">
      ${row("Service", looking_for)}
      ${row("Timeline", timeline)}
      ${row("Budget", budget || "Not specified")}
      ${row("Contact via", preferred_channel || "Email reply")}
      ${row("Reply to", `<a href="mailto:${email}" style="color:#141414">${email}</a>`)}
    </table>
    <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e0d5">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#888">Campaign Priority</p>
      <p style="margin:0;font-size:15px;color:#141414;line-height:1.6;white-space:pre-wrap">${message}</p>
    </div>
  </div>
</div>
</body></html>`;

  const clientHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f5f1e8;margin:0;padding:32px 0">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e0d5">
  <div style="background:#141414;padding:28px 32px">
    <p style="margin:0;color:#f5f1e8;font-size:11px;letter-spacing:.18em;text-transform:uppercase">LuliDigital</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700">Brief received.</h1>
  </div>
  <div style="padding:28px 32px">
    <p style="margin:0 0 20px;font-size:16px;color:#141414;line-height:1.6">Hi ${name},</p>
    <p style="margin:0 0 20px;font-size:16px;color:#141414;line-height:1.6">Your brief is in. We'll review it and reply within 24 hours.</p>
    <p style="margin:0 0 20px;font-size:16px;color:#141414;line-height:1.6">If you need a faster reply, message the desk directly on WhatsApp: <a href="https://wa.me/27602551513" style="color:#141414;font-weight:600">+27 60 255 1513</a>.</p>
    <p style="margin:0;font-size:14px;color:#888;line-height:1.6">— LuliDigital Desk</p>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #e5e0d5;background:#faf8f4">
    <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:.08em">lulidigital.co.za &nbsp;·&nbsp; info@lulidigital.co.za</p>
  </div>
</div>
</body></html>`;

  const [internalResult, clientResult] = await Promise.all([
    resend.emails.send({
      from: "LuliDigital Desk <desk@notify.lulidigital.com>",
      to: "info@lulidigital.co.za",
      replyTo: email,
      subject: `New brief: ${looking_for} — ${name}${company ? ` · ${company}` : ""}`,
      html: internalHtml,
    }),
    resend.emails.send({
      from: "LuliDigital Desk <desk@notify.lulidigital.com>",
      to: email,
      subject: "Your brief is in — LuliDigital",
      html: clientHtml,
    }),
  ]);

  if (internalResult.error || clientResult.error) {
    console.error("Resend error:", internalResult.error ?? clientResult.error);
    return new Response(JSON.stringify({ error: "Failed to send. Please try WhatsApp or email directly." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
