import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getBestRegionalSeoRecommendation, inferSeoCategory } from "../src/lib/seoAgent.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const topicsPath = join(__dirname, "blog-topics.json");
const topicsData = JSON.parse(readFileSync(topicsPath, "utf8"));

const index = topicsData.published_count % topicsData.topics.length;
const customTitle = process.env.BLOG_TOPIC?.trim();
const customKeyword = process.env.BLOG_KEYWORD?.trim();
const customCategory = process.env.BLOG_CATEGORY?.trim();
const customPainPoint = process.env.BLOG_PAIN_POINT?.trim();
const customAngle = process.env.BLOG_ANGLE?.trim();
const customToneNotes = process.env.BLOG_TONE_NOTES?.trim();
const useSeoAgent = process.env.BLOG_USE_SEO_AGENT === "true";
const isDraft = process.env.BLOG_DRAFT === "true";
const seoRecommendation = !customTitle && useSeoAgent ? await getBestRegionalSeoRecommendation({ forceRefresh: true }) : null;
const localTargets = {
  ZA: { label: "South Africa", path: "/south-africa" },
  NL: { label: "Amsterdam", path: "/amsterdam" },
  DE: { label: "Munich", path: "/munich" },
  SE: { label: "Stockholm", path: "/stockholm" },
};
const localTarget = seoRecommendation ? localTargets[seoRecommendation.geo] : null;
const seoAgentTopic = seoRecommendation
  ? {
      title: `How to Use ${seoRecommendation.keyword} to Build a Cleaner Business System`,
      category: customCategory || inferSeoCategory(seoRecommendation.keyword),
      keyword: customKeyword || seoRecommendation.keyword,
      source: seoRecommendation.source,
      localTarget,
    }
  : null;
const isCustomTopic = Boolean(customTitle || seoAgentTopic);
const topic = customTitle
  ? {
      title: customTitle,
      category: customCategory || "AI Automation",
      keyword: customKeyword || customTitle,
    }
  : seoAgentTopic ?? topicsData.topics[index];

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
- Be practical and specific. Real examples beat vague advice.
- Make the writing funny, relatable, and human, but never silly. The humor should come from recognizable business pain, not from jokes.
- Write like the reader feels the pain in their calendar, inbox, budget, team handoffs, or campaign dashboard.
- Lead with the problem, give the reader relief, then show the operational solution.
- No filler sentences. Every paragraph must earn its place.
- Do not use em dashes. Use commas or short sentences instead.
- No bullet-point-heavy content. Write in paragraphs.
- End with a natural, non-pushy mention of LuliDigital's relevant service.
- Target length: 1100 to 1400 words.

Return ONLY a JSON object with this exact structure:
{
  "title": "exact article title",
  "description": "meta description under 155 chars, keyword-rich",
  "slug": "url-slug-with-hyphens",
  "readingTime": "X min read",
  "content": "full markdown article body starting with the first paragraph, no frontmatter, use ## for H2 headings, --- for horizontal rules between sections"
}`;

const userPrompt = `Write a complete blog post about: "${topic.title}"

Primary keyword to target naturally: "${topic.keyword}"
Category: ${topic.category}
${seoAgentTopic ? `Keyword research source: ${seoAgentTopic.source}` : ""}
${seoAgentTopic?.localTarget ? `Local landing page to link naturally in the article: [${seoAgentTopic.localTarget.label}](${seoAgentTopic.localTarget.path})` : ""}
${customPainPoint ? `Reader pain point to address: ${customPainPoint}` : ""}
${customAngle ? `Specific angle to use: ${customAngle}` : ""}
${customToneNotes ? `Tone notes from the editor: ${customToneNotes}` : ""}

The article should give genuinely useful, actionable advice. It should feel like pain relief for a founder who is tired of vague advice and wants the next practical move. Structure it with a strong opening paragraph, 4-6 H2 sections, and a closing section. Include a relevant internal link to the LuliDigital service page at the end (use markdown link format to either /ai, /marketing, or /virtual-assistant depending on the topic). If a local landing page is provided, include exactly one natural internal link to that local page as well.`;

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
  const err = await response.text();
  console.error("Anthropic API error:", err);
  process.exit(1);
}

const data = await response.json();
const raw = data.content[0].text.trim();

let post;
try {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  post = JSON.parse(jsonMatch[0]);
} catch (e) {
  console.error("Failed to parse response as JSON:", raw.slice(0, 500));
  process.exit(1);
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
writeFileSync(filePath, frontmatter + post.content);

console.log(`Post written to: src/content/blog/${post.slug}.md`);

// Save title and slug for the notification step
writeFileSync("/tmp/post_title.txt", post.title);
writeFileSync("/tmp/post_slug.txt", post.slug);
writeFileSync("/tmp/post_category.txt", topic.category);
writeFileSync("/tmp/post_description.txt", post.description);
writeFileSync("/tmp/post_local_target.txt", seoAgentTopic?.localTarget?.path ?? "");

// Update published count only for scheduled topic rotation.
if (!isCustomTopic) {
  topicsData.published_count += 1;
  writeFileSync(topicsPath, JSON.stringify(topicsData, null, 2));
}

console.log("Done.");
