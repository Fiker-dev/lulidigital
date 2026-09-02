/**
 * Builds the LinkedIn company announcement pack for a blog post.
 *
 * Why this exists: the announcement used to be written by the Social Team
 * routine "on its next run", so when a post went live and the routine hadn't
 * run yet, Telegram got "announcement isn't written yet" instead of the
 * announcement. This runs at APPROVAL time, so the pack is always sitting
 * ready before the post is live.
 *
 * Writes into social/queue/<slug>/:
 *   linkedin-company.md          the caption (+ FIRST COMMENT link)
 *   announce-brief.md            card fields
 *   linkedin-company-asset.png   rendered fallback card (CI-safe, sharp only)
 *   announce-video-script.json   beats + VO lines for the local Remotion render
 *
 * The video itself is rendered on the Mac (Remotion + the cloned voice), which
 * cannot run in CI. send-announcement-telegram.mjs prefers the .mp4 when it is
 * there and falls back to this card when it is not.
 *
 * Usage: node scripts/generate-blog-announcement.mjs --slug <slug> [--force]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const args = process.argv.slice(2);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const slug = val("--slug");
const force = args.includes("--force");
if (!slug) throw new Error("Usage: --slug <slug> [--force]");

const postPath = join(ROOT, "src", "content", "blog", `${slug}.md`);
if (!existsSync(postPath)) throw new Error(`No such post: ${postPath}`);

const raw = readFileSync(postPath, "utf8");
const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
const field = (n) => fm.match(new RegExp(`^${n}:\\s*["']?(.+?)["']?\\s*$`, "mi"))?.[1] ?? "";
const title = field("title");
const description = field("description");
const body = raw.replace(/^---[\s\S]*?---\n/, "").trim();
const url = `https://lulidigital.com/blog/${slug}`;

const outDir = join(ROOT, "social", "queue", slug);
const capPath = join(outDir, "linkedin-company.md");
if (existsSync(capPath) && !force) {
  console.log(`Announcement already exists for ${slug} — leaving it alone (use --force to rewrite).`);
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });

// ── Ask Claude for the announcement (a voice job, so Claude not Gemini) ───────
const PROMPT = `You write the LuliDigital COMPANY LinkedIn page announcement for a new blog post.

CONSTRAINTS — these are absolute:
- LuliDigital is one person (Fiker) plus AI systems. NEVER write "we", "our team", "us", or imply staff. Write about the WORK, impersonally, or address the reader directly as "you".
- Never invent stats, clients, testimonials, case studies, or events.
- Never say the company is based in a specific city.
- Audience: founders and small/medium business owners in the UK, EU and US.

TONE: the company page leads with the work — grounded, direct, useful. Lively and
relatable, not stiff corporate. Short paragraphs. No hashtag spam (zero or one).

STRUCTURE the caption exactly like this:
1. "New on the blog." on its own line.
2. The post title on its own line.
3. One short quoted line pulled from the post that lands the idea.
4. Two short paragraphs that EXTEND the idea — give away something genuinely
   useful so the caption stands alone even if nobody clicks.
5. One line saying what the full piece covers.
6. The final line must be exactly: Full read in the first comment.

ALSO return a card brief and a 6-beat video script. Each beat is ONE short
spoken sentence (max 14 words) that reads naturally aloud, plus the 2-5 word
on-screen line for that beat. Beat 1 hooks, beats 2-5 carry the idea, beat 6 is
the CTA and must say the blog link is in the comments.

Return ONLY valid JSON, no markdown fence:
{
  "caption": "...",
  "eyebrow": "LULIDIGITAL · NEW ARTICLE",
  "headline": "short punchy headline, max 8 words",
  "pull": "one line, max 16 words",
  "pose": "one of: idea, laptop, coffee, celebrate, story-phone, story-relax",
  "beats": [{"vo": "...", "screen": "...", "reaction": "one of: idea, laptop, coffee, celebrate, story-phone, story-relax"}]
}

POST TITLE: ${title}
POST DESCRIPTION: ${description}

POST BODY:
${body.slice(0, 9000)}`;

const key = process.env.ANTHROPIC_API_KEY;
if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: PROMPT }],
  }),
});
if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
const text = (await res.json()).content?.[0]?.text ?? "";
const json = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());

// ── Guard the constraints that matter most, rather than trusting the model ────
if (/\b(we|our|us)\b/i.test(json.caption.replace(/\byou\b/gi, ""))) {
  console.warn("WARNING: caption may use team language ('we'/'our') — review before posting.");
}

// ── Caption pack, in the shape send-announcement-telegram.mjs parses ──────────
const capBody = `<!-- asset: video preferred (announce-video), card fallback — paste-only -->
<!-- post the blog link as the FIRST COMMENT, not in the body: ${url} -->
<!-- Generated at approval time by scripts/generate-blog-announcement.mjs so the
     pack is ready before the post goes live. -->

${json.caption.trim()}

---
FIRST COMMENT:
${url}
`;
writeFileSync(capPath, capBody);

// ── Card brief + render (sharp only, so this works in CI) ─────────────────────
const briefPath = join(outDir, "announce-brief.md");
writeFileSync(briefPath, `Eyebrow: ${json.eyebrow}\nHeadline: ${json.headline}\nPull-line: ${json.pull}\nPose: ${json.pose}\n`);
const cardPath = join(outDir, "linkedin-company-asset.png");
try {
  execFileSync("node", [join(ROOT, "scripts", "render-linkedin-minime-card.mjs"), "--brief", briefPath, "--out", cardPath], { stdio: "inherit" });
} catch (err) {
  console.warn(`Card render failed (caption still delivered): ${err.message}`);
}

// ── Video script for the local Remotion render ────────────────────────────────
// A pose that has no PNG kills the render half an hour in, so pin anything
// unexpected back to a pose that exists rather than trusting the model.
const POSES = ["idea", "laptop", "coffee", "celebrate", "story-phone", "story-relax"];
const beats = (json.beats ?? []).map((b) => ({
  ...b,
  reaction: POSES.includes(b.reaction) ? b.reaction : "idea",
}));
writeFileSync(join(outDir, "announce-video-script.json"), JSON.stringify({
  slug, title, url,
  note: "Render on the Mac: BlogAnnounce.tsx + the cloned voice. Output blog-announce-video.mp4 into this folder.",
  beats,
}, null, 2));

console.log(`Announcement pack ready: social/queue/${slug}/`);
console.log(`  caption: linkedin-company.md`);
console.log(`  card:    ${existsSync(cardPath) ? "linkedin-company-asset.png" : "(render failed)"}`);
console.log(`  video:   announce-video-script.json (render locally)`);
