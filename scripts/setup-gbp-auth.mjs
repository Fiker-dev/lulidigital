/**
 * One-time Google Business Profile authorisation.
 *
 * The posting script needs five values. Two already exist as GitHub secrets
 * (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET); three do not, which is why
 * publish-google-business-post.mjs has been exiting with "Skipping... Missing
 * secrets" on every run instead of posting anything.
 *
 * Only ONE of the three needs a human: the refresh token, because Google
 * requires Fiker to consent in a browser. The account and location IDs are
 * discoverable from the API once that consent exists, so this fetches them
 * rather than asking her to hunt through the Cloud Console.
 *
 * Step 1 — print the consent URL:
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/setup-gbp-auth.mjs --url
 *
 * Step 2 — paste back the code Google shows:
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/setup-gbp-auth.mjs --code "4/0A..."
 *
 * It then discovers the account + location and prints the exact `gh secret set`
 * commands. Nothing is written anywhere without being shown first.
 */
const args = process.argv.slice(2);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// Out-of-band flow: Google shows the code on screen instead of redirecting,
// so this works without hosting a callback endpoint.
const REDIRECT = "urn:ietf:wg:oauth:2.0:oob";
const SCOPE = "https://www.googleapis.com/auth/business.manage";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first (they are already GitHub secrets).");
  process.exit(2);
}

if (args.includes("--url")) {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", CLIENT_ID);
  u.searchParams.set("redirect_uri", REDIRECT);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", SCOPE);
  u.searchParams.set("access_type", "offline");
  // Without this, Google returns no refresh token if the app was authorised before.
  u.searchParams.set("prompt", "consent");
  console.log("\nOpen this, sign in as the account that owns the Business Profile, approve, then copy the code:\n");
  console.log(u.toString());
  console.log("\nThen run:\n  node scripts/setup-gbp-auth.mjs --code \"<the code>\"\n");
  process.exit(0);
}

const code = val("--code");
if (!code) {
  console.error("Usage: --url   (get the consent link)\n       --code \"<code>\"   (exchange it)");
  process.exit(2);
}

const tok = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT, grant_type: "authorization_code",
  }),
}).then((r) => r.json());

if (!tok.refresh_token) {
  console.error("No refresh token returned. Google only issues one with prompt=consent and access_type=offline, and a code can be used once.");
  console.error(JSON.stringify(tok).slice(0, 400));
  process.exit(1);
}
console.log("✅ refresh token obtained");

const auth = { Authorization: `Bearer ${tok.access_token}` };

// Account and location live on two different newer APIs; the posting script
// still uses v4 for localPosts, which is where Google kept that endpoint.
const accounts = await fetch(
  "https://mybusinessaccountmanagement.googleapis.com/v1/accounts", { headers: auth },
).then((r) => r.json()).catch((e) => ({ error: String(e) }));

const account = accounts.accounts?.[0];
if (!account) {
  console.error("Could not list accounts — is the Business Profile API enabled on this Google Cloud project?");
  console.error(JSON.stringify(accounts).slice(0, 400));
  process.exit(1);
}
const accountId = account.name.split("/")[1];
console.log(`✅ account: ${account.accountName || account.name} (${accountId})`);

const locs = await fetch(
  `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title&pageSize=10`,
  { headers: auth },
).then((r) => r.json()).catch((e) => ({ error: String(e) }));

const loc = locs.locations?.[0];
if (!loc) {
  console.error("No locations returned.");
  console.error(JSON.stringify(locs).slice(0, 400));
  process.exit(1);
}
const locationId = loc.name.split("/").pop();
console.log(`✅ location: ${loc.title || loc.name} (${locationId})`);

console.log(`\nRun these to finish:\n`);
console.log(`  gh secret set GOOGLE_REFRESH_TOKEN --body '${tok.refresh_token}'`);
console.log(`  gh secret set GOOGLE_ACCOUNT_ID --body '${accountId}'`);
console.log(`  gh secret set GOOGLE_LOCATION_ID --body '${locationId}'`);
if (locs.locations.length > 1) {
  console.log(`\n(${locs.locations.length} locations found — using the first. Others:`);
  locs.locations.slice(1).forEach((l) => console.log(`   ${l.title} → ${l.name.split("/").pop()}`));
  console.log(")");
}
