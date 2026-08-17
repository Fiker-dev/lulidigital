#!/usr/bin/env node
/**
 * Deliver a due LinkedIn company blog announcement to Telegram — the asset
 * itself plus a copy-pastable caption — so Fiker can post it from her phone
 * without needing her Mac.
 *
 * Sends, per announcement:
 *   1. the card (sendPhoto) or carousel (sendDocument)
 *   2. the caption as its own message, so it can be copied cleanly
 *   3. the first-comment URL as its own message, for the same reason
 *
 * Already-delivered slugs are recorded in social/announcement-deliveries.json
 * so a daily run never spams the same one twice.
 *
 * Usage: node scripts/send-announcement-telegram.mjs [--all] [--dry]
 * Env:   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE = path.join(ROOT, "social", "queue");
const STATE = path.join(ROOT, "social", "announcement-deliveries.json");

const ALL = process.argv.includes("--all");
const DRY = process.argv.includes("--dry");
const TODAY = new Date().toISOString().slice(0, 10);

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
if (!DRY && (!TOKEN || !CHAT)) {
  console.log("No Telegram secrets — skipping.");
  process.exit(0);
}

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdayOf = (iso) => WEEKDAY[new Date(`${iso}T12:00:00Z`).getUTCDay()];

const state = fs.existsSync(STATE)
  ? JSON.parse(fs.readFileSync(STATE, "utf8"))
  : { delivered: [] };

const api = async (method, form) => {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(`${method} failed: ${JSON.stringify(json).slice(0, 200)}`);
  return json;
};

const sendText = (text) => {
  const f = new FormData();
  f.append("chat_id", CHAT);
  f.append("text", text);
  return api("sendMessage", f);
};

const sendFile = async (file, kind, caption) => {
  const f = new FormData();
  f.append("chat_id", CHAT);
  f.append("caption", caption.slice(0, 1000));
  const blob = new Blob([fs.readFileSync(file)]);
  if (kind === "carousel") { f.append("document", blob, path.basename(file)); return api("sendDocument", f); }
  f.append("photo", blob, path.basename(file));
  return api("sendPhoto", f);
};

if (!fs.existsSync(QUEUE)) { console.log("No social/queue."); process.exit(0); }

let sent = 0;

for (const slug of fs.readdirSync(QUEUE)) {
  const dir = path.join(QUEUE, slug);
  if (!fs.statSync(dir).isDirectory()) continue;

  const pdf = path.join(dir, "linkedin-company-carousel.pdf");
  const png = path.join(dir, "linkedin-company-asset.png");
  const asset = fs.existsSync(pdf) ? pdf : fs.existsSync(png) ? png : null;
  const capPath = path.join(dir, "linkedin-company.md");
  if (!asset || !fs.existsSync(capPath)) continue;

  const raw = fs.readFileSync(capPath, "utf8");
  const statusPath = path.join(dir, "STATUS.md");
  const status = fs.existsSync(statusPath) ? fs.readFileSync(statusPath, "utf8") : "";
  if (/linkedin-company\s+POSTED/i.test(status)) continue;
  if (state.delivered.includes(slug)) continue;

  const date =
    (raw.match(/companyScheduledFor:\s*"?(\d{4}-\d{2}-\d{2})"?/) || [])[1] ||
    (status.match(/companyScheduledFor:\s*"?(\d{4}-\d{2}-\d{2})"?/) || [])[1] ||
    null;
  if (!ALL && date && date > TODAY) continue;

  const body = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
  const [caption, firstCommentRaw] = body.split(/^---\s*$/m).map((s) => (s || "").trim());
  const firstComment = (firstCommentRaw || "").replace(/^FIRST COMMENT:\s*/i, "").trim();
  const kind = path.extname(asset) === ".pdf" ? "carousel" : "card";

  const header =
    `📣 LinkedIn company post ready${date ? ` — ${weekdayOf(date)} ${date}` : ""}\n` +
    `${kind === "carousel" ? "Upload as a DOCUMENT (carousel)" : "Attach this image"} + paste the caption below.`;

  console.log(`${DRY ? "[dry] " : ""}${slug} → ${kind} (${date ?? "no date"})`);
  if (DRY) { sent++; continue; }

  try {
    await sendFile(asset, kind, header);
    await sendText(`CAPTION — copy from here:\n\n${caption}`);
    if (firstComment) await sendText(`FIRST COMMENT (post right after):\n${firstComment}`);
    state.delivered.push(slug);
    sent++;
  } catch (e) {
    console.error(`FAILED ${slug}: ${e.message}`);
  }
}

if (!DRY && sent) {
  fs.writeFileSync(STATE, `${JSON.stringify(state, null, 2)}\n`);
}
console.log(sent ? `Delivered ${sent} announcement(s).` : "Nothing due to deliver.");
