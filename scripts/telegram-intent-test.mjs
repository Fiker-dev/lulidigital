/**
 * Unit tests for the Lana Telegram intent parser (src/lib/lana-intent.ts).
 *
 * These cover the human-in-the-loop control surface: the approval button,
 * approve / reject / revise replies during a review, and direct publish /
 * schedule / draft / unpublish / plan instructions outside a review. Run with
 * `npm run test:telegram` or as part of `npm test`.
 *
 * Node 24+ strips the TypeScript types at import time, so the .ts module is
 * imported directly with no build step.
 */

import {
  parseHeuristicDecision,
  parseLocalFallback,
  parseReviewReply,
  parseDirectControl,
  resolveApprovalSlug,
  normalizeSlug,
  extractSlug,
  extractDate,
} from "../src/lib/lana-intent.ts";

let passed = 0;
const failures = [];

function check(name, condition) {
  if (condition) {
    passed += 1;
  } else {
    failures.push(name);
  }
}

function eq(name, actual, expected) {
  check(`${name} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`, actual === expected);
}

const review = {
  slug: "founder-delegation-mistakes",
  title: "Why founders keep chasing tasks",
  preview_text: "Preview.",
  scheduled_for: "2026-06-29",
  revision_count: 0,
};

const memory = {
  pending_post: null,
  review_state: review,
  latest_live_post: { slug: "ai-agents-small-business", title: "AI agents", published_at: "2026-06-20" },
};

// ── Approval button slug resolution ───────────────────────────────────────────
eq("button: bare blog_approve falls back to review slug", resolveApprovalSlug("blog_approve", review), review.slug);
eq("button: blog_approve:slug uses explicit slug", resolveApprovalSlug("blog_approve:custom-post-slug", review), "custom-post-slug");
eq("button: blog_approve with no review and no slug is empty", resolveApprovalSlug("blog_approve", null), "");
eq("button: explicit slug works even without review", resolveApprovalSlug("blog_approve:standalone-post", null), "standalone-post");

// ── Approve replies during a review ───────────────────────────────────────────
for (const text of ["yes", "Yes", "YES", "yep", "approve it", "approve and publish", "publish it", "ship it", "looks good", "good to go", "go ahead", "send it", "do it", "perfect", "👍", "schedule it"]) {
  const d = parseReviewReply(text, review);
  eq(`approve reply "${text}"`, d?.action, "approve");
}

// ── Reject replies during a review ────────────────────────────────────────────
for (const text of ["no", "nope", "reject it", "delete it", "scrap it", "don't publish", "not this one", "cancel it", "remove it", "forget it"]) {
  const d = parseReviewReply(text, review);
  eq(`reject reply "${text}"`, d?.action, "reject");
}

// ── Change requests during a review are NOT auto-revised ──────────────────────
// They return null from the deterministic parser so the conversational LLM can
// talk them through and only rewrite the text on a clear instruction.
for (const text of [
  "make it shorter",
  "change the title",
  "less SEO please",
  "include other countries",
  "make it sound more human",
  "can you adjust the intro",
  "I want you to change the hero avatar and move it to another block",
]) {
  const d = parseReviewReply(text, review);
  check(`change reply "${text}" defers to LLM (null)`, d === null);
}

// review parsing only applies when a review is active
check("no review -> parseReviewReply null", parseReviewReply("yes", null) === null);

// ── Ordering: review reply wins over direct-control during an active review ────
// "remove it" / "delete it" must reject the draft, not unpublish a post named "it".
{
  const d = parseHeuristicDecision("remove it", memory, review);
  eq('heuristic "remove it" during review -> reject', d?.action, "reject");
}
{
  const d = parseHeuristicDecision("delete it", memory, review);
  eq('heuristic "delete it" during review -> reject', d?.action, "reject");
}
{
  // Approve still wins during review.
  const d = parseHeuristicDecision("ship it", memory, review);
  eq('heuristic "ship it" during review -> approve', d?.action, "approve");
}
{
  // During a review, anything that isn't a clear approve/reject defers to the
  // conversational LLM (so "remove the second paragraph" is discussed, not
  // mis-read as an unpublish command).
  const d = parseHeuristicDecision("remove the second paragraph", memory, review);
  check('heuristic "remove the second paragraph" during review -> defers to LLM (null)', d === null);
}
{
  const d = parseHeuristicDecision("can you make the intro punchier?", memory, review);
  check('heuristic edit talk during review -> defers to LLM (null)', d === null);
}

// ── Direct control (no active review) ─────────────────────────────────────────
{
  const d = parseHeuristicDecision("take down founder-delegation-mistakes", { pending_post: null }, null);
  eq('"take down <slug>" -> unpublish', d?.action, "unpublish");
  eq("  ...slug", d?.slug, "founder-delegation-mistakes");
}
{
  const d = parseHeuristicDecision("take it down", memory, null);
  eq('"take it down" -> unpublish latest live', d?.action, "unpublish");
  eq("  ...latest live slug", d?.slug, memory.latest_live_post.slug);
}
{
  const d = parseHeuristicDecision("unpublish https://lulidigital.com/blog/some-post-here", { pending_post: null }, null);
  eq("unpublish via URL -> unpublish", d?.action, "unpublish");
  eq("  ...slug from URL", d?.slug, "some-post-here");
}
{
  const d = parseHeuristicDecision("take it down please", { pending_post: null }, null);
  eq('"take it down" with no latest live -> chat (asks for slug)', d?.action, "chat");
}

// ── Local fallback: publish / schedule / draft / plan / chat ──────────────────
{
  const d = parseLocalFallback("publish how-to-hire-virtual-assistant-guide", null);
  eq("fallback publish -> publish", d.action, "publish");
  eq("  ...slug", d.slug, "how-to-hire-virtual-assistant-guide");
}
{
  const d = parseLocalFallback("publish how-to-hire-virtual-assistant-guide on 2026-07-01", null);
  eq("fallback publish + date -> schedule", d.action, "schedule");
  eq("  ...date", d.date, "2026-07-01");
}
{
  const d = parseLocalFallback("schedule how-to-hire-guide-now 01/07/2026", null);
  eq("fallback schedule slash date -> schedule", d.action, "schedule");
  eq("  ...normalized date", d.date, "2026-07-01");
}
{
  const d = parseLocalFallback("write a blog about AI agents for small business owners", null);
  eq("fallback write request -> draft", d.action, "draft");
  eq("  ...category inferred AI", d.category, "AI Automation");
  eq("  ...defaults to draft (not live)", d.publish_status, "draft");
  check("  ...topic cleaned of 'write a blog about'", !/^write/i.test(d.topic || ""));
}
{
  const d = parseLocalFallback("draft a post about virtual assistant onboarding", null);
  eq("fallback VA topic -> Virtual Assistant category", d.category, "Virtual Assistant");
}
{
  const d = parseLocalFallback("write something about SEO for founders, publish live now", null);
  eq("fallback explicit publish-live -> publish_status publish", d.publish_status, "publish");
}
{
  const d = parseLocalFallback("draft this now, outside the schedule: browser agents", null);
  eq("fallback outside-schedule -> draft", d.action, "draft");
  check("  ...reply mentions outside the schedule", /outside the schedule/i.test(d.reply));
}
{
  const d = parseLocalFallback("let's plan the next 3 blogs around AI updates", null);
  eq("fallback plan 3 blogs -> chat plan proposal", d.action, "chat");
}
{
  const d = parseLocalFallback("what's the latest post?", memory);
  eq("fallback status query -> chat", d.action, "chat");
  check("  ...mentions latest slug", d.reply.includes(memory.latest_live_post.slug));
}
{
  const d = parseLocalFallback("how are you today", null);
  eq("fallback small talk -> chat", d.action, "chat");
}

// ── Pure helpers ──────────────────────────────────────────────────────────────
eq("normalizeSlug strips URL", normalizeSlug("https://lulidigital.com/blog/my-post"), "my-post");
eq("normalizeSlug strips /blog/ and .md", normalizeSlug("/blog/my-post.md"), "my-post");
eq("normalizeSlug strips trailing punctuation", normalizeSlug("my-post."), "my-post");
eq("extractSlug from URL", extractSlug("see https://lulidigital.com/blog/great-post-here now"), "great-post-here");
eq("extractSlug from bare 3-part slug", extractSlug("publish my-cool-post please"), "my-cool-post");
eq("extractDate ISO", extractDate("ship it on 2026-12-31"), "2026-12-31");
eq("extractDate slash dmy", extractDate("ship it on 31/12/2026"), "2026-12-31");
eq("extractDate none -> empty", extractDate("ship it sometime"), "");

// ── Report ────────────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error(`Telegram intent tests FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Telegram intent tests passed (${passed} assertions).`);
