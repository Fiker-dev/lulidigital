/**
 * Marks an existing draft as scheduled for a future date without publishing it.
 * The post stays draft:true (fully hidden from the index, sitemap, direct URL,
 * and notifications) and gets a `scheduledFor: YYYY-MM-DD` field. The daily
 * Publish Scheduled Posts workflow flips it live + indexes it on that date.
 *
 * Usage: node scripts/schedule-draft-post.mjs <slug> <YYYY-MM-DD>
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { blogFilePath, normalizeBlogSlug, normalizePublishDate } from "./blog-paths.mjs";

const [slug, date] = process.argv.slice(2);

if (!slug || !date) {
  console.error("Usage: node scripts/schedule-draft-post.mjs <slug> <YYYY-MM-DD>");
  process.exit(1);
}

let safeSlug;
let safeDate;
try {
  safeSlug = normalizeBlogSlug(slug);
  safeDate = normalizePublishDate(date);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const filePath = blogFilePath(process.cwd(), safeSlug);
if (!existsSync(filePath)) {
  console.error(`Draft not found: ${filePath}`);
  process.exit(1);
}

const original = readFileSync(filePath, "utf8");
let updated = original;

// Keep it hidden until the cron publishes it.
if (/^draft:\s*false\s*$/m.test(updated)) {
  updated = updated.replace(/^draft:\s*false\s*$/m, "draft: true");
} else if (!/^draft:\s*/m.test(updated)) {
  updated = updated.replace(/^---\n/, "---\ndraft: true\n");
}

// Set (or update) the scheduled date.
if (/^scheduledFor:\s*.*$/m.test(updated)) {
  updated = updated.replace(/^scheduledFor:\s*.*$/m, `scheduledFor: ${safeDate}`);
} else {
  updated = updated.replace(/^---\n/, `---\nscheduledFor: ${safeDate}\n`);
}

if (updated === original) {
  console.log("No changes needed.");
  process.exit(0);
}

writeFileSync(filePath, updated);
console.log(`Scheduled ${safeSlug} for ${safeDate}`);
