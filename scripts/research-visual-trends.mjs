#!/usr/bin/env node
/**
 * Research which retro/90s/Y2K visual formats are ACTUALLY trending right now,
 * and translate them into concrete direction for LuliDigital's YouTube Shorts
 * and LinkedIn posts.
 *
 * Uses Gemini with Google Search grounding, so every claim is tied to a real
 * source rather than the model's recollection — trends go stale fast and an
 * ungrounded answer would quietly invent them.
 *
 * Usage:
 *   node scripts/research-visual-trends.mjs                 # write a report
 *   node scripts/research-visual-trends.mjs --telegram      # + send summary
 *   node scripts/research-visual-trends.mjs --topic "..."   # custom angle
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "social", "trend-reports");

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);

// Key: repo .env first, then the socials Bureau .env, then the environment.
const readEnv = (file, key) => {
  if (!fs.existsSync(file)) return null;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const i = line.indexOf("=");
    if (i > 0 && line.slice(0, i).trim() === key) return line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return null;
};
const KEY =
  process.env.GEMINI_API_KEY ||
  readEnv(path.join(ROOT, ".env"), "GEMINI_API_KEY") ||
  readEnv(path.join(process.env.HOME, "Desktop/Lulidigital Socials/Bureau/socials/.env"), "GEMINI_API_KEY");
if (!KEY) { console.error("No GEMINI_API_KEY found."); process.exit(1); }

const MODEL = "gemini-3.5-flash";
const TODAY = new Date().toISOString().slice(0, 10);

const topic = val("--topic") ||
  "retro 90s, Y2K and early-2000s visual styles trending in short-form video and on LinkedIn";

const prompt = `Research what is ACTUALLY trending right now (${TODAY}) for: ${topic}.

Use search. Report only formats you can find current evidence for — if something
is fading or you cannot verify it is current, say so plainly instead of padding
the list. Never invent a trend, a statistic, or a creator example.

For each of the 4–6 strongest trends, give:
- **Name** of the look/format
- **What it looks like** — concrete visual mechanics (texture, type, colour,
  motion, transitions), specific enough to actually build
- **Why it works** — the psychological or platform reason it earns attention
- **Evidence** — where you saw it working (platform, creator, or article)
- **LuliDigital fit** — how to apply it to a business/AI-automation brand
  without looking like a costume. Be honest if a trend does NOT fit.

Context on the brand so the "fit" is useful:
- LuliDigital: marketing, AI automation, admin/ops support for founders and
  small business owners in the UK/EU/US.
- Voice: warm, plain-spoken, substance-first. Never hype, never influencer-y.
- Existing formats: a paper/typewriter "LULIDIGITAL TIMES" short, honey-branded
  cards, and a 3D mini-me character.
- Palette: honey/amber, cream paper, near-black ink.

Finish with **Do this next** — the single highest-leverage change, and why.

Markdown. No preamble.`;

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
  }),
});
if (!res.ok) { console.error(`Gemini failed ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }

const data = await res.json();
const cand = data.candidates?.[0] ?? {};
const text = (cand.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
if (!text) { console.error("Empty response."); process.exit(1); }

// Grounding sources — proof the trends are real, not recalled.
const chunks = cand.groundingMetadata?.groundingChunks ?? [];
const sources = chunks
  .map((c) => c.web && `- [${c.web.title ?? c.web.uri}](${c.web.uri})`)
  .filter(Boolean);
const uniqueSources = [...new Set(sources)];

const report = [
  `# Visual trend report — ${TODAY}`,
  "",
  `_Topic: ${topic}_`,
  `_Model: ${MODEL} with Google Search grounding (${uniqueSources.length} sources)._`,
  "",
  text,
  "",
  "## Sources",
  ...(uniqueSources.length ? uniqueSources : ["_No grounding sources returned — treat this report as unverified._"]),
  "",
].join("\n");

fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, `${TODAY}-visual-trends.md`);
fs.writeFileSync(outPath, report);
console.log(`Wrote ${outPath}`);
console.log(`Grounding sources: ${uniqueSources.length}`);

if (flag("--telegram")) {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT = process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT) { console.log("No Telegram secrets — report written, not sent."); process.exit(0); }
  const f = new FormData();
  f.append("chat_id", CHAT);
  f.append("document", new Blob([report]), `${TODAY}-visual-trends.md`);
  f.append("caption", `📈 Visual trend report — ${TODAY}\n${uniqueSources.length} grounded sources.`);
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, { method: "POST", body: f });
  console.log((await r.json()).ok ? "Sent to Telegram." : "Telegram send failed.");
}
