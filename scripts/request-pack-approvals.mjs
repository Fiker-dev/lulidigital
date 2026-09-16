/**
 * Ask Fiker to approve social packs, with working tap-links.
 *
 * The packs were being written but never approved, because no approval channel
 * existed — post-approved-packs.mjs waits for STATUS.md state `approved` and
 * nothing could set it. 24 packs went stale that way. This sends the ask.
 *
 * Deliberately rate-limited: only packs never asked about before, newest first,
 * MAX_PER_RUN at a time. A 24-message flood would just get ignored, which is
 * how the backlog happened in the first place.
 *
 *   node scripts/request-pack-approvals.mjs [--dry] [--max N]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, not .pathname — the repo path contains a space, which
// .pathname returns percent-encoded, silently pointing at nothing.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE = path.join(ROOT, "social", "queue");
const STATE = path.join(ROOT, "social", "approval-requests.json");
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const MAX_PER_RUN = Number(args[args.indexOf("--max") + 1]) || 3;

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
const KEY = process.env.BLOG_PREVIEW_TOKEN;
if (!DRY && (!TOKEN || !CHAT || !KEY)) {
  console.log("Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID / BLOG_PREVIEW_TOKEN — skipping.");
  process.exit(0);
}

const state = fs.existsSync(STATE)
  ? JSON.parse(fs.readFileSync(STATE, "utf8"))
  : { asked: [] };
state.asked ??= [];

if (!fs.existsSync(QUEUE)) { console.log("No social/queue."); process.exit(0); }

const pending = fs.readdirSync(QUEUE)
  .map((slug) => {
    const dir = path.join(QUEUE, slug);
    const sp = path.join(dir, "STATUS.md");
    if (!fs.statSync(dir).isDirectory() || !fs.existsSync(sp)) return null;
    const raw = fs.readFileSync(sp, "utf8");
    const first = raw.split("\n")[0];
    if (first.split("|")[0].trim() !== "awaiting_approval") return null;
    if (/POSTED/i.test(raw)) return null;
    if (state.asked.includes(slug)) return null;
    return { slug, dir, mtime: fs.statSync(sp).mtimeMs };
  })
  .filter(Boolean)
  .sort((a, b) => b.mtime - a.mtime)   // newest first: freshest ideas matter most
  .slice(0, MAX_PER_RUN);

if (!pending.length) { console.log("No new packs to ask about."); process.exit(0); }

const firstCaption = (dir) => {
  for (const f of ["linkedin-personal.md", "linkedin-company.md", "bluesky.md"]) {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) continue;
    const body = fs.readFileSync(p, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
    const text = body.split(/^---\s*$/m)[0].trim();
    if (text) return { platform: f.replace(".md", ""), text };
  }
  return null;
};

let sent = 0;
for (const { slug, dir } of pending) {
  const cap = firstCaption(dir);
  if (!cap) { console.log(`${slug}: no caption to preview — skipping.`); continue; }

  const today = new Date().toISOString().slice(0, 10);
  const base = `https://lulidigital.com/api/approve-pack?slug=${slug}&key=${KEY}`;
  const text =
    `📱 Social pack ready — ${slug}\n\n` +
    `${cap.platform}:\n\n${cap.text.slice(0, 700)}${cap.text.length > 700 ? "…" : ""}\n\n` +
    `Approve and it posts on the next run (weekdays 11:23 UTC). Nothing goes out until you tap.`;
  const markup = {
    inline_keyboard: [
      [{ text: `✅ Approve — post today`, url: `${base}&date=${today}` }],
      [{ text: `🗑 Discard`, url: `${base}&action=discard` }],
    ],
  };

  if (DRY) { console.log(`[dry] would ask about ${slug} (${cap.platform})`); sent++; continue; }

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text, reply_markup: markup }),
  });
  const json = await res.json();
  if (json.ok) {
    state.asked.push(slug);
    sent++;
    console.log(`asked about ${slug}`);
  } else {
    console.error(`FAILED ${slug}: ${JSON.stringify(json).slice(0, 200)}`);
  }
}

if (!DRY && sent) fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
console.log(`${DRY ? "[dry] " : ""}Asked about ${sent} pack(s).`);
