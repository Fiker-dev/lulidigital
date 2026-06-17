/**
 * Request indexing — runs via request-indexing.yml (manual dispatch).
 *
 * Uses the Indexing API to send a URL_UPDATED notification for every page in
 * the sitemap, asking Google to (re)crawl them. Authenticates with a service
 * account (GOOGLE_INDEXING_SA_KEY) that must be added as an OWNER of the
 * Search Console property.
 *
 * Note: the Indexing API is officially for JobPosting/BroadcastEvent. For
 * general pages it usually prompts faster crawling but isn't guaranteed.
 * Quota: 200 URLs/day.
 */

import crypto from "node:crypto";
import { writeFileSync } from "node:fs";

const SITE = "https://lulidigital.com";
const SITEMAP = `${SITE}/sitemap-index.xml`;

let SA;
try {
  SA = JSON.parse(process.env.GOOGLE_INDEXING_SA_KEY || "{}");
} catch {
  console.error("GOOGLE_INDEXING_SA_KEY is not valid JSON.");
  process.exit(1);
}
if (!SA.client_email || !SA.private_key) {
  console.error("GOOGLE_INDEXING_SA_KEY is missing client_email/private_key.");
  process.exit(1);
}

const b64url = (input) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: SA.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claims}`;
  const signature = crypto.createSign("RSA-SHA256").update(signingInput).sign(SA.private_key);
  const jwt = `${signingInput}.${b64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || JSON.stringify(data));
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

async function publish(token, url) {
  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, type: "URL_UPDATED" }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, error: data?.error?.message };
}

const token = await getAccessToken();
console.log("Authenticated to the Indexing API as", SA.client_email);

const urls = await getSitemapUrls();
console.log(`Requesting indexing for ${urls.length} URL(s)...\n`);

let ok = 0;
const failures = [];
for (const url of urls) {
  const r = await publish(token, url);
  if (r.ok) {
    ok++;
    console.log(`✅ ${url}`);
  } else {
    failures.push(`${url} — ${r.error || `HTTP ${r.status}`}`);
    console.log(`❌ ${url} — ${r.error || `HTTP ${r.status}`}`);
  }
  await new Promise((s) => setTimeout(s, 200));
}

console.log(`\nDone: ${ok} requested, ${failures.length} failed.`);
if (failures.length) {
  console.log("Failures:");
  failures.forEach((f) => console.log("  " + f));
}

const summary = `Indexing requests (${new Date().toISOString().split("T")[0]}): ${ok} submitted, ${failures.length} failed.` +
  (failures.length ? "\n" + failures.slice(0, 8).map((f) => "• " + f).join("\n") : "");
writeFileSync("/tmp/indexing-summary.txt", summary);
