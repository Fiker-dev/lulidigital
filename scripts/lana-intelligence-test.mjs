import assert from "node:assert/strict";
import { LANA_CONFIG } from "../src/scripts/lana/config.js";
import { calculateLeadScore, getEngagementLevel } from "../src/scripts/lana/scoring.js";
import { formatLanaContext } from "../src/scripts/lana/context.js";
import { chooseProactivePrompt } from "../src/scripts/lana/triggers.js";

const now = 1_000_000;
const base = { startedAt: now - LANA_CONFIG.initialSilenceMs - 1, pages: ["/"], sections: {}, promptsShown: 0, shownPromptIds: [], currentSectionDwellMs: 0 };

assert.equal(chooseProactivePrompt({ ...base, startedAt: now }, now), null, "A: no immediate prompt");
assert.equal(chooseProactivePrompt({ ...base, currentSectionDwellMs: LANA_CONFIG.sectionAttentionMs }, now)?.id, "general-help", "B: contextual dwell prompt");
assert.equal(chooseProactivePrompt({ ...base, currentSectionDwellMs: 99_000, lastPromptAt: now - 1_000 }, now), null, "C: cooldown blocks repeat");
const multi = { ...base, pages: ["/ai-desk", "/marketing-desk"], currentSectionDwellMs: 1 };
assert.equal(chooseProactivePrompt(multi, now)?.id, "service-compare", "D: multi-service prompt");
assert.ok(calculateLeadScore({ ...multi, pricingViewed: true }) >= 40, "D: pricing and services increase score without inflating intent");
assert.equal(chooseProactivePrompt({ ...base, lanaResponded: true, currentSectionDwellMs: 99_000 }, now), null, "E: conversation stops prompts");
const persisted = JSON.parse(JSON.stringify({ ...base, pages: ["/ai-desk", "/contact"] }));
assert.deepEqual(persisted.pages, ["/ai-desk", "/contact"], "F: session state serializes across navigation");
assert.equal(chooseProactivePrompt({ ...base, dismissedUntil: now + 1_000, currentSectionDwellMs: 99_000 }, now), null, "G: dismissal is respected");
assert.equal(chooseProactivePrompt({ ...base, formActive: true, currentSectionDwellMs: 99_000 }, now), null, "H: form safeguard");
assert.equal(chooseProactivePrompt({ ...base, rapidScrolling: true, currentSectionDwellMs: 99_000 }, now), null, "H: scrolling safeguard");
assert.equal(chooseProactivePrompt({ ...base, pageVisible: false, currentSectionDwellMs: 99_000 }, now), null, "H: background tabs cannot prompt");
const context = formatLanaContext({ ...multi, currentPage: "/marketing-desk", currentSection: "results" });
assert.equal(context.currentPage, "/marketing-desk");
assert.ok(["browsing", "interested", "high_interest", "strong_intent"].includes(getEngagementLevel(context.leadScore)));

console.log("Lana intelligence scenarios A-H passed.");
