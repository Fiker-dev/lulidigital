/**
 * Generate a Google Business Profile (GBP) post draft for LuliDigital.
 *
 * Semi-automation, paste-manual by design: this script only WRITES a draft.
 * Nothing is posted to Google. The GBP routine (routines/gbp-routine.md)
 * reviews the draft against the brand system, presents it in the Claude
 * session for approval, and — once approved — you paste it into the Google
 * Business Profile app/web yourself.
 *
 * Content generation uses Gemini Flash (an internal/structured job), matching
 * the model-routing convention in the repo. Requires GEMINI_API_KEY.
 *
 * Usage:
 *   node scripts/generate-gbp-post.mjs            # next post in rotation
 *   node scripts/generate-gbp-post.mjs --index 2  # force a specific slot
 *   node scripts/generate-gbp-post.mjs --dry-run  # print prompt, no API call
 *
 * State (rotation index + history) lives in social/gbp-queue/state.json so the
 * rotation advances across runs and never repeats the same angle week to week.
 * Drafts are written to social/gbp-queue/<YYYY-MM-DD>/ with a STATUS.md.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const QUEUE_DIR = join(ROOT, "social", "gbp-queue");
const STATE_PATH = join(QUEUE_DIR, "state.json");

const GEMINI_MODEL = "gemini-flash-latest";
const SITE = "lulidigital.com";
const SITE_URL = "https://lulidigital.com";

// Desk → service page, for the "Learn more" button on Service Spotlights.
const DESK_PATHS = {
  "AI Desk": "/ai-desk",
  "Marketing Desk": "/marketing-desk",
  "Web Design Desk": "/web-design-desk",
  "VA Desk": "/va-desk",
};

// ---------------------------------------------------------------------------
// Rotation strategy — 8 slots (~4 weeks at 2x/week) so no angle repeats weekly.
// Alternates a Service Spotlight (Mon) with an Operational Tip / Problem-
// Solution (Thu). Desks and focuses are grounded in the real service pages.
// ---------------------------------------------------------------------------
const ROTATION = [
  {
    type: "Service Spotlight",
    desk: "AI Desk",
    focus:
      "LuliDigital's AI Desk: custom AI virtual assistants, conversational AI, and agent implementation that remove administrative friction and hand founders back hours each day. Keep a human approving the important decisions.",
  },
  {
    type: "Operational Tip",
    desk: null,
    focus:
      "A concrete, do-it-today tip for founders on streamlining client onboarding with an intelligent voice/intake system and a simple workflow, so nothing falls through the cracks in the first week.",
  },
  {
    type: "Service Spotlight",
    desk: "Marketing Desk",
    focus:
      "LuliDigital's Marketing Desk: performance marketing, brand strategy, and SEO that helps founders get found and convert — steady growth systems, not hype.",
  },
  {
    type: "Problem-Solution",
    desk: "AI Desk",
    focus:
      "How automated workflows and AI agents stop missed leads and slow replies for service businesses — an enquiry answered in minutes instead of the next day, with a human still in the loop.",
  },
  {
    type: "Service Spotlight",
    desk: "VA Desk",
    focus:
      "LuliDigital's VA Desk: executive virtual assistant support for founders and CEOs — inbox, calendar, scheduling, and follow-ups handled so the founder's week goes back to the work only they can do.",
  },
  {
    type: "Operational Tip",
    desk: null,
    focus:
      "A quick efficiency tip on triaging an overflowing inbox and calendar: batching, one clear owner per task, and where a light-touch automation saves the most time.",
  },
  {
    type: "Service Spotlight",
    desk: "Web Design Desk",
    focus:
      "LuliDigital's Web Design Desk: premium websites and landing pages built to load fast and convert — clear next action, no template feel, accessible by default.",
  },
  {
    type: "Problem-Solution",
    desk: "Web Design Desk",
    focus:
      "How a slow or unclear website quietly loses buyers, and what a focused landing page with one obvious next step does for a founder's enquiries.",
  },
];

// ---------------------------------------------------------------------------
// Args + state
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { dryRun: false, index: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--index") args.index = Number(argv[++i]);
  }
  return args;
}

function loadState() {
  if (!existsSync(STATE_PATH)) return { index: 0, history: [] };
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { index: 0, history: [] };
  }
}

function saveState(state) {
  mkdirSync(QUEUE_DIR, { recursive: true });
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// Prompt — the brand guardrails live here so the generator is self-contained.
// ---------------------------------------------------------------------------
function buildPrompt(slot) {
  return `You are the marketing copywriter for LuliDigital, a studio that gives founders, operators, and small teams in the UK, Europe, and the US reliable marketing, AI automation, websites, and executive-support capacity without building internal departments.

Write ONE Google Business Profile update.

Category: ${slot.type}${slot.desk ? ` (${slot.desk})` : ""}
Core focus: ${slot.focus}

VOICE
- The reader's smartest operational friend: warm, plain-spoken, exact, quietly confident. Substance first, no filler.
- Talk to "you". Do NOT start the post with "I" or "We".

STRICT RULES
1. Under 80 words. Tight and specific.
2. No markdown or symbols for formatting — no asterisks, hashtags, bold, or emoji.
3. End with a short verbal call to action ("See how it works", "Book a quick call", "Start a conversation"). Do NOT put a URL, domain (${SITE}), or phone number in the post text — the link lives on the "Learn more" button, not the body.
4. Keep a human visible wherever automation is mentioned (approval stays with a person).
5. Never invent statistics, client names, results, or testimonials. No specific numbers you cannot stand behind.
6. Audience is UK / Europe / US founders and operators. Never mention Johannesburg, South Africa, or any location.
7. Banned words: game-changer, unlock, leverage, supercharge, journey, revolutionary, cutting-edge, seamless. No engagement bait ("comment below", "drop a like").

Return ONLY the post text — no preamble, no quotes, no label.`;
}

// ---------------------------------------------------------------------------
// "Learn more" button link — smart routing.
//   Service Spotlight  → the matching desk page (closest to a sale)
//   Tip / Problem-Solution → best-matching live blog post (the routine picks
//                            it in review; script leaves a marker + fallback)
// ---------------------------------------------------------------------------
function resolveLink(slot) {
  if (slot.type === "Service Spotlight" && DESK_PATHS[slot.desk]) {
    return { url: `${SITE_URL}${DESK_PATHS[slot.desk]}`, resolved: true };
  }
  return {
    url: SITE_URL,
    resolved: false,
    note: "routine picks the best-matching live blog post; homepage is the fallback",
  };
}

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------
async function generateWithGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error(
      "Missing GEMINI_API_KEY. Set it in the environment (it lives in GitHub Actions / the routine run prompt, not local .env)."
    );
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Gemini request failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    console.error("Gemini returned no text:", JSON.stringify(data, null, 2));
    process.exit(1);
  }
  // Strip any stray markdown the model may still emit.
  return text.replace(/[*#`]/g, "").replace(/\s+\n/g, "\n").trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2));
const state = loadState();
const index = args.index != null ? args.index : state.index;
const slot = ROTATION[index % ROTATION.length];
const prompt = buildPrompt(slot);

if (args.dryRun) {
  console.log(`# Slot ${index % ROTATION.length} — ${slot.type}${slot.desk ? ` / ${slot.desk}` : ""}\n`);
  console.log(prompt);
  process.exit(0);
}

const post = await generateWithGemini(prompt);

const date = new Date().toISOString().slice(0, 10);
const dayDir = join(QUEUE_DIR, date);
mkdirSync(dayDir, { recursive: true });

const label = (slot.desk || slot.type).toLowerCase().replace(/[^a-z0-9]+/g, "-");
const draftPath = join(dayDir, `gbp-${label}.txt`);
writeFileSync(draftPath, `${post}\n`);

const link = resolveLink(slot);
const learnMore = link.resolved ? link.url : `${link.url}  (${link.note})`;

// Per-draft status file (not a shared STATUS.md) so generating more than one
// post on the same day never clobbers an earlier draft's status.
const statusPath = join(dayDir, `STATUS-${label}.md`);
writeFileSync(
  statusPath,
  `awaiting_approval\n\ndate: ${date}\ntype: ${slot.type}\ndesk: ${slot.desk || "—"}\nwords: ${post.split(/\s+/).length}\nlearn_more: ${learnMore}\nfile: ${draftPath.replace(ROOT + "/", "")}\n`
);

// Advance rotation only when we actually generated (not on --index override).
if (args.index == null) {
  state.index = (index + 1) % ROTATION.length;
}
state.history = [
  { date, type: slot.type, desk: slot.desk || null, words: post.split(/\s+/).length },
  ...(state.history || []),
].slice(0, 30);
saveState(state);

console.log(`\n=== GBP DRAFT (${slot.type}${slot.desk ? ` — ${slot.desk}` : ""}) ===\n`);
console.log(post);
console.log(`\n(${post.split(/\s+/).length} words)`);
console.log(`Learn more → ${learnMore}`);
console.log(`\nWritten to: ${draftPath.replace(ROOT + "/", "")}`);
console.log(`Status:     ${statusPath.replace(ROOT + "/", "")}`);
