import { existsSync, readFileSync, writeFileSync } from "fs";
import { blogFilePath, normalizeBlogSlug } from "./blog-paths.mjs";

const [slug] = process.argv.slice(2);

if (!slug) {
  console.error("Usage: node scripts/unpublish-post.mjs <slug>");
  process.exit(1);
}

let safeSlug;
try {
  safeSlug = normalizeBlogSlug(slug);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const filePath = blogFilePath(process.cwd(), safeSlug);

if (!existsSync(filePath)) {
  console.error(`Post not found: ${filePath}`);
  process.exit(1);
}

const original = readFileSync(filePath, "utf8");
let updated = original;

if (/^draft:\s*false\s*$/m.test(updated)) {
  updated = updated.replace(/^draft:\s*false\s*$/m, "draft: true");
} else if (/^draft:\s*true\s*$/m.test(updated)) {
  console.log("Already unpublished.");
  process.exit(0);
} else {
  updated = updated.replace(/^---\n/, "---\ndraft: true\n");
}

writeFileSync(filePath, updated);
console.log(`Unpublished: ${safeSlug}`);
