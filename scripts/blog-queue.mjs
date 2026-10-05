/**
 * The blog queue, in one view.
 *
 * There was no single place showing what was waiting, so 18 drafts accumulated
 * unnoticed while nothing published for eight days. This prints the queue the
 * way the pipeline actually sees it, and is what the Claude routine reads
 * before asking Fiker to approve anything.
 *
 *   node scripts/blog-queue.mjs            # human view
 *   node scripts/blog-queue.mjs --json     # for the routine
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLOG = path.join(ROOT, "src", "content", "blog");
const JSON_OUT = process.argv.includes("--json");

const SLOTS = [1, 3, 5];               // Mon, Wed, Fri
const CAP = 3;                          // drafting pauses above this

// The last publish run of the day is 13:41 UTC, so a post approved this morning
// on a Mon/Wed/Fri can still go out TODAY. Only offering future dates is why
// Monday 2026-10-05 was skipped: the routine approved at 08:25, was handed
// Wednesday as the earliest slot, and a publishing day went by empty.
const LAST_PUBLISH_RUN_UTC = 13 * 60 + 41;
const nextSlots = (n) => {
  const out = [];
  const now = new Date();
  const minutesNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (SLOTS.includes(now.getUTCDay()) && minutesNow < LAST_PUBLISH_RUN_UTC) {
    out.push(now.toISOString().slice(0, 10));
  }
  const d = new Date(now);
  while (out.length < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (SLOTS.includes(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

const posts = fs.readdirSync(BLOG).filter((f) => f.endsWith(".md")).map((f) => {
  const raw = fs.readFileSync(path.join(BLOG, f), "utf8");
  const fm = (raw.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
  const g = (k) => (fm.match(new RegExp(`^${k}:\\s*["']?(.+?)["']?\\s*$`, "m")) || [])[1];
  return {
    slug: f.replace(/\.md$/, ""),
    title: g("title") || f,
    draft: /^draft:\s*true\s*$/m.test(fm),
    scheduledFor: g("scheduledFor") || null,
    pubDate: g("pubDate") || null,
    words: raw.split(/\s+/).length,
  };
});

const live      = posts.filter((p) => !p.draft).sort((a, b) => (b.pubDate || "").localeCompare(a.pubDate || ""));
const scheduled = posts.filter((p) => p.draft && p.scheduledFor).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
const waiting   = posts.filter((p) => p.draft && !p.scheduledFor).sort((a, b) => (a.pubDate || "").localeCompare(b.pubDate || ""));

const state = {
  live_latest: live.slice(0, 3),
  scheduled,
  waiting_approval: waiting,
  cap: CAP,
  drafting_paused: waiting.length >= CAP,
  next_free_slots: nextSlots(4).filter((d) => !scheduled.some((s) => s.scheduledFor === d)),
};

if (JSON_OUT) { console.log(JSON.stringify(state, null, 2)); process.exit(0); }

const line = (p, extra = "") => `   ${p.slug}${extra}\n      "${p.title}" · ${p.words}w`;
console.log(`\nLIVE — most recent`);
state.live_latest.forEach((p) => console.log(line(p, `  (${p.pubDate})`)));
console.log(`\nSCHEDULED — will publish themselves (${scheduled.length})`);
scheduled.length ? scheduled.forEach((p) => console.log(line(p, `  → ${p.scheduledFor}`))) : console.log("   (none)");
console.log(`\nWAITING ON FIKER — approve in the Claude routine (${waiting.length}/${CAP})`);
waiting.length ? waiting.forEach((p) => console.log(line(p, `  written ${p.pubDate}`))) : console.log("   (none)");
console.log(`\nNext free slots: ${state.next_free_slots.join(", ")}`);
console.log(state.drafting_paused
  ? `\n⏸  Drafting is PAUSED — ${waiting.length} waiting (cap ${CAP}). Approve or drop some and it resumes.`
  : `\n▶  Drafting is active — room for ${CAP - waiting.length} more.`);
