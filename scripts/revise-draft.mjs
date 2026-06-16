/**
 * Revises an existing draft blog post based on Fiker's editorial instructions.
 * Called by revise-draft.yml.
 * Reads: src/content/blog/${slug}.md
 * Writes: updated file + lana-memory.json (increments revision_count, updates preview)
 * Outputs: /tmp/review_preview.txt for the Telegram notification step.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const slug                 = process.env.REVISION_SLUG;
const revisionInstructions = process.env.REVISION_INSTRUCTIONS;

if (!slug || !revisionInstructions) {
  console.error("REVISION_SLUG and REVISION_INSTRUCTIONS are required");
  process.exit(1);
}

const filePath = join(ROOT, "src", "content", "blog", `${slug}.md`);
if (!existsSync(filePath)) {
  console.error(`Draft not found: ${filePath}`);
  process.exit(1);
}

const currentContent = readFileSync(filePath, "utf8");

// Split frontmatter from body
const parts = currentContent.split(/^---$/m);
const frontmatter = parts[1] ?? "";
const body        = parts.slice(2).join("---").trim();

// ── Call Claude to revise ─────────────────────────────────────────────────────
const systemPrompt = `You are a senior content editor for LuliDigital, a digital studio for founders.

You are revising an existing blog post based on editorial feedback. Apply only the changes requested — keep everything else intact.

Writing standards:
- Plain, confident English. No corporate jargon.
- Practical and specific. Real examples beat vague advice.
- Human and relatable — humor from recognizable business pain, never silly.
- Lead with the problem, give relief, show the operational solution.
- No filler sentences.
- No em dashes. Use commas or short sentences instead.
- No bullet-point-heavy content. Write in paragraphs.
- Target length: 1100 to 1400 words.

Return ONLY a JSON object:
{
  "content": "the full revised markdown body (no frontmatter, ## for H2 headings)"
}`;

const userPrompt = `Current blog post body:

${body}

Editorial instructions:
${revisionInstructions}

Apply these changes to the full article. Return the complete revised body.`;

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  }),
});

if (!response.ok) {
  console.error("Anthropic API error:", await response.text());
  process.exit(1);
}

const data = await response.json();
const raw  = data.content[0].text.trim();

let revised;
try {
  const match = raw.match(/\{[\s\S]*\}/);
  revised = JSON.parse(match[0]);
} catch {
  console.error("Failed to parse revision response:", raw.slice(0, 300));
  process.exit(1);
}

// ── Write revised file ────────────────────────────────────────────────────────
writeFileSync(filePath, `---\n${frontmatter}---\n\n${revised.content}`);
console.log(`Revised draft: ${slug}`);

// ── Extract new preview paragraph ────────────────────────────────────────────
const newBody    = revised.content;
const paragraphs = newBody.split(/\n\n+/).filter(p => p.trim() && !p.startsWith("#") && !p.startsWith("---"));
const newPreview = (paragraphs[0] || "")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/\*\*([^*]+)\*\*/g, "$1")
  .replace(/\*([^*]+)\*/g, "$1")
  .trim()
  .slice(0, 350);

// ── Update review_state in memory ────────────────────────────────────────────
const memoryPath = join(__dirname, "lana-memory.json");
const memory = existsSync(memoryPath)
  ? JSON.parse(readFileSync(memoryPath, "utf8"))
  : { pending_post: null, pending_drafts: [] };

if (memory.review_state) {
  memory.review_state.revision_count = (memory.review_state.revision_count || 0) + 1;
  memory.review_state.preview_text   = newPreview;
}

writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
writeFileSync("/tmp/review_preview.txt", newPreview);

const count = memory.review_state?.revision_count ?? 1;
console.log(`Revision ${count} complete for: ${slug}`);
