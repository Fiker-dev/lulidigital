import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

type ContactBody = {
  name: string;
  email: string;
  company?: string;
  looking_for: string;
  timeline: string;
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

  const { name, email, company, looking_for, timeline, preferred_channel, message } = body;

  if (!name || !email || !looking_for || !timeline || !message) {
    return new Response(JSON.stringify({ error: "Missing required fields." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resend = new Resend(resendKey);

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:10px 20px 10px 0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#999;white-space:nowrap;vertical-align:top;width:120px">${label}</td>
      <td style="padding:10px 0;font-size:14px;color:#141414;vertical-align:top;line-height:1.5">${value}</td>
    </tr>`;

  const internalHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f1e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="padding:40px 16px">
<div style="max-width:580px;margin:0 auto">

  <!-- Wordmark -->
  <div style="text-align:center;margin-bottom:28px">
    <span style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#888;font-weight:500">LULIDIGITAL</span>
  </div>

  <!-- Card -->
  <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e2d8;box-shadow:0 4px 24px rgba(20,20,20,.07)">

    <!-- Header -->
    <div style="background:#141414;padding:32px 36px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td>
            <p style="margin:0 0 14px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:rgba(245,241,232,.45)">New Brief</p>
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;line-height:1.15;letter-spacing:-.02em">${name}${company ? `<span style="color:rgba(255,255,255,.4)"> · </span>${company}` : ""}</h1>
          </td>
          <td style="text-align:right;vertical-align:top;padding-top:4px">
            <span style="display:inline-block;background:rgba(245,241,232,.1);border:1px solid rgba(245,241,232,.18);border-radius:100px;padding:5px 14px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(245,241,232,.6)">${timeline}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Brief data -->
    <div style="padding:28px 36px 0">
      <table style="width:100%;border-collapse:collapse">
        ${row("Service", looking_for)}
          ${row("Contact via", preferred_channel || "Email reply")}
        ${row("Reply to", `<a href="mailto:${email}" style="color:#141414;text-decoration:underline">${email}</a>`)}
      </table>
    </div>

    <!-- Campaign priority -->
    <div style="margin:24px 36px;padding:20px 24px;background:#faf8f4;border-radius:10px;border:1px solid #ede8de">
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#aaa">Campaign Priority</p>
      <p style="margin:0;font-size:15px;color:#141414;line-height:1.7;white-space:pre-wrap">${message}</p>
    </div>

    <!-- Reply CTA -->
    <div style="padding:0 36px 32px">
      <a href="mailto:${email}?subject=Re: Your LuliDigital Brief" style="display:inline-block;background:#141414;color:#fff;text-decoration:none;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:13px 26px;border-radius:8px;font-weight:600">Reply to ${name} →</a>
    </div>

    <!-- Footer -->
    <div style="padding:16px 36px;border-top:1px solid #ede8de;background:#faf8f4">
      <p style="margin:0;font-size:11px;color:#c0bbb2;letter-spacing:.06em">lulidigital.com &nbsp;·&nbsp; Brief submitted via website</p>
    </div>

  </div>
</div>
</div>
</body></html>`;

  const clientHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f1e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="padding:40px 16px">
<div style="max-width:580px;margin:0 auto">

  <!-- Wordmark -->
  <div style="text-align:center;margin-bottom:28px">
    <span style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#888;font-weight:500">LULIDIGITAL</span>
  </div>

  <!-- Card -->
  <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e2d8;box-shadow:0 4px 24px rgba(20,20,20,.07)">

    <!-- Header -->
    <div style="background:#141414;padding:40px 36px 36px">
      <p style="margin:0 0 18px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:rgba(245,241,232,.4)">Confirmed</p>
      <h1 style="margin:0 0 12px;color:#fff;font-size:38px;font-weight:700;line-height:1.05;letter-spacing:-.03em">Brief received.</h1>
      <p style="margin:0;color:rgba(245,241,232,.55);font-size:15px;line-height:1.6">The desk has your brief. Expect a reply within 24 hours.</p>
    </div>

    <!-- Brief summary strip -->
    <div style="background:#faf8f4;border-bottom:1px solid #ede8de;padding:20px 36px">
      <p style="margin:0 0 12px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#aaa">Your brief summary</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:4px 20px 4px 0;font-size:12px;color:#aaa;width:90px">Service</td>
          <td style="padding:4px 0;font-size:13px;color:#141414;font-weight:500">${looking_for}</td>
        </tr>
        <tr>
          <td style="padding:4px 20px 4px 0;font-size:12px;color:#aaa">Timeline</td>
          <td style="padding:4px 0;font-size:13px;color:#141414;font-weight:500">${timeline}</td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="padding:36px 36px 28px">
      <p style="margin:0 0 20px;font-size:16px;color:#141414;line-height:1.7">Hi ${name},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.8">Your brief is with the desk. We review every brief personally and come back with a focused response — no generic decks, no wasted calls.</p>
      <p style="margin:0;font-size:15px;color:#555;line-height:1.8">We'll be in touch shortly.</p>
    </div>

    <!-- WhatsApp block -->
    <div style="margin:0 36px 32px;padding:20px 24px;background:#faf8f4;border-radius:12px;border:1px solid #ede8de">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#aaa">Need a faster reply?</p>
      <p style="margin:0 0 16px;font-size:15px;color:#141414;font-weight:600">Message the desk on WhatsApp</p>
      <a href="https://wa.me/27602551513" style="display:inline-block;background:#141414;color:#f5f1e8;text-decoration:none;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:13px 26px;border-radius:8px;font-weight:600">+27 60 255 1513 →</a>
    </div>

    <!-- Sign off -->
    <div style="padding:0 36px 32px">
      <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6">— LuliDigital Desk</p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 36px;border-top:1px solid #ede8de;background:#faf8f4">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="font-size:11px;color:#c0bbb2;letter-spacing:.06em">lulidigital.com</td>
          <td style="text-align:right"><a href="mailto:info@lulidigital.co.za" style="font-size:11px;color:#c0bbb2;letter-spacing:.06em;text-decoration:none">info@lulidigital.co.za</a></td>
        </tr>
      </table>
    </div>

  </div>
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
