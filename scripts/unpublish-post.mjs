import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const [slug] = process.argv.slice(2);

if (!slug) {
  console.error("Usage: node scripts/unpublish-post.mjs <slug>");
  process.exit(1);
}

const safeSlug = slug.replace(/^\/?blog\//, "").replace(/\.md$/, "").trim();
const filePath = join(process.cwd(), "src", "content", "blog", `${safeSlug}.md`);

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
