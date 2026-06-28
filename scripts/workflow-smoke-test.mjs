import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const sandbox = mkdtempSync(join(tmpdir(), "luli-workflow-smoke-"));
const scriptNames = [
  "blog-paths.mjs",
  "publish-draft-post.mjs",
  "unpublish-post.mjs",
  "delete-draft-post.mjs",
  "clear-review-state.mjs",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(script, args = []) {
  execFileSync(process.execPath, [join(sandbox, "scripts", script), ...args], {
    cwd: sandbox,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runFailure(script, args = [], expectedStatus = 1) {
  const result = spawnSync(process.execPath, [join(sandbox, "scripts", script), ...args], {
    cwd: sandbox,
    encoding: "utf8",
  });
  assert(result.status === expectedStatus, `${script} expected exit ${expectedStatus}, got ${result.status}`);
  return result;
}

function postPath(slug) {
  return join(sandbox, "src", "content", "blog", `${slug}.md`);
}

function writePost(slug, draft) {
  writeFileSync(postPath(slug), `---
title: "Workflow Smoke Test"
description: "Temporary workflow smoke test post."
pubDate: 2026-01-01
category: "AI Automation"
readingTime: "1 min read"
draft: ${draft}
---

Body.
`);
}

try {
  mkdirSync(join(sandbox, "scripts"), { recursive: true });
  mkdirSync(join(sandbox, "src", "content", "blog"), { recursive: true });
  for (const name of scriptNames) {
    cpSync(join(repoRoot, "scripts", name), join(sandbox, "scripts", name));
  }

  const slug = "workflow-smoke-test-draft";
  writePost(slug, true);
  writeFileSync(join(sandbox, "scripts", "lana-memory.json"), JSON.stringify({
    pending_post: null,
    pending_drafts: [slug],
    review_state: {
      slug,
      scheduled_for: "2026-06-26",
      status: "awaiting_approval",
    },
  }, null, 2));

  run("publish-draft-post.mjs", [`https://lulidigital.com/blog/${slug}.md`, "2026-06-26"]);
  let raw = readFileSync(postPath(slug), "utf8");
  assert(/^draft:\s*false\s*$/m.test(raw), "publish should set draft false");
  assert(/^pubDate:\s*2026-06-26\s*$/m.test(raw), "publish should set requested date");

  run("clear-review-state.mjs", [slug]);
  let memory = JSON.parse(readFileSync(join(sandbox, "scripts", "lana-memory.json"), "utf8"));
  assert(memory.review_state === null, "clear-review-state should clear matching review state");

  run("unpublish-post.mjs", [`/blog/${slug}.md`]);
  raw = readFileSync(postPath(slug), "utf8");
  assert(/^draft:\s*true\s*$/m.test(raw), "unpublish should set draft true");

  run("delete-draft-post.mjs", [slug]);
  assert(!existsSync(postPath(slug)), "delete should remove draft file");

  writePost("published-post", false);
  runFailure("delete-draft-post.mjs", ["published-post"], 1);
  assert(existsSync(postPath("published-post")), "delete should refuse published posts");

  writePost("bad-date-post", true);
  runFailure("publish-draft-post.mjs", ["bad-date-post", "2026-99-99"], 1);
  raw = readFileSync(postPath("bad-date-post"), "utf8");
  assert(/^draft:\s*true\s*$/m.test(raw), "bad date should leave draft unchanged");

  runFailure("publish-draft-post.mjs", ["../secrets", "2026-06-26"], 1);
  runFailure("unpublish-post.mjs", ["../secrets"], 1);
  runFailure("delete-draft-post.mjs", ["definitely-not-real"], 2);

  console.log("Workflow smoke tests passed.");
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
