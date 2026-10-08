/**
 * Publishes any scheduled draft whose date has arrived. Scans the blog content
 * for posts that are draft:true AND have a `scheduledFor` date on or before
 * today, then flips them live: draft:false, pubDate set to the scheduled date,
 * and the scheduledFor marker removed. Drafts without a scheduledFor (still
 * awaiting approval) are never touched.
 *
 * Writes /tmp/published-scheduled.json (array of {slug,title,description,url})
 * for the workflow's indexing + Telegram steps. Run daily by
 * publish-scheduled.yml.
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { field as fmField } from "./frontmatter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BLOG_DIR = join(ROOT, "src", "content", "blog");
const SITE = "https://lulidigital.com";
const today = new Date().toISOString().slice(0, 10);

// Shared reader: the old pattern returned "" for titles containing quote marks,
// so "Sold \"AI Marketing.\"" went out as a "Blog live" message with no title —
// which the hollow-message guard then (correctly) refused to send.
const field = (fm, name) => fmField(fm, name);

const published = [];

// A standing queue, so the cadence stops depending on WHEN Fiker approves.
//
// Approving used to mean picking a date, which coupled the schedule to her
// being available at the right moment: on 2026-10-05 she approved at 08:25, the
// queue offered Wednesday as the earliest slot, and Monday went by empty —
// five days between posts instead of three. Every missed day this month traces
// to that, not to the pipeline.
//
// Now a draft can carry `approved: <date>` with no `scheduledFor`, meaning
// "cleared to go, date not important". On a publishing day with nothing already
// due, the publisher takes the oldest approved draft. Explicit scheduledFor
// still wins when she does want a specific date.
const SLOTS = [1, 3, 5]; // Mon, Wed, Fri
const isPublishingDay = SLOTS.includes(new Date().getUTCDay());

const readFm = (file) => {
  const raw = readFileSync(join(BLOG_DIR, file), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? { raw, fm: m[1] } : null;
};

const mdFiles = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

const alreadyDueToday = mdFiles.some((f) => {
  const p = readFm(f);
  if (!p) return false;
  const sched = field(p.fm, "scheduledFor");
  return /^draft:\s*true\s*$/m.test(p.fm) && sched && sched <= today;
});

// Has anything ALREADY gone live today? Publishing runs four times a day. On
// 2026-10-07 the 05:58 run published Wednesday's scheduled post; the 09:03 run
// then saw "nothing due" — because that post was already live — and promoted the
// Swiss post too. Two posts on Wednesday, and Friday's approved post gone early.
// The question is "has today's slot been used", not "is anything due right now".
const publishedToday = mdFiles.some((f) => {
  const p = readFm(f);
  return p && !/^draft:\s*true\s*$/m.test(p.fm) && field(p.fm, "pubDate") === today;
});

let promoted = null;
if (isPublishingDay && !alreadyDueToday && !publishedToday) {
  const queued = mdFiles
    .map((f) => ({ f, ...(readFm(f) || {}) }))
    .filter((x) => x.fm && /^draft:\s*true\s*$/m.test(x.fm))
    .filter((x) => !field(x.fm, "scheduledFor"))
    .filter((x) => field(x.fm, "approved"))
    .sort((a, b) => field(a.fm, "approved").localeCompare(field(b.fm, "approved")));

  if (queued.length) {
    promoted = queued[0];
    const withDate = promoted.raw.replace(
      /^---\r?\n/,
      `---\nscheduledFor: "${today}"\n`,
    );
    writeFileSync(join(BLOG_DIR, promoted.f), withDate);
    console.log(
      `Publishing day with nothing due — promoted the oldest approved draft: ${promoted.f.replace(/\.md$/, "")} (approved ${field(promoted.fm, "approved")})`,
    );
  } else {
    console.log("Publishing day with nothing due, and no approved drafts waiting.");
  }
} else if (isPublishingDay && publishedToday && !alreadyDueToday) {
  console.log("Today's slot is already used — leaving the approved queue for the next Mon/Wed/Fri.");
}

for (const file of readdirSync(BLOG_DIR)) {
  if (!file.endsWith(".md")) continue;
  const path = join(BLOG_DIR, file);
  const raw = readFileSync(path, "utf8");
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) continue;
  const fm = fmMatch[1];

  const isDraft = /^draft:\s*true\s*$/m.test(fm);
  const scheduledFor = field(fm, "scheduledFor");
  if (!isDraft || !scheduledFor) continue;
  // ISO YYYY-MM-DD compares correctly as strings.
  if (scheduledFor > today) continue;

  let updated = raw
    .replace(/^draft:\s*true\s*$/m, "draft: false")
    .replace(/^scheduledFor:\s*.*$\r?\n?/m, "")
    .replace(/^approved:\s*.*$\r?\n?/m, "");

  if (/^pubDate:\s*.+$/m.test(updated)) {
    updated = updated.replace(/^pubDate:\s*.+$/m, `pubDate: ${scheduledFor}`);
  } else {
    updated = updated.replace(/^---\n/, `---\npubDate: ${scheduledFor}\n`);
  }

  writeFileSync(path, updated);
  const slug = file.replace(/\.md$/, "");
  published.push({
    slug,
    title: field(fm, "title"),
    description: field(fm, "description"),
    url: `${SITE}/blog/${slug}`,
    pubDate: scheduledFor,
  });
  console.log(`Published scheduled post: ${slug} (was due ${scheduledFor})`);
}

writeFileSync("/tmp/published-scheduled.json", JSON.stringify(published));
console.log(`Total published: ${published.length}`);

// Keep lana-memory.json in sync so the routines' state never drifts: advance
// latest_live_post, prune published slugs from pending_drafts, and clear a
// review_state that points at a post we just published. (Without this the
// state goes stale — Amara anchors to the wrong post and the blog routine can
// skip a slot thinking a post is still "scheduled".)
if (published.length > 0) {
  const memoryPath = join(__dirname, "lana-memory.json");
  try {
    const memory = JSON.parse(readFileSync(memoryPath, "utf8"));
    const publishedSlugs = new Set(published.map((p) => p.slug));
    const newest = published.reduce((a, b) => (b.pubDate >= a.pubDate ? b : a));

    memory.latest_live_post = { slug: newest.slug, title: newest.title, published_at: newest.pubDate };

    if (Array.isArray(memory.pending_drafts)) {
      memory.pending_drafts = memory.pending_drafts.filter((s) => !publishedSlugs.has(s));
    }
    if (memory.review_state && publishedSlugs.has(memory.review_state.slug)) {
      memory.review_state = null;
    }

    writeFileSync(memoryPath, `${JSON.stringify(memory, null, 2)}\n`);
    console.log(`Synced lana-memory.json → latest_live_post=${newest.slug}, pending_drafts pruned.`);
  } catch (err) {
    console.error("Warning: could not sync lana-memory.json:", err.message);
  }
}
