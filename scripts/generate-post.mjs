import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getBestRegionalSeoRecommendation, inferSeoCategory } from "../src/lib/seoAgent.js";
import { researchBlogTopic } from "./research-topic.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const topicsPath = join(__dirname, "blog-topics.json");
const memoryPath = join(__dirname, "lana-memory.json");
const topicsData = JSON.parse(readFileSync(topicsPath, "utf8"));
const memory = existsSync(memoryPath) ? JSON.parse(readFileSync(memoryPath, "utf8")) : { pending_post: null, pending_drafts: [] };

// When GitHub dispatches the workflow with explicit env vars (from Telegram),
// those must win over stale queued memory. Only use memory when no env vars present.
const hasExplicitEnvVars = !!(process.env.BLOG_TOPIC || process.env.BLOG_DRAFT);
const queued = hasExplicitEnvVars ? null : memory.pending_post;

// Planned blog queue: populated by Lana when Fiker plans multiple posts.
// Consumed one item per blog run when no higher-priority source is active.
const planQueue = memory.blog_plan_queue ?? [];
const queuedPlan = !hasExplicitEnvVars && !memory.pending_post && planQueue.length > 0
  ? planQueue[0]
  : null;

// SEO opportunity queue: populated monthly by run-seo-audit.mjs.
// Consumed one item per blog run when no higher-priority source is active.
const seoQueue = memory.seo_opportunity_queue ?? [];
const queuedSeo = !hasExplicitEnvVars && !memory.pending_post && !queuedPlan && seoQueue.length > 0
  ? seoQueue[0]
  : null;

const index = topicsData.published_count % topicsData.topics.length;
// Priority order: explicit env vars → pending_post (Telegram) → blog_plan_queue → seo_opportunity_queue → live Trends → fallback rotation
const customTitle = queued?.topic || queuedPlan?.topic || queuedSeo?.topic || process.env.BLOG_TOPIC?.trim();
const customKeyword = queued?.keyword || queuedPlan?.keyword || queuedSeo?.keyword || process.env.BLOG_KEYWORD?.trim();
const customCategory = queued?.category || queuedPlan?.category || queuedSeo?.category || process.env.BLOG_CATEGORY?.trim();
const customPainPoint = queued?.pain_point || queuedPlan?.pain_point || queuedSeo?.pain_point || process.env.BLOG_PAIN_POINT?.trim();
const customAngle = queued?.angle || queuedPlan?.angle || queuedSeo?.angle || process.env.BLOG_ANGLE?.trim();
const customToneNotes = queued?.tone_notes || queuedPlan?.tone_notes || queuedSeo?.tone_notes || process.env.BLOG_TONE_NOTES?.trim();
const customSourceNotes = queued?.source_notes || queuedPlan?.source_notes || process.env.BLOG_SOURCE_NOTES?.trim();
const customSourceUrl = queued?.source_url || queuedPlan?.source_url || process.env.BLOG_SOURCE_URL?.trim();
const customFikerTake = queued?.fiker_take || queuedPlan?.fiker_take || process.env.BLOG_FIKER_TAKE?.trim();
const customCta = queued?.cta_text || process.env.BLOG_CTA_TEXT?.trim() || null;
const customCtaLink = queued?.cta_link || process.env.BLOG_CTA_LINK?.trim() || null;
const useSeoAgent = !queued && !queuedSeo && process.env.BLOG_USE_SEO_AGENT === "true";
// BLOG_DRAFT env var always wins when explicitly provided by a workflow dispatch.
// Only fall back to queued memory's draft flag for cron-scheduled runs.
const isDraft = process.env.BLOG_DRAFT !== undefined && process.env.BLOG_DRAFT !== ""
  ? process.env.BLOG_DRAFT === "true"
  : (queued?.draft ?? false);

if (queued) {
  console.log(`Using queued instructions from LANa memory: "${queued.topic || "(SEO auto)"}"`);
} else if (queuedPlan) {
  console.log(`Using planned blog queue item from LANa memory: "${queuedPlan.topic || "(planned post)"}"`);
}
const seoRecommendation = !customTitle && useSeoAgent
  ? await getBestRegionalSeoRecommendation({ forceRefresh: true })
  : null;
const localTargets = {
  AFRICA: { label: "Africa Growth Desk", path: "/africa" },
  NL: { label: "Amsterdam Studio", path: "/amsterdam" },
  DE: { label: "Munich Studio", path: "/munich" },
  SE: { label: "Stockholm Studio", path: "/stockholm" },
  GB: { label: "UK Studio", path: "/united-kingdom" },
  US: { label: "US Studio", path: "/united-states" },
  DK: { label: "Denmark Studio", path: "/denmark" },
  CH: { label: "Switzerland Studio", path: "/switzerland" },
  IE: { label: "Ireland Studio", path: "/ireland" },
  BE: { label: "Belgium Studio", path: "/belgium" },
  NO: { label: "Norway Studio", path: "/norway" },
};
const localTarget = seoRecommendation ? localTargets[seoRecommendation.geo] : null;

// Default topic source: Gemini researches a fresh, trend-aware topic. When the
// regional SEO agent has a recommendation, Gemini BLENDS it — framing a sharp
// topic around that real keyword + local market — so we keep the search signal
// and the local internal link while gaining trend-aware angles. Falls through to
// the SEO agent's own topic, then the static rotation, if Gemini returns null.
const geminiTopic = !customTitle
  ? await researchBlogTopic({
      seoKeyword: seoRecommendation?.keyword,
      localTarget,
      region: seoRecommendation?.geo,
    })
  : null;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
}

function naturalSeoTopic(recommendation) {
  const keyword = recommendation.keyword;
  const geoLabel = localTargets[recommendation.geo]?.label?.replace(" Studio", "") ?? "global teams";
  const lower = keyword.toLowerCase();

  if (lower.includes("seo")) {
    return {
      title: `Why SEO Falls Apart When It Is Treated Like a Side Task`,
      angle: `Use ${keyword} as the research target, but write for founders across ${geoLabel} and similar markets. Explain the operational problem behind poor SEO without repeating the keyword awkwardly.`,
    };
  }

  if (lower.includes("virtual assistant") || lower.includes("executive assistant")) {
    return {
      title: `The Founder Support System That Stops Small Tasks Becoming Big Problems`,
      angle: `Use ${keyword} as the research target, but make the article feel like practical operating advice for teams in ${geoLabel} and other active LuliDigital markets.`,
    };
  }

  if (lower.includes("ai") || lower.includes("automation") || lower.includes("agent")) {
    return {
      title: `The AI Automations Worth Building Before Your Team Gets Busier`,
      angle: `Use ${keyword} as the research target, but avoid turning the location or keyword into the headline. Write across ${geoLabel} and other international teams.`,
    };
  }

  return {
    title: `The Cleaner Growth System Most Busy Teams Are Missing`,
    angle: `Use ${keyword} as the research target, but keep the headline human and useful. Mention ${geoLabel} naturally only where it helps the reader.`,
  };
}

function titleLooksStuffed(title, keyword) {
  const normalizedTitle = title.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  const keywordWords = normalizedKeyword.split(/[^a-z0-9]+/).filter((word) => word.length > 3);
  const repeatedKeywordWords = keywordWords.filter((word) => (normalizedTitle.match(new RegExp(`\\b${word}\\b`, "g")) || []).length > 1);

  return (
    normalizedTitle.includes(`how to use ${normalizedKeyword}`) ||
    normalizedTitle.includes("build a cleaner business system") ||
    repeatedKeywordWords.length >= 2 ||
    title.length > 100
  );
}

function slugLooksStuffed(slug) {
  return (
    slug.length > 74 ||
    /^how-to-use-.+-build-(a-)?cleaner-business-system$/.test(slug) ||
    /(.+-){9,}/.test(slug)
  );
}

function contentLooksFabricated(content) {
  const patterns = [
    /\bone client (called|told|said|asked|messaged)\b/i,
    /\ba client (called|told|said|asked|messaged)\b/i,
    /\ba founder (called|told|said|asked|messaged)\b/i,
    /\bone founder (called|told|said|asked|messaged)\b/i,
    /\bwe worked with (a|one) (client|founder|team)\b/i,
    /\bI (once|remember|used to|worked with|had a client)\b/i,
    /\btrue story\b/i,
  ];

  return patterns.find((pattern) => pattern.test(content))?.source ?? "";
}

const naturalSeo = seoRecommendation ? naturalSeoTopic(seoRecommendation) : null;
const seoAgentTopic = seoRecommendation
  ? {
      title: naturalSeo.title,
      category: customCategory || inferSeoCategory(seoRecommendation.keyword),
      keyword: customKeyword || seoRecommendation.keyword,
      angle: naturalSeo.angle,
      source: seoRecommendation.source,
      localTarget,
    }
  : null;

// Priority: explicit/queued title → Gemini research (blended) → SEO agent → rotation.
const isCustomTopic = Boolean(customTitle || geminiTopic || seoAgentTopic);
const topic = customTitle
  ? {
      title: customTitle,
      category: customCategory || "AI Automation",
      keyword: customKeyword || customTitle,
    }
  : geminiTopic ?? seoAgentTopic ?? topicsData.topics[index];

console.log(`Generating ${isCustomTopic ? "custom" : `post ${topicsData.published_count + 1}`}: "${topic.title}"`);

if (seoAgentTopic) {
  console.log(`SEO agent keyword: "${seoAgentTopic.keyword}" from ${seoAgentTopic.source}`);
  if (seoAgentTopic.localTarget) {
    console.log(`Local landing page target: ${seoAgentTopic.localTarget.path}`);
  }
}

const systemPrompt = `You are a senior content writer for LuliDigital, a digital studio offering performance marketing, AI workflow automation, and executive virtual assistant services.

Your audience: founders, CEOs, and executives at SMBs and scale-ups. They are time-poor, smart, and skeptical of fluff.

Writing rules:
- Write in plain, confident English. No corporate jargon.
- Start with a strong hook. The first paragraph should make the reader stop because it names a current AI shift, a business risk, or a practical opportunity clearly.
- If source notes include an AI update, explain what changed, why it matters, and what a business owner should do next.
- Be practical and specific. Real examples beat vague advice.
- Make the writing grounded, human, and sharp. Do not chase fake relatability.
- Do not invent client stories, founder anecdotes, quotes, metrics, personal memories, or "one client told us" moments.
- If a story, creator update, source note, or Fiker's take is provided, use it as direction only. Do not copy the creator's wording closely. Do not imply LuliDigital experienced something personally unless the source notes explicitly say so.
- If no real story is provided, use operational observations and generic examples only. Phrase them as examples, not lived events.
- Write like the reader feels the pain in their calendar, inbox, budget, team handoffs, or campaign dashboard.
- Educate by moving from hook to problem to solution. The reader should leave understanding the issue and the next practical move.
- Connect the solution to LuliDigital's offering only where it fits: AI Desk for workflows and agents, Marketing Desk for visibility and content systems, VA Desk for operational support. Do not force a sales pitch into every paragraph.
- No filler sentences. Every sentence must earn its place.
- Do not use em dashes. Use commas or short sentences instead.
- DESIGN-AWARE: this post renders in an animated, card-block layout (numbered sections, list cards that swing in, a styled pull-quote panel) on a warm honey/cream theme. Write so it SHINES in that format: clear section headers, real lists, and one standout quote give the design something to animate. A wall of paragraphs breaks the design.
- Make it SCANNABLE, not a wall of text. Readers skim before they read. Keep paragraphs short: 2 to 3 sentences max, often 1 to 2. Let white space do work.
- Break the article into short sections. Use a clear H2 roughly every 120 to 180 words, and H3 sub-points where a section has parts. The reader should always see the next heading nearby.
- Use bullet or numbered lists wherever you would otherwise pack things, steps, signs, or options into a dense paragraph. Prefer a tight list over a long sentence. Aim for at least two lists in the post.
- Include one short pull quote as a Markdown blockquote (> one punchy standalone line) for the single most important idea. One, occasionally two. Never more.
- Separate major sections with a --- horizontal rule so the page has visual rhythm.
- Bold the key phrase in important sentences so a skimmer still gets the point.
- End with a natural, non-pushy mention of LuliDigital's relevant service.
- Target length: 800 to 1100 words. Shorter and sharper beats long and dense. No one wants to read forever.

Provide the finished post by calling the submit_blog_post tool with: title, description (meta description under 155 chars, keyword-rich), slug (url-slug-with-hyphens), readingTime (e.g. "6 min read"), and content (the full markdown article body starting with the first paragraph, no frontmatter, use ## for H2 headings, --- for horizontal rules between sections).`;

const userPrompt = `Write a complete blog post about: "${topic.title}"

Primary keyword to target naturally: "${topic.keyword}"
Category: ${topic.category}
${topic.source ? `Keyword research source: ${topic.source}` : ""}
${topic.localTarget ? `Local landing page to link naturally in the article: [${topic.localTarget.label}](${topic.localTarget.path})` : ""}
${customPainPoint || topic.pain_point ? `Reader pain point to address: ${customPainPoint || topic.pain_point}` : ""}
${customAngle || seoAgentTopic?.angle || topic.angle ? `Specific angle to use: ${customAngle || seoAgentTopic?.angle || topic.angle}` : ""}
${customToneNotes ? `Tone notes from the editor: ${customToneNotes}` : ""}
${customSourceNotes ? `Source notes or AI update to respond to (use as direction, do not copy): ${customSourceNotes}` : ""}
${customSourceUrl ? `Source URL for context only, if useful: ${customSourceUrl}` : ""}
${customFikerTake ? `Fiker's point of view to include: ${customFikerTake}` : ""}
${customCta ? `End-of-article CTA text: "${customCta}"${customCtaLink ? ` — link it to ${customCtaLink}` : ""}` : ""}

The article should give genuinely useful, actionable advice. It should feel like pain relief for a founder who is tired of vague advice and wants the next practical move. Do not fabricate relatability. Do not write fake scenes like "a founder told me" or "one client called it" unless that exact source note was provided.

Make it easy and quick to read. Structure it with a strong opening hook (two short paragraphs, no heading), then 5 to 7 short H2 sections, and a brief closing section. Each section should be only a few short paragraphs or a list — never a long block. Use at least two bulleted or numbered lists across the article (for example: the signs, the steps, what to audit, what to automate, what a human still approves). Include exactly one short pull-quote blockquote for the single most important idea. Separate major sections with a --- rule. At least one section should teach the solution path clearly: what to audit, what to automate or systemise, what a human should still approve, and when to bring in support. Include a relevant internal link to the LuliDigital service page at the end (use markdown link format to either /ai-desk, /marketing-desk, or /va-desk depending on the topic). If a local landing page is provided, include exactly one natural internal link to that local page as well.`;

const anthropicInit = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: systemPrompt,
    tools: [
      {
        name: "submit_blog_post",
        description: "Submit the finished blog post for publication.",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "exact article title" },
            description: { type: "string", description: "meta description under 155 chars, keyword-rich" },
            slug: { type: "string", description: "url-slug-with-hyphens" },
            readingTime: { type: "string", description: "e.g. '6 min read'" },
            content: { type: "string", description: "full markdown article body, no frontmatter, ## for H2 headings, --- for horizontal rules" },
          },
          required: ["title", "description", "slug", "readingTime", "content"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_blog_post" },
    messages: [{ role: "user", content: userPrompt }],
  }),
};

// Retry on transient Anthropic overload / rate-limit / 5xx so a temporary blip
// doesn't kill a scheduled blog run.
let response;
for (let attempt = 1; attempt <= 4; attempt++) {
  response = await fetch("https://api.anthropic.com/v1/messages", anthropicInit);
  if (response.ok) break;
  const err = await response.text();
  const retryable = response.status === 429 || response.status >= 500 || /overloaded/i.test(err);
  if (retryable && attempt < 4) {
    const waitMs = attempt * 8000;
    console.log(`Anthropic ${response.status} (attempt ${attempt}/4) — retrying in ${waitMs / 1000}s`);
    await new Promise((r) => setTimeout(r, waitMs));
    continue;
  }
  console.error("Anthropic API error:", err);
  process.exit(1);
}

const data = await response.json();
// Structured tool output returns a validated JSON object — no fragile text parsing.
const toolUse = Array.isArray(data.content) ? data.content.find((block) => block.type === "tool_use") : null;

let post = toolUse?.input;
if (!post) {
  // Fallback for any text-only response.
  const raw = (data.content?.find((b) => b.type === "text")?.text || "").trim();
  try {
    post = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
  } catch (e) {
    console.error("Failed to get blog post from model response:", JSON.stringify(data).slice(0, 600));
    process.exit(1);
  }
}

if (titleLooksStuffed(post.title, topic.keyword)) {
  console.error(`Generated title looks keyword-stuffed: ${post.title}`);
  process.exit(1);
}

const fabricatedPattern = contentLooksFabricated(post.content);
if (fabricatedPattern) {
  console.error(`Generated content appears to contain fabricated relatability: ${fabricatedPattern}`);
  process.exit(1);
}

if (!post.slug || slugLooksStuffed(post.slug)) {
  post.slug = slugify(post.title);
}

const today = new Date().toISOString().split("T")[0];

const frontmatter = `---
title: "${post.title.replace(/"/g, '\\"')}"
description: "${post.description.replace(/"/g, '\\"')}"
pubDate: ${today}
category: "${topic.category}"
readingTime: "${post.readingTime}"
draft: ${isDraft}
---

`;

const filePath = join(ROOT, "src", "content", "blog", `${post.slug}.md`);

// Safety guard: NEVER overwrite an existing post. If the slug already exists,
// this topic was already produced — abort rather than clobber a published post
// or spawn a near-duplicate draft. (Revisions go through revise-draft.mjs.)
if (existsSync(filePath)) {
  const existing = readFileSync(filePath, "utf8");
  const isPublished = /^draft:\s*false\s*$/m.test(existing);
  console.error(
    `Refusing to overwrite existing ${isPublished ? "PUBLISHED" : "draft"} post at ` +
    `src/content/blog/${post.slug}.md — this topic already exists. Aborting to protect content.`
  );
  process.exit(1);
}

writeFileSync(filePath, frontmatter + post.content);

console.log(`Post written to: src/content/blog/${post.slug}.md`);

// Save title and slug for the notification step
writeFileSync("/tmp/post_title.txt", post.title);
writeFileSync("/tmp/post_slug.txt", post.slug);
writeFileSync("/tmp/post_category.txt", topic.category);
writeFileSync("/tmp/post_description.txt", post.description);
writeFileSync("/tmp/post_local_target.txt", topic.localTarget?.path ?? "");

// Update published count only for scheduled topic rotation.
if (!isCustomTopic) {
  topicsData.published_count += 1;
  writeFileSync(topicsPath, JSON.stringify(topicsData, null, 2));
}

// Clear consumed queue item and track new draft slug.
// Spread ...memory first to preserve review_state and any other fields.
if (queued || queuedPlan || queuedSeo || existsSync(memoryPath) || !isDraft) {
  const updatedMemory = {
    ...memory,
    pending_post: null,
    pending_drafts: isDraft
      ? [...(memory.pending_drafts || []), post.slug]
      : (memory.pending_drafts || []),
    blog_plan_queue: queuedPlan ? planQueue.slice(1) : planQueue,
    seo_opportunity_queue: queuedSeo ? seoQueue.slice(1) : seoQueue,
    latest_live_post: isDraft ? memory.latest_live_post : {
      slug: post.slug,
      title: post.title,
      published_at: today,
    },
  };
  writeFileSync(memoryPath, JSON.stringify(updatedMemory, null, 2));
  if (queued) console.log("Queued instructions consumed and cleared from memory.");
  if (queuedPlan) console.log(`Planned blog consumed: "${queuedPlan.topic}" (${planQueue.length - 1} remaining in queue)`);
  if (queuedSeo) console.log(`SEO opportunity consumed: "${queuedSeo.keyword}" (${seoQueue.length - 1} remaining in queue)`);
}

console.log("Done.");
