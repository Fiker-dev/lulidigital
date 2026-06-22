/**
 * Monthly SEO Audit — runs on the 1st of each month via monthly-seo-audit.yml
 *
 * Pulls 90 days of Google Search Console data, computes:
 *   - Top performing queries (clicks)
 *   - Opportunity queries (high impressions, low CTR, position 11-50)
 *   - Page-level stats with position trend (this month vs last month)
 *   - Pages with zero or near-zero visibility
 *
 * Writes:
 *   - scripts/seo-audit-YYYY-MM.json  (committed to repo)
 *   - /tmp/seo-audit-message.txt      (read by workflow to send via Telegram)
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { generateGeminiText, getGeminiApiKey } from "../src/lib/geminiFallback.js";
import { getGoogleAccessToken, hasServiceAccount, hasOAuth } from "./google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY || (!hasServiceAccount() && !hasOAuth())) {
  console.log("Search Console not configured. Need GOOGLE_SEARCH_CONSOLE_PROPERTY plus a service-account key (GOOGLE_SA_KEY / GOOGLE_INDEXING_SA_KEY) or OAuth. Skipping audit.");
  process.exit(0);
}

const PROPERTY = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;

const KNOWN_PAGES = [
  "/", "/marketing-desk", "/ai-desk", "/va-desk", "/founder",
  "/africa", "/amsterdam", "/munich", "/stockholm", "/united-states",
  "/united-kingdom", "/denmark", "/switzerland", "/ireland", "/belgium", "/norway",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function toPath(url) {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url || "/";
  }
}

function avg(arr) {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// ── Search Console query ──────────────────────────────────────────────────────

async function querySearchConsole(accessToken, { startDate, endDate, rowLimit = 5000 }) {
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/searchAnalytics/query`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["page", "query"],
      rowLimit,
      startRow: 0,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Search Console failed: ${res.status}`);
  return data.rows ?? [];
}

// ── Analysis helpers ──────────────────────────────────────────────────────────

function aggregateByQuery(rows) {
  const map = new Map();
  for (const row of rows) {
    const [, query] = row.keys;
    if (!query) continue;
    const e = map.get(query) ?? { clicks: 0, impressions: 0, positions: [], ctrs: [] };
    e.clicks += row.clicks;
    e.impressions += row.impressions;
    e.positions.push(row.position);
    e.ctrs.push(row.ctr);
    map.set(query, e);
  }
  return [...map.entries()].map(([query, d]) => ({
    query,
    clicks: d.clicks,
    impressions: d.impressions,
    avgPosition: round1(avg(d.positions)),
    avgCtr: Math.round(avg(d.ctrs) * 1000) / 1000,
  }));
}

function aggregateByPage(rows) {
  const map = new Map();
  for (const row of rows) {
    const path = toPath(row.keys[0]);
    const e = map.get(path) ?? { clicks: 0, impressions: 0, positions: [], ctrs: [] };
    e.clicks += row.clicks;
    e.impressions += row.impressions;
    e.positions.push(row.position);
    e.ctrs.push(row.ctr);
    map.set(path, e);
  }
  return new Map(
    [...map.entries()].map(([path, d]) => [
      path,
      {
        path,
        clicks: d.clicks,
        impressions: d.impressions,
        avgPosition: round1(avg(d.positions)),
        avgCtr: Math.round(avg(d.ctrs) * 1000) / 1000,
      },
    ]),
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log("Authenticating with Google...");
const token = await getGoogleAccessToken();

// Three windows:
//   Current:  last 30 days (with 3-day recency buffer Search Console uses)
//   Previous: 31–60 days ago (for trend comparison)
//   Wide:     last 90 days  (for opportunity discovery)
const currentStart  = isoDate(daysAgo(33));
const currentEnd    = isoDate(daysAgo(3));
const previousStart = isoDate(daysAgo(63));
const previousEnd   = isoDate(daysAgo(33));
const wideStart     = isoDate(daysAgo(93));
const wideEnd       = isoDate(daysAgo(3));

console.log(`Querying Search Console (current: ${currentStart} → ${currentEnd}, wide: ${wideStart} → ${wideEnd})...`);

const [rowsCurrent, rowsPrevious, rowsWide] = await Promise.all([
  querySearchConsole(token, { startDate: currentStart, endDate: currentEnd }),
  querySearchConsole(token, { startDate: previousStart, endDate: previousEnd }),
  querySearchConsole(token, { startDate: wideStart, endDate: wideEnd }),
]);

console.log(`Rows — current: ${rowsCurrent.length}, previous: ${rowsPrevious.length}, wide: ${rowsWide.length}`);

if (rowsWide.length === 0) {
  console.log("No Search Console data available yet. Site may be too new. Skipping.");
  process.exit(0);
}

// ── 1. Top queries by clicks (current period) ─────────────────────────────────
const topQueries = aggregateByQuery(rowsCurrent)
  .sort((a, b) => b.clicks - a.clicks)
  .slice(0, 10);

// ── 2. Opportunity queries (90 days: visible but not converting) ──────────────
const opportunities = aggregateByQuery(rowsWide)
  .filter((d) => d.impressions >= 30 && d.avgCtr < 0.05 && d.avgPosition > 8 && d.avgPosition < 50)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 10);

// ── 3. Page stats + position trend ───────────────────────────────────────────
const pagesCurrent  = aggregateByPage(rowsCurrent);
const pagesPrevious = aggregateByPage(rowsPrevious);

const pageStats = [...pagesCurrent.values()]
  .sort((a, b) => b.impressions - a.impressions)
  .map((cur) => {
    const prev = pagesPrevious.get(cur.path);
    return {
      ...cur,
      previousAvgPosition: prev ? prev.avgPosition : null,
      positionChange: prev ? round1(prev.avgPosition - cur.avgPosition) : null, // positive = improved
    };
  });

// ── 4. Pages with low/no visibility ──────────────────────────────────────────
const lowVisibilityPages = KNOWN_PAGES
  .map((p) => ({ path: p, impressions: pagesCurrent.get(p)?.impressions ?? 0 }))
  .filter((p) => p.impressions < 5)
  .sort((a, b) => a.impressions - b.impressions);

// ── 5. Low CTR pages (visible but not clicked) ───────────────────────────────
const lowCtrPages = pageStats
  .filter((p) => p.impressions >= 20 && p.avgCtr < 0.02)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 5);

// ── 6. Most improved pages ────────────────────────────────────────────────────
const improvedPages = pageStats
  .filter((p) => p.positionChange !== null && p.positionChange > 2)
  .sort((a, b) => b.positionChange - a.positionChange)
  .slice(0, 5);

// ── Write JSON report ─────────────────────────────────────────────────────────
const now = new Date();
const monthKey = now.toISOString().slice(0, 7);

const report = {
  generatedAt: now.toISOString(),
  property: PROPERTY,
  periods: {
    current:  `${currentStart} to ${currentEnd}`,
    previous: `${previousStart} to ${previousEnd}`,
    wide90d:  `${wideStart} to ${wideEnd}`,
  },
  summary: {
    totalClicks:      rowsCurrent.reduce((s, r) => s + r.clicks, 0),
    totalImpressions: rowsCurrent.reduce((s, r) => s + r.impressions, 0),
    pagesWithData:    pagesCurrent.size,
    lowVisibilityCount: lowVisibilityPages.length,
  },
  topQueries,
  opportunities,
  pageStats,
  lowVisibilityPages,
  lowCtrPages,
  improvedPages,
};

const reportPath = join(__dirname, `seo-audit-${monthKey}.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`Audit report saved: seo-audit-${monthKey}.json`);

// ── Auto-fix 1: Write keyword overrides for seoAgent.js ───────────────────────
// For each known page that has real Search Console opportunity queries,
// prepend those queries to the keyword rotation so the site targets them first.
const pageOpportunityMap = new Map();
for (const row of rowsWide) {
  const path = toPath(row.keys[0]);
  const query = row.keys[1];
  if (!query || !KNOWN_PAGES.includes(path)) continue;
  const arr = pageOpportunityMap.get(path) ?? [];
  arr.push({ query, impressions: row.impressions, position: row.position, ctr: row.ctr });
  pageOpportunityMap.set(path, arr);
}

const overridePages = {};
for (const [path, rows] of pageOpportunityMap.entries()) {
  const topKws = rows
    .filter((r) => r.impressions >= 20 && r.position > 8 && r.position < 50 && r.ctr < 0.05)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 4)
    .map((r) => r.query);
  if (topKws.length > 0) {
    overridePages[path] = { primary: topKws, source: `Search Console — ${monthKey}` };
  }
}

const overridesPath = join(__dirname, "..", "src", "lib", "seo-keyword-overrides.json");
writeFileSync(overridesPath, JSON.stringify({ generatedAt: now.toISOString(), month: monthKey, pages: overridePages }, null, 2));
const overridePagesCount = Object.keys(overridePages).length;
console.log(`Keyword overrides written: ${overridePagesCount} pages updated in src/lib/seo-keyword-overrides.json`);

// ── Auto-fix 2: Queue targeted blog posts for top opportunity keywords ─────────
// These are added to lana-memory.json and consumed one per blog run (Mon/Wed/Fri).
// Each one goes through the normal Telegram approval loop before publishing.
const inferCategory = (kw) => {
  const n = kw.toLowerCase();
  if (n.includes("assistant") || n.includes("admin")) return "Virtual Assistant";
  if (n.includes("marketing") || n.includes("seo") || n.includes("ads") || n.includes("brand")) return "Digital Marketing";
  return "AI Automation";
};

const queueItems = opportunities.slice(0, 3).map((opp) => ({
  topic: `How "${opp.query}" Can Work for Your Business`,
  keyword: opp.query,
  category: inferCategory(opp.query),
  pain_point: "",
  angle: `This keyword has ${opp.impressions} impressions at position ${round1(opp.avgPosition)} over 90 days — a focused post targeting it directly should capture the traffic that's already looking for us.`,
  tone_notes: "Practical, problem-solution. Geo-specific context where relevant.",
  source: `Search Console opportunity — ${monthKey}`,
}));

const memoryPath = join(__dirname, "lana-memory.json");
const existingMemory = existsSync(memoryPath)
  ? JSON.parse(readFileSync(memoryPath, "utf8"))
  : { pending_post: null, pending_drafts: [], review_state: null };

writeFileSync(memoryPath, JSON.stringify({ ...existingMemory, seo_opportunity_queue: queueItems }, null, 2));
console.log(`SEO queue updated: ${queueItems.length} opportunity drafts queued for next blog runs`);

// ── Monthly report summary ─────────────────────────────────────────────────────
// Gemini Flash is the primary writer here (fast, cheap, internal analysis).
// Claude Haiku is the fallback if Gemini is unavailable; a raw template is last.
const rawSummary = () => [
  `Monthly SEO — ${monthKey}`,
  `Clicks: ${report.summary.totalClicks} | Impressions: ${report.summary.totalImpressions}`,
  `Top query: "${topQueries[0]?.query ?? "none"}" — ${topQueries[0]?.clicks ?? 0} clicks`,
  `Best opportunity: "${opportunities[0]?.query ?? "none"}" — ${opportunities[0]?.impressions ?? 0} impressions at position ${opportunities[0]?.avgPosition ?? "-"}`,
  `${lowVisibilityPages.length} pages with near-zero visibility`,
  `Full data: scripts/seo-audit-${monthKey}.json`,
].join("\n");

if (!getGeminiApiKey() && !process.env.ANTHROPIC_API_KEY) {
  console.log("No GEMINI_API_KEY or ANTHROPIC_API_KEY — writing raw fallback message.");
  writeFileSync("/tmp/seo-audit-message.txt", rawSummary());
  process.exit(0);
}

const reportData = {
  month: monthKey,
  totalClicks: report.summary.totalClicks,
  totalImpressions: report.summary.totalImpressions,
  topQueries: topQueries.slice(0, 5),
  topOpportunities: opportunities.slice(0, 5),
  mostImproved: improvedPages.slice(0, 3),
  lowCtrPages: lowCtrPages.slice(0, 3),
  lowVisibilityPages: lowVisibilityPages.slice(0, 6),
  autoFixed: {
    keywordRotationPagesUpdated: overridePagesCount,
    draftBlogPostsQueued: queueItems.length,
    queuedKeywords: queueItems.map((q) => q.keyword),
  },
};

const summarySystem = `You are Lana, the LuliDigital SEO analyst. Write a plain-English monthly SEO report for Fiker to read in Telegram.

Rules:
- Max 1200 characters total
- Start with: "Monthly SEO — [Month YYYY]"
- 2-3 lines on what is working (specific numbers)
- 2-3 lines on top opportunities (be specific: page, keyword, what to fix)
- 1 line on low-visibility pages (count + names)
- End with what was auto-fixed: "I've updated keyword targets for X pages and queued Y draft posts for your approval — check Telegram over the next few blog runs."
- Plain text only. No markdown, no asterisks, no bullet symbols. Short sentences.`;
const summaryUser = `SEO data for this month:\n${JSON.stringify(reportData, null, 2)}`;

let summaryText = "";

// 1) Gemini Flash (primary)
if (getGeminiApiKey()) {
  try {
    summaryText = await generateGeminiText({
      system: summarySystem,
      messages: [{ role: "user", content: summaryUser }],
      maxTokens: 700,
      temperature: 0.3,
    });
    if (summaryText) console.log("SEO summary written by Gemini.");
  } catch (err) {
    console.error("Gemini summary failed:", err);
  }
}

// 2) Claude Haiku (fallback)
if (!summaryText && process.env.ANTHROPIC_API_KEY) {
  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: summarySystem,
      messages: [{ role: "user", content: summaryUser }],
    }),
  });

  if (claudeRes.ok) {
    const claudeData = await claudeRes.json();
    summaryText = claudeData.content[0].text.trim();
    console.log("SEO summary written by Claude Haiku (Gemini unavailable).");
  } else {
    console.error("Claude summary failed:", await claudeRes.text());
  }
}

// 3) Raw template (last resort)
if (!summaryText) {
  summaryText = rawSummary();
  console.log("Both models unavailable — using raw template summary.");
}

writeFileSync("/tmp/seo-audit-message.txt", summaryText);
console.log("Summary message written to /tmp/seo-audit-message.txt");
console.log("---\n" + summaryText + "\n---");
