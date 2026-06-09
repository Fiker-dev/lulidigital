/**
 * Reads the generated draft, extracts a preview paragraph, calculates the
 * next Mon/Wed/Fri posting slot, and writes review_state to lana-memory.json.
 * Called by auto-blog.yml immediately after generate-post.mjs for draft runs.
 * Outputs /tmp/review_preview.txt and /tmp/review_scheduled_for.txt for the
 * subsequent Telegram notification step.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const slug        = readFileSync("/tmp/post_slug.txt",        "utf8").trim();
const title       = readFileSync("/tmp/post_title.txt",       "utf8").trim();
const description = readFileSync("/tmp/post_description.txt", "utf8").trim();

// ── Extract first real paragraph from the generated post ──────────────────────
const filePath = join(ROOT, "src", "content", "blog", `${slug}.md`);
const raw      = readFileSync(filePath, "utf8");
const bodyMatch = raw.match(/^---[\s\S]*?---\n+([\s\S]*)$/);
const body     = bodyMatch ? bodyMatch[1].trim() : "";
const paragraphs = body.split(/\n\n+/).filter(p => p.trim() && !p.startsWith("#") && !p.startsWith("---"));
const previewText = (paragraphs[0] || description)
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")   // strip markdown links
  .replace(/\*\*([^*]+)\*\*/g, "$1")          // strip bold
  .replace(/\*([^*]+)\*/g, "$1")              // strip italic
  .trim()
  .slice(0, 350);

// ── Calculate next Mon / Wed / Fri ────────────────────────────────────────────
const now  = new Date();
const day  = now.getDay();
const slots = [1, 3, 5]; // Mon=1, Wed=3, Fri=5
let scheduledFor = "";
for (let i = 1; i <= 7; i++) {
  if (slots.includes((day + i) % 7)) {
    const next = new Date(now);
    next.setDate(now.getDate() + i);
    scheduledFor = next.toISOString().split("T")[0];
    break;
  }
}

// ── Persist review_state ──────────────────────────────────────────────────────
const memoryPath = join(__dirname, "lana-memory.json");
const memory = existsSync(memoryPath)
  ? JSON.parse(readFileSync(memoryPath, "utf8"))
  : { pending_post: null, pending_drafts: [] };

memory.review_state = {
  slug,
  title,
  description,
  preview_text: previewText,
  scheduled_for: scheduledFor,
  revision_count: 0,
  status: "awaiting_approval",
};

writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
console.log(`Review state saved: slug=${slug}, scheduled=${scheduledFor}`);

// ── Write for the workflow's Telegram step ────────────────────────────────────
writeFileSync("/tmp/review_scheduled_for.txt", scheduledFor);
writeFileSync("/tmp/review_preview.txt",       previewText);
