/**
 * Find the Business Profile account + location IDs from an existing refresh
 * token, and set them as secrets.
 *
 * Split out from gbp-authorize.mjs because the consent click is the only part
 * that needs a human. Newly enabled Business Profile APIs are quota-limited —
 * Google grants quota separately from enabling the API, and a fresh project can
 * sit at 0 QPM for a while — so discovery may fail for reasons that have
 * nothing to do with the token. This can be re-run any number of times without
 * touching the browser.
 *
 *   GBP_CLIENT_ID=... GBP_CLIENT_SECRET=... GBP_REFRESH_TOKEN=... \
 *     node scripts/gbp-discover.mjs
 *
 * With no GBP_REFRESH_TOKEN in the environment it reads the saved GitHub secret
 * is not possible (secrets are write-only), so pass it explicitly.
 */
import { execFileSync } from "node:child_process";

const CLIENT_ID = process.env.GBP_CLIENT_ID;
const CLIENT_SECRET = process.env.GBP_CLIENT_SECRET;
const REFRESH = process.env.GBP_REFRESH_TOKEN;
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH) {
  console.error("Need GBP_CLIENT_ID, GBP_CLIENT_SECRET and GBP_REFRESH_TOKEN.");
  process.exit(2);
}

const tok = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
    refresh_token: REFRESH, grant_type: "refresh_token",
  }),
}).then((r) => r.json());

if (!tok.access_token) {
  console.error("Refresh token did not exchange:", JSON.stringify(tok).slice(0, 300));
  process.exit(1);
}
console.log(`✅ token valid (scope: ${tok.scope || "?"})`);
const auth = { Authorization: `Bearer ${tok.access_token}` };

let accounts = null;
for (let attempt = 1; attempt <= 5; attempt++) {
  const res = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", { headers: auth });
  const body = await res.json().catch(() => ({}));
  if (res.ok) { accounts = body; break; }
  console.log(`  accounts lookup → ${res.status}${res.status === 429 ? " (quota)" : ""}  attempt ${attempt}/5`);
  if (res.status !== 429) { console.error(JSON.stringify(body).slice(0, 400)); break; }
  if (attempt < 5) await new Promise((r) => setTimeout(r, 30000));
}

if (!accounts?.accounts?.length) {
  console.error("\n✗ Still cannot list accounts.");
  console.error("  A persistent 429 means the project has no Business Profile API quota yet.");
  console.error("  Enabling the API and being granted quota are two separate approvals:");
  console.error("  https://developers.google.com/my-business/content/prereqs");
  process.exit(1);
}

console.log(`\nAccounts (${accounts.accounts.length}):`);
accounts.accounts.forEach((a) => console.log(`  ${a.accountName || "(unnamed)"} — ${a.name} [${a.type || "?"}]`));

let chosen = null;
for (const a of accounts.accounts) {
  const id = a.name.split("/")[1];
  const res = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${id}/locations?readMask=name,title&pageSize=20`,
    { headers: auth },
  );
  const body = await res.json().catch(() => ({}));
  if (body.locations?.length) { chosen = { id, a, locs: body.locations }; break; }
  if (!res.ok) console.log(`  locations for ${id} → ${res.status}`);
}

if (!chosen) {
  console.error("\n✗ No account has a location attached. Is the profile shared with this login?");
  process.exit(1);
}

const locationId = chosen.locs[0].name.split("/").pop();
console.log(`\n✅ account:  ${chosen.a.accountName || chosen.a.name} (${chosen.id})`);
console.log(`✅ location: ${chosen.locs[0].title} (${locationId})`);
if (chosen.locs.length > 1) {
  console.log(`   (${chosen.locs.length} locations; using the first)`);
  chosen.locs.slice(1).forEach((l) => console.log(`     ${l.title} → ${l.name.split("/").pop()}`));
}

for (const [k, v] of [["GBP_ACCOUNT_ID", chosen.id], ["GBP_LOCATION_ID", locationId]]) {
  try { execFileSync("gh", ["secret", "set", k, "--body", v], { stdio: "pipe" }); console.log(`  set ${k}`); }
  catch {
    // In CI the default token cannot write secrets. The IDs are identifiers,
    // not credentials, so print them for whoever is watching to set.
    console.log(`  RESULT ${k}=${v}`);
  }
}
console.log("\n🎉 Business Profile is wired up.");
