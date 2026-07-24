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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BLOG_DIR = join(ROOT, "src", "content", "blog");
const SITE = "https://lulidigital.com";
const today = new Date().toISOString().slice(0, 10);

const field = (fm, name) =>
  fm.match(new RegExp(`^${name}:\\s*"?([^"\\n]+?)"?\\s*$`, "m"))?.[1]?.trim() ?? "";

const published = [];

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
    .replace(/^scheduledFor:\s*.*$\r?\n?/m, "");

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
