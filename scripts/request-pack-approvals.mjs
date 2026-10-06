/**
 * Tell Fiker which social packs are waiting. NOTIFICATION ONLY.
 *
 * Approval happens in the Claude routine session, not here — Fiker's standing
 * instruction. This message carries NO buttons and NO action links; it exists so
 * she knows something is waiting, and the routine asks for the decision.
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
if (!DRY && (!TOKEN || !CHAT)) {
  console.log("Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID — skipping.");
  process.exit(0);
}

const state = fs.existsSync(STATE)
  ? JSON.parse(fs.readFileSync(STATE, "utf8"))
  : { asked: [] };
state.asked ??= [];

if (!fs.existsSync(QUEUE)) { console.log("No social/queue."); process.exit(0); }

const LEDGER = path.join(ROOT, "social", "posted-ledger.json");
const posted = new Set(fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")).posted.map((e) => e.slug) : []);

const pending = fs.readdirSync(QUEUE)
  .map((slug) => {
    const dir = path.join(QUEUE, slug);
    const sp = path.join(dir, "STATUS.md");
    if (!fs.statSync(dir).isDirectory() || !fs.existsSync(sp)) return null;
    const raw = fs.readFileSync(sp, "utf8");
    const first = raw.split("\n")[0];
    if (((first.match(/^\s*([a-z_]+)/) || [])[1] || "") !== "awaiting_approval") return null;
    if (/POSTED/i.test(raw)) return null;
    if (state.asked.includes(slug)) return null;
    // Hand-posted packs keep awaiting_approval in their status until someone
    // records otherwise; the ledger is that record.
    if (posted.has(slug)) return null;
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

  const text =
    `📱 Social pack waiting — ${slug}\n\n` +
    `${cap.platform}:\n\n${cap.text.slice(0, 700)}${cap.text.length > 700 ? "…" : ""}\n\n` +
    `To approve it, say so in the Claude routine session. Nothing posts until you do.`;

  if (DRY) { console.log(`[dry] would notify about ${slug} (${cap.platform})`); sent++; continue; }

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text, disable_web_page_preview: true }),
  });
  const json = await res.json();
  if (json.ok) {
    state.asked.push(slug);
    sent++;
    console.log(`notified about ${slug}`);
  } else {
    console.error(`FAILED ${slug}: ${JSON.stringify(json).slice(0, 200)}`);
  }
}

if (!DRY && sent) fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
console.log(`${DRY ? "[dry] " : ""}Notified about ${sent} pack(s).`);
