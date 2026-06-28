import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { blogFilePath, normalizeBlogSlug } from "./blog-paths.mjs";

const [rawSlug] = process.argv.slice(2);

if (!rawSlug) {
  console.error("Usage: node scripts/delete-draft-post.mjs <slug>");
  process.exit(1);
}

let slug;
try {
  slug = normalizeBlogSlug(rawSlug);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const filePath = blogFilePath(process.cwd(), slug);
if (!existsSync(filePath)) {
  console.error(`Draft not found: ${filePath}`);
  process.exit(2);
}

const raw = readFileSync(filePath, "utf8");
if (!/^draft:\s*true\s*$/m.test(raw)) {
  console.error(`Refusing to delete a published post: ${slug}`);
  process.exit(1);
}

unlinkSync(filePath);
console.log(`Deleted draft: ${slug}`);
