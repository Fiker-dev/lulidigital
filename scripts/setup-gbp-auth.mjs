/**
 * Finish Google Business Profile setup from a refresh token.
 *
 * publish-google-business-post.mjs needs five values. CLIENT_ID and
 * CLIENT_SECRET are GitHub secrets; GOOGLE_REFRESH_TOKEN, GOOGLE_ACCOUNT_ID
 * and GOOGLE_LOCATION_ID are not — which is why that script has been exiting
 * with "Skipping... Missing secrets" on every publish instead of posting.
 *
 * Only the refresh token needs a human, because Google requires browser
 * consent. The account and location IDs are discoverable once it exists, so
 * this fetches them rather than sending Fiker hunting through the console.
 *
 * HOW TO GET THE REFRESH TOKEN (2 minutes)
 * The OAuth client's only authorised redirect URI is the OAuth Playground, and
 * Google retired the out-of-band flow, so the Playground is the path:
 *
 *   1. https://developers.google.com/oauthplayground
 *   2. Gear icon (top right) → tick "Use your own OAuth credentials"
 *      → paste the Client ID and Client secret
 *   3. Left panel, bottom box "Input your own scopes", paste:
 *        https://www.googleapis.com/auth/business.manage
 *      → Authorize APIs
 *   4. Sign in AS THE ACCOUNT THAT CAN MANAGE THE BUSINESS PROFILE, approve
 *   5. Step 2 → "Exchange authorization code for tokens"
 *   6. Copy the refresh token (starts 1//)
 *
 * Then:
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
 *     node scripts/setup-gbp-auth.mjs --refresh-token "1//..."
 *
 * It verifies the token, finds the account and location, and prints the exact
 * `gh secret set` commands. Nothing is written without being shown first.
 */
const args = process.argv.slice(2);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = val("--refresh-token");

if (args.includes("--help") || !refreshToken) {
  console.log(`Usage:\n  GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \\\n    node scripts/setup-gbp-auth.mjs --refresh-token "1//..."\n`);
  console.log("Get the refresh token from the OAuth Playground — see the comment at the top of this file.");
  process.exit(args.includes("--help") ? 0 : 2);
}
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the environment.");
  process.exit(2);
}

// Exchange for an access token — this also proves the refresh token and the
// (newly rotated) client secret actually match.
const tok = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
    refresh_token: refreshToken, grant_type: "refresh_token",
  }),
}).then((r) => r.json());

if (!tok.access_token) {
  console.error("Could not exchange the refresh token.");
  console.error(JSON.stringify(tok).slice(0, 400));
  console.error("\nIf this says invalid_client, the Playground was used with the OLD client secret — redo step 2 with the current one.");
  process.exit(1);
}
console.log(`✅ refresh token works (scope: ${tok.scope || "unknown"})`);
if (tok.scope && !tok.scope.includes("business.manage")) {
  console.error("⚠️  That token does NOT carry the business.manage scope — redo the Playground step with that scope selected.");
  process.exit(1);
}

const auth = { Authorization: `Bearer ${tok.access_token}` };

const accounts = await fetch(
  "https://mybusinessaccountmanagement.googleapis.com/v1/accounts", { headers: auth },
).then((r) => r.json()).catch((e) => ({ error: String(e) }));

if (!accounts.accounts?.length) {
  console.error("No Business Profile accounts visible to this login.");
  console.error(JSON.stringify(accounts).slice(0, 400));
  console.error("\nUsual causes: the My Business Account Management API is not enabled on the project,");
  console.error("or this Google account has not been granted access to the profile yet.");
  process.exit(1);
}

console.log(`\nAccounts visible (${accounts.accounts.length}):`);
accounts.accounts.forEach((a) => console.log(`  ${a.accountName || "(unnamed)"} — ${a.name} [${a.type || "?"}]`));

// Find the first account that actually has a location; a personal account with
// no locations is a common first result and would otherwise look like success.
let chosen = null;
for (const a of accounts.accounts) {
  const id = a.name.split("/")[1];
  const locs = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${id}/locations?readMask=name,title&pageSize=20`,
    { headers: auth },
  ).then((r) => r.json()).catch(() => ({}));
  if (locs.locations?.length) { chosen = { account: a, accountId: id, locations: locs.locations }; break; }
}

if (!chosen) {
  console.error("\nNone of those accounts has a location. The profile has probably not been shared with this login yet.");
  process.exit(1);
}

const loc = chosen.locations[0];
const locationId = loc.name.split("/").pop();
console.log(`\n✅ account:  ${chosen.account.accountName || chosen.account.name} (${chosen.accountId})`);
console.log(`✅ location: ${loc.title || loc.name} (${locationId})`);
if (chosen.locations.length > 1) {
  console.log(`\n   ${chosen.locations.length} locations found — using the first. Others:`);
  chosen.locations.slice(1).forEach((l) => console.log(`     ${l.title} → ${l.name.split("/").pop()}`));
}

console.log(`\nRun these to finish:\n`);
console.log(`  gh secret set GOOGLE_REFRESH_TOKEN --body '${refreshToken}'`);
console.log(`  gh secret set GOOGLE_ACCOUNT_ID --body '${chosen.accountId}'`);
console.log(`  gh secret set GOOGLE_LOCATION_ID --body '${locationId}'`);
