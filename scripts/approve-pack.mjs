/**
 * Flip a social pack from awaiting_approval to approved.
 *
 * post-approved-packs.mjs only posts packs whose STATUS.md state is `approved`,
 * but nothing could ever set that — there was no approval channel at all, so
 * 24 packs piled up unposted. This is the write half; the tap-link in Telegram
 * hits /api/approve-pack, which dispatches approve-pack.yml, which runs this.
 *
 *   node scripts/approve-pack.mjs --slug <slug> [--date YYYY-MM-DD] [--discard]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const args = process.argv.slice(2);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const slug = val("--slug");
const date = val("--date");
const discard = args.includes("--discard");
if (!slug) throw new Error("Usage: --slug <slug> [--date YYYY-MM-DD] [--discard]");

const statusPath = join(ROOT, "social", "queue", slug, "STATUS.md");
if (!existsSync(statusPath)) throw new Error(`No STATUS.md for ${slug}`);

const raw = readFileSync(statusPath, "utf8");
const lines = raw.split("\n");
const first = lines[0];
const state = (first.match(/^\s*([a-z_]+)/) || [])[1] || "";
const target = discard ? "discarded" : "approved";

if (state === target) {
  console.log(`${slug} is already ${target} — nothing to do.`);
  process.exit(0);
}
if (/POSTED/i.test(raw) && !discard) {
  console.log(`${slug} has already been posted — refusing to re-approve.`);
  process.exit(0);
}

lines[0] = first.replace(/^\s*[a-z_]+/, target);

// Give it a due date so post-approved-packs picks it up; without one the pack
// is approved but never "due", which would strand it exactly as before.
if (!discard && !/scheduledFor:/.test(lines[0])) {
  const when = date || new Date().toISOString().slice(0, 10);
  lines[0] += ` | scheduledFor: "${when}"`;
} else if (!discard && date) {
  lines[0] = lines[0].replace(/scheduledFor:\s*"?\d{4}-\d{2}-\d{2}"?/, `scheduledFor: "${date}"`);
}

lines.splice(1, 0, `<!-- ${target} by Fiker via Telegram tap on ${new Date().toISOString().slice(0, 16).replace("T", " ")}Z -->`);
writeFileSync(statusPath, lines.join("\n"));
console.log(`${slug}: ${state} → ${target}`);
console.log(lines[0].slice(0, 160));
