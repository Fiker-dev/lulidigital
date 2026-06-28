import { existsSync, readFileSync, writeFileSync } from "fs";
import { blogFilePath, normalizeBlogSlug, normalizePublishDate } from "./blog-paths.mjs";

const [slug, publishDate] = process.argv.slice(2);

if (!slug) {
  console.error("Usage: node scripts/publish-draft-post.mjs <slug> [YYYY-MM-DD]");
  process.exit(1);
}

let safeSlug;
let date;
try {
  safeSlug = normalizeBlogSlug(slug);
  date = normalizePublishDate(publishDate);
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

if (/^draft:\s*true\s*$/m.test(updated)) {
  updated = updated.replace(/^draft:\s*true\s*$/m, "draft: false");
} else if (!/^draft:\s*/m.test(updated)) {
  updated = updated.replace(/^---\n/, "---\ndraft: false\n");
}

if (/^pubDate:\s*.+$/m.test(updated)) {
  updated = updated.replace(/^pubDate:\s*.+$/m, `pubDate: ${date}`);
} else {
  updated = updated.replace(/^---\n/, `---\npubDate: ${date}\n`);
}

if (updated === original) {
  console.log("No draft changes needed.");
  process.exit(0);
}

writeFileSync(filePath, updated);
console.log(`Published draft ${safeSlug} for ${date}`);
