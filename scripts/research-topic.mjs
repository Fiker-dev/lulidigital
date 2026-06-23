/**
 * Gemini blog-topic research — the default topic source for scheduled posts.
 *
 * Blends three signals into one fresh, specific topic:
 *   1. Real search demand (Search Console keyword overrides)
 *   2. LuliDigital's services (AI automation, marketing, executive VA)
 *   3. Current, durable industry trends in AI / marketing / operations
 *
 * Grounded only: no fabricated stats, clients, or events. Avoids topics that
 * have already been published. Returns null on any failure so the caller can
 * fall back to the static rotation.
 *
 * Uses Gemini Flash (internal/structured job) per the model-routing policy.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateGeminiText, getGeminiApiKey } from "../src/lib/geminiFallback.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const CATEGORIES = ["AI Automation", "Virtual Assistant", "Digital Marketing", "General"];

function readPublishedTitles() {
  const dir = join(ROOT, "src", "content", "blog");
  if (!existsSync(dir)) return [];
  const titles = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    try {
      const raw = readFileSync(join(dir, file), "utf8");
      const m = raw.match(/^title:\s*"?([^"\n]+)"?/m);
      if (m) titles.push(m[1].trim());
    } catch {
      /* skip unreadable file */
    }
  }
  return titles;
}

function readKeywordSignals() {
  const path = join(ROOT, "src", "lib", "seo-keyword-overrides.json");
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    const all = [];
    for (const page of Object.values(data.pages ?? {})) {
      for (const kw of page.primary ?? []) all.push(kw);
    }
    return [...new Set(all)];
  } catch {
    return [];
  }
}

function parseTopic(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/^```json\n?/i, "").replace(/\n?```$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const t = JSON.parse(match[0]);
    if (!t.title || !t.keyword) return null;
    return {
      title: String(t.title).trim(),
      keyword: String(t.keyword).trim(),
      category: CATEGORIES.includes(t.category) ? t.category : "AI Automation",
      pain_point: t.pain_point ? String(t.pain_point).trim() : "",
      angle: t.angle ? String(t.angle).trim() : "",
      source: "gemini topic research",
    };
  } catch {
    return null;
  }
}

/**
 * Research one fresh blog topic. Returns a topic object or null on failure.
 *
 * Blend mode: when the regional SEO agent supplies `seoKeyword` and/or
 * `localTarget`, Gemini frames a sharp topic AROUND that real keyword and local
 * market, so we keep the search signal and the local internal link while gaining
 * trend-aware angles. The returned topic carries `localTarget` through.
 */
export async function researchBlogTopic({ seoKeyword = "", localTarget = null, region = "" } = {}) {
  if (!getGeminiApiKey()) {
    console.log("Gemini topic research skipped: no GEMINI_API_KEY.");
    return null;
  }

  const publishedTitles = readPublishedTitles();
  const keywordSignals = readKeywordSignals();
  const market = localTarget?.label || region || "";

  const system = `You are a senior content strategist for LuliDigital, a digital studio that provides AI workflow automation (AI Desk), performance marketing and SEO (Marketing Desk), and executive virtual assistant services (VA Desk) to founders and growing teams.

Primary markets: United Kingdom, European Union, and United States. Audience: time-poor founders, CEOs, and operators who are smart and allergic to fluff.

Your job: research and propose ONE fresh, specific, genuinely useful blog topic by blending THREE inputs:
1. Real search demand (the keyword signals provided).
2. LuliDigital's services (AI automation, marketing/SEO, executive VA).
3. Current, durable trends in AI, marketing, and business operations that you know to be real.

Hard rules:
- Ground everything in reality. Never invent statistics, named clients, studies, quotes, or events.
- The topic must NOT duplicate or closely overlap an already-published title.
- Prefer a sharp operational angle a founder can act on, not a generic listicle.
- The title must read like a human wrote it, not be keyword-stuffed.
- Keep the title CONCISE: under 65 characters (about 8 to 11 words). Short, sharp titles win.
- Do not put a city or country name in the title unless it genuinely belongs there.

Reply with a JSON object ONLY, no markdown:
{
  "title": "the blog post title",
  "keyword": "the primary SEO keyword to target naturally",
  "category": "AI Automation | Virtual Assistant | Digital Marketing | General",
  "pain_point": "the specific reader pain point this addresses",
  "angle": "the hook-led operational angle to take"
}`;

  const anchor = seoKeyword
    ? `PRIORITY ANCHOR from our regional SEO research — frame the topic so it naturally targets this keyword: "${seoKeyword}".`
    : "";
  const marketLine = market
    ? `Lean the angle toward this market where it fits naturally (do not force it into the title): ${market}.`
    : "";

  const user = `${anchor}
${marketLine}

Real search demand signals (from Search Console): ${keywordSignals.length ? keywordSignals.join(", ") : "(none yet — use service + trend judgement)"}

Already-published titles to avoid duplicating:
${publishedTitles.map((t) => `- ${t}`).join("\n") || "(none)"}

Propose one fresh topic now as JSON.`;

  try {
    const raw = await generateGeminiText({
      system,
      messages: [{ role: "user", content: user }],
      maxTokens: 1024,
      temperature: 0.7,
      thinkingBudget: 0, // disable thinking so the budget goes to the JSON answer
    });
    const topic = parseTopic(raw);
    if (topic) {
      if (localTarget) topic.localTarget = localTarget;
      console.log(`Gemini researched topic: "${topic.title}" (keyword: ${topic.keyword})${seoKeyword ? ` [blended with SEO: ${seoKeyword}]` : ""}`);
    } else {
      console.log("Gemini topic research returned no usable topic — falling back.");
      console.log("Raw Gemini output:", JSON.stringify(raw ?? "").slice(0, 500));
    }
    return topic;
  } catch (err) {
    console.log(`Gemini topic research failed: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}
