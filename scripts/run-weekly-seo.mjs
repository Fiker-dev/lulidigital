/**
 * Weekly SEO refresh — runs every Friday via weekly-seo.yml.
 *
 * Pulls the last 14 days of Search Console data and, for each SERVICE page,
 * finds the real queries people actually used to reach it. It then SUBTLY
 * refreshes that page's primary keyword target in seo-keyword-overrides.json,
 * which getWeeklyPageSeoTarget() prepends to the rotation at render time.
 *
 * No content is rewritten — only the keyword each service page leans into,
 * kept in step with real, current demand. Merges with existing overrides so
 * non-service pages (set by the monthly audit) are preserved.
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROPERTY = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;

const required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN", "GOOGLE_SEARCH_CONSOLE_PROPERTY"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing secrets: ${missing.join(", ")}`);
  process.exit(1);
}

// The service pages we refresh weekly ("each service").
const SERVICE_PAGES = ["/marketing-desk", "/ai-desk", "/va-desk", "/web-design-desk"];
const MAX_KEYWORDS = 3; // keep the update subtle

function toPath(u) {
  try {
    return new URL(u).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return u;
  }
}

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || `OAuth failed: ${res.status}`);
  return data.access_token;
}

async function query(token, startDate, endDate) {
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/searchAnalytics/query`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate, dimensions: ["page", "query"], rowLimit: 5000, startRow: 0 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Search Console failed: ${res.status}`);
  return data.rows ?? [];
}

const fmt = (d) => d.toISOString().split("T")[0];
const end = new Date();
const start = new Date(end.getTime() - 14 * 86400000);

const token = await getAccessToken();
const rows = await query(token, fmt(start), fmt(end));

// Group queries per service page.
const perPage = new Map();
for (const row of rows) {
  const path = toPath(row.keys[0]);
  const q = row.keys[1];
  if (!q || !SERVICE_PAGES.includes(path)) continue;
  const arr = perPage.get(path) ?? [];
  arr.push({ query: q, impressions: row.impressions, clicks: row.clicks });
  perPage.set(path, arr);
}

// Merge with existing overrides so monthly-audit / non-service pages survive.
const overridesPath = join(__dirname, "..", "src", "lib", "seo-keyword-overrides.json");
const existing = existsSync(overridesPath) ? JSON.parse(readFileSync(overridesPath, "utf8")) : { pages: {} };
const pages = { ...(existing.pages ?? {}) };

const updates = [];
for (const path of SERVICE_PAGES) {
  const qs = (perPage.get(path) ?? [])
    .filter((r) => r.impressions >= 1)
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)
    .slice(0, MAX_KEYWORDS)
    .map((r) => r.query);
  if (qs.length > 0) {
    pages[path] = { primary: qs, source: `weekly Search Console refresh ${fmt(end)}` };
    updates.push(`${path} → ${qs.join(", ")}`);
  }
}

writeFileSync(overridesPath, JSON.stringify({ generatedAt: end.toISOString(), week: fmt(end), pages }, null, 2));

console.log(`Weekly SEO refresh (${fmt(start)} → ${fmt(end)})`);
console.log(`Service pages updated from real search demand: ${updates.length}/${SERVICE_PAGES.length}`);
updates.forEach((u) => console.log("  " + u));
if (updates.length === 0) {
  console.log("  No qualifying queries this week (low search volume) — keeping existing targets.");
}

const summary = updates.length > 0
  ? `Weekly SEO refresh (${fmt(end)})\nRefreshed keyword targets from real searches:\n` + updates.map((u) => "• " + u).join("\n")
  : `Weekly SEO refresh (${fmt(end)})\nNo new search demand to act on this week — service page targets unchanged.`;
writeFileSync("/tmp/weekly-seo-summary.txt", summary);
