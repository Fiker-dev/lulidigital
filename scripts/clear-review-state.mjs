/**
 * Clears review_state from lana-memory.json for the given slug.
 * Called by publish-draft-blog.yml and delete-draft.yml after the
 * approval loop is resolved.
 * Usage: node scripts/clear-review-state.mjs <slug>
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { normalizeBlogSlug } from "./blog-paths.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rawSlug = process.argv[2];

if (!rawSlug) {
  console.error("Usage: node scripts/clear-review-state.mjs <slug>");
  process.exit(1);
}

let slug;
try {
  slug = normalizeBlogSlug(rawSlug);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const memoryPath = join(__dirname, "lana-memory.json");
if (!existsSync(memoryPath)) process.exit(0);

const memory = JSON.parse(readFileSync(memoryPath, "utf8"));

if (memory.review_state?.slug === slug) {
  memory.review_state = null;
  writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  console.log(`Review state cleared for: ${slug}`);
} else {
  console.log(`No active review state for: ${slug} (nothing to clear)`);
}
