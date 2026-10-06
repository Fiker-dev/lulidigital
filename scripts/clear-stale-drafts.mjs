/**
 * Clear the pile of unapproved blog drafts.
 *
 * Drafts used to accumulate — 18 at one point, 10 of them months old — because
 * nothing ever removed the ones Fiker didn't approve. A stale draft isn't
 * harmless: it gets re-offered in the routine, and older ones predate the
 * duplicate and false-office checks, so they keep resurfacing near-repeats.
 *
 * Removes a draft when it is unapproved (no `approved:`, no `scheduledFor`) AND
 * either:
 *   - older than MAX_AGE_DAYS, or
 *   - a semantic near-duplicate of something already published.
 * Approved and scheduled drafts are never touched.
 *
 *   node scripts/clear-stale-drafts.mjs           # report only
 *   node scripts/clear-stale-drafts.mjs --apply   # actually delete
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLOG = path.join(ROOT, "src", "content", "blog");
const QUEUE = path.join(ROOT, "social", "queue");
const APPLY = process.argv.includes("--apply");
const MAX_AGE_DAYS = 14;

// Reads a YAML scalar, honouring quotes — titles can contain escaped quotes.
const field = (fm, name) => {
  const raw = fm.match(new RegExp(`^${name}:[ \\t]*(.*)$`, "m"))?.[1]?.trim() ?? "";
  if (raw.startsWith('"')) { const m = raw.match(/^"((?:[^"\\]|\\.)*)"/); return m ? m[1].replace(/\\(["\\])/g, "$1") : raw; }
  if (raw.startsWith("'")) { const m = raw.match(/^'((?:[^']|'')*)'/); return m ? m[1].replace(/''/g, "'") : raw; }
  return raw;
};

const now = Date.now();
const removed = [];

for (const f of fs.readdirSync(BLOG).filter((x) => x.endsWith(".md"))) {
  const raw = fs.readFileSync(path.join(BLOG, f), "utf8");
  const fm = (raw.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
  if (!/^draft:\s*true\s*$/m.test(fm)) continue;          // live posts: never
  if (field(fm, "approved") || field(fm, "scheduledFor")) continue; // approved: never

  const slug = f.replace(/\.md$/, "");
  const title = field(fm, "title");
  const written = Date.parse(field(fm, "pubDate"));
  const ageDays = Number.isFinite(written) ? Math.floor((now - written) / 864e5) : 999;

  let reason = null;
  if (ageDays > MAX_AGE_DAYS) reason = `unapproved for ${ageDays} days`;
  else if (process.env.GEMINI_API_KEY) {
    try {
      execFileSync("node", [path.join(ROOT, "scripts", "topic-memory.mjs"), "--check", title, field(fm, "description"), "--exclude", slug],
        { stdio: "pipe", env: process.env });
    } catch (e) {
      if (e.status === 1) {
        const near = (e.stdout?.toString().match(/closest existing: (\S+)\s+(.+)/) || []);
        reason = `near-duplicate of a published post (${near[1] || "?"})`;
      }
    }
  }
  if (!reason) continue;

  removed.push({ slug, title, reason });
  if (APPLY) {
    fs.rmSync(path.join(BLOG, f));
    fs.rmSync(path.join(QUEUE, slug), { recursive: true, force: true });
  }
}

if (!removed.length) { console.log("No stale or duplicate drafts — the pile is clear."); process.exit(0); }
console.log(`${APPLY ? "Removed" : "Would remove"} ${removed.length} draft(s):`);
for (const r of removed) console.log(`  ${r.slug}\n    "${r.title}" — ${r.reason}`);
