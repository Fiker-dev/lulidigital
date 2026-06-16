/**
 * Recrawl & index check — runs via recrawl.yml (manual dispatch).
 *
 * 1) Resubmits the sitemap to Google Search Console (the legitimate "please
 *    recrawl these URLs" nudge — official Sitemaps API).
 * 2) Inspects every URL in the sitemap via the URL Inspection API and reports
 *    Google's crawl/index verdict, so you can see exactly which pages are
 *    "Discovered – not indexed", "Crawled – not indexed", etc.
 *
 * Uses the same Search Console OAuth credentials as the monthly audit.
 * Note: this does NOT force-index. Google has no public force-recrawl API for
 * general pages; sitemap resubmission + a healthy page is the supported lever.
 */

import { setTimeout as sleep } from "node:timers/promises";

const PROPERTY = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;
const SITE = "https://lulidigital.com";
const SITEMAP = `${SITE}/sitemap-index.xml`;

const required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN", "GOOGLE_SEARCH_CONSOLE_PROPERTY"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing secrets: ${missing.join(", ")}`);
  process.exit(1);
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

async function fetchLocs(url) {
  const res = await fetch(url);
  if (!res.ok) return [];
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function getSitemapUrls() {
  const top = await fetchLocs(SITEMAP);
  const urls = [];
  for (const loc of top) {
    if (loc.endsWith(".xml")) urls.push(...(await fetchLocs(loc)));
    else urls.push(loc);
  }
  return [...new Set(urls)];
}

async function resubmitSitemap(token) {
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/sitemaps/${encodeURIComponent(SITEMAP)}`;
  const res = await fetch(endpoint, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
  return { ok: res.ok, status: res.status, body: res.ok ? "" : await res.text() };
}

async function listSites(token) {
  const res = await fetch("https://searchconsole.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) return [];
  return data.siteEntry || [];
}

async function inspect(token, url, property) {
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: property }),
  });
  const data = await res.json();
  if (!res.ok) return { url, error: data.error?.message || `HTTP ${res.status}` };
  const r = data.inspectionResult?.indexStatusResult || {};
  return {
    url,
    verdict: r.verdict || "—",
    coverageState: r.coverageState || "—",
    lastCrawl: r.lastCrawlTime || "never",
    robots: r.robotsTxtState || "—",
  };
}

const token = await getAccessToken();

// 0) Show which Search Console properties this account actually owns.
const sites = await listSites(token);
console.log("Verified Search Console properties on this account:");
if (sites.length === 0) console.log("  (none returned)");
for (const s of sites) console.log(`  - ${s.siteUrl}  [${s.permissionLevel}]`);

// Pick the property that best covers the live site for URL inspection.
const inspectProperty =
  sites.find((s) => s.siteUrl === "sc-domain:lulidigital.com")?.siteUrl ||
  sites.find((s) => s.siteUrl.includes("lulidigital.com") && !s.siteUrl.includes("www"))?.siteUrl ||
  sites.find((s) => s.siteUrl.includes("lulidigital.com"))?.siteUrl ||
  PROPERTY;
console.log(`\nConfigured GOOGLE_SEARCH_CONSOLE_PROPERTY vs chosen inspection property:`);
console.log(`  configured: ${PROPERTY}`);
console.log(`  inspecting: ${inspectProperty}\n`);

// 1) Recrawl nudge: resubmit the sitemap
console.log(`Resubmitting sitemap: ${SITEMAP}`);
const sm = await resubmitSitemap(token);
console.log(sm.ok
  ? "✅ Sitemap resubmitted to Search Console."
  : `⚠️ Sitemap resubmit failed (HTTP ${sm.status}). ${sm.status === 403 ? "Token likely lacks the read-write 'webmasters' scope — inspection still works below." : sm.body.slice(0, 200)}`);

// 2) Inspect every URL and report crawl/index status
const urls = await getSitemapUrls();
console.log(`\nInspecting ${urls.length} URL(s) from the sitemap...\n`);

const notPassing = [];
for (const url of urls) {
  const r = await inspect(token, url, inspectProperty);
  if (r.error) {
    console.log(`ERROR  ${r.error}  ${url}`);
    continue;
  }
  const flag = r.verdict === "PASS" ? "✅" : "❌";
  console.log(`${flag} ${r.verdict.padEnd(8)} | ${r.coverageState.padEnd(34)} | last crawl: ${r.lastCrawl}  ${url}`);
  if (r.verdict !== "PASS") notPassing.push(r);
  await sleep(350); // be gentle on the inspection quota
}

console.log(`\n=== Summary: ${notPassing.length} of ${urls.length} URLs not indexed/passing ===`);
for (const r of notPassing) console.log(`- ${r.coverageState}: ${r.url}`);
if (notPassing.length === 0) console.log("All sitemap URLs are indexed. 🎉");

// Save a compact report for an optional Telegram step.
const summaryLines = [
  `Recrawl check — ${new Date().toISOString().split("T")[0]}`,
  sm.ok ? "Sitemap resubmitted." : `Sitemap resubmit failed (${sm.status}).`,
  `${notPassing.length}/${urls.length} URLs not indexed.`,
  ...notPassing.slice(0, 10).map((r) => `• ${r.coverageState} — ${r.url.replace(SITE, "")}`),
];
const { writeFileSync } = await import("node:fs");
writeFileSync("/tmp/recrawl-summary.txt", summaryLines.join("\n"));
