/**
 * Requests Google indexing for blog posts that flipped live in the last push.
 * Runs via index-on-publish.yml (push to main touching src/content/blog/**).
 *
 * This covers the "publish it now" path where an agent (e.g. the Cowork
 * auto-blog routine session) flips `draft: false` and pushes directly —
 * publishing without going through publish-scheduled.yml, which indexes its
 * own publishes. Commits made by publish-scheduled are skipped here so the
 * same URL isn't requested twice.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const SITE = "https://lulidigital.com";

function git(...args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const commitMessage = git("log", "-1", "--pretty=%s") ?? "";
if (/^Publish \d+ scheduled blog post/.test(commitMessage)) {
  console.log("Commit came from publish-scheduled (already indexes its posts). Skipping.");
  process.exit(0);
}

const changed = (git("diff", "--name-only", "HEAD^", "HEAD", "--", "src/content/blog") ?? "")
  .split("\n")
  .filter((f) => f.endsWith(".md"));

if (changed.length === 0) {
  console.log("No blog posts changed in this push.");
  process.exit(0);
}

const newlyLive = [];
for (const file of changed) {
  if (!existsSync(file)) continue; // deleted post — nothing to index

  const current = git("show", `HEAD:${file}`) ?? "";
  const currentDraft = /^draft:\s*true\s*$/m.test(current);
  if (currentDraft) continue; // still hidden

  const previous = git("show", `HEAD^:${file}`);
  const wasDraft = previous === null || /^draft:\s*true\s*$/m.test(previous);
  if (!wasDraft) continue; // was already live — an edit, not a publish

  const slug = file.split("/").pop().replace(/\.md$/, "");
  newlyLive.push(`${SITE}/blog/${slug}`);
}

if (newlyLive.length === 0) {
  console.log("No posts flipped live in this push. Nothing to index.");
  process.exit(0);
}

console.log(`Posts flipped live in this push:\n${newlyLive.map((u) => `  ${u}`).join("\n")}`);
for (const url of newlyLive) {
  try {
    execFileSync(process.execPath, ["scripts/request-indexing.mjs", url], {
      encoding: "utf8",
      stdio: "inherit",
    });
  } catch {
    // Indexing is best-effort; the recrawl workflow sweeps the sitemap anyway.
    console.error(`Indexing request failed for ${url} (non-fatal).`);
  }
}
