/**
 * One-click Google Business Profile authorisation.
 *
 * GBP does not support service accounts — Google requires a human to approve in
 * a browser — so this cannot be fully automated. What it CAN do is remove every
 * step except the approval itself: it starts a listener on localhost, opens the
 * consent page in Fiker's own (already signed-in) browser, catches the code on
 * redirect, exchanges it, discovers the account and location, and sets the
 * secrets. She clicks "Allow" once; nothing is copied or pasted by hand.
 *
 * Requires http://localhost:8787/callback to be an Authorised redirect URI on
 * the OAuth client (Cloud Console → Clients → the web client → Add URI).
 *
 *   GBP_CLIENT_ID=... GBP_CLIENT_SECRET=... node scripts/gbp-authorize.mjs
 */
import http from "node:http";
import { execFile } from "node:child_process";
import { execFileSync } from "node:child_process";

const PORT = 8787;
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPE = "https://www.googleapis.com/auth/business.manage";

const CLIENT_ID = process.env.GBP_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GBP_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GBP_CLIENT_ID and GBP_CLIENT_SECRET.");
  process.exit(2);
}

const authUrl = (() => {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", CLIENT_ID);
  u.searchParams.set("redirect_uri", REDIRECT);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", SCOPE);
  u.searchParams.set("access_type", "offline");
  // Without prompt=consent Google returns no refresh token on re-authorisation.
  u.searchParams.set("prompt", "consent");
  return u.toString();
})();

const done = (server, msg, code) => { server.close(); console.log(msg); process.exit(code); };

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/callback")) { res.writeHead(404).end(); return; }
  const params = new URL(req.url, `http://localhost:${PORT}`).searchParams;
  const err = params.get("error");
  const code = params.get("code");

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><meta charset=utf-8><title>LuliDigital</title>
<body style="font:16px/1.6 ui-sans-serif,system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#faf7f2;color:#1c1a17">
<div style="text-align:center;max-width:30rem;padding:24px">
<h1 style="font:600 1.5rem/1.3 ui-serif,Georgia,serif">${err ? "Authorisation cancelled" : "Authorised"}</h1>
<p style="opacity:.8">${err ? "You can close this tab and tell Claude what happened." : "You can close this tab — Claude is finishing the setup."}</p>
</div></body>`);

  if (err) return done(server, `\n✗ Google returned: ${err}`, 1);
  if (!code) return done(server, "\n✗ No code in the redirect.", 1);

  console.log("\n✅ consent received — exchanging…");
  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT, grant_type: "authorization_code",
    }),
  }).then((r) => r.json());

  if (!tok.refresh_token) {
    console.error(JSON.stringify(tok).slice(0, 400));
    return done(server, "✗ No refresh token returned.", 1);
  }
  console.log(`✅ refresh token obtained (scope: ${tok.scope || "?"})`);

  const auth = { Authorization: `Bearer ${tok.access_token}` };
  const accounts = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", { headers: auth })
    .then((r) => r.json()).catch((e) => ({ error: String(e) }));

  if (!accounts.accounts?.length) {
    console.error(JSON.stringify(accounts).slice(0, 400));
    return done(server, "✗ No Business Profile accounts visible — is the My Business Account Management API enabled, and did you sign in as the account that owns the profile?", 1);
  }
  console.log(`\nAccounts visible (${accounts.accounts.length}):`);
  accounts.accounts.forEach((a) => console.log(`  ${a.accountName || "(unnamed)"} — ${a.name}`));

  // A personal account with no locations is a common first result and would
  // otherwise look like success, so walk until one actually has a location.
  let chosen = null;
  for (const a of accounts.accounts) {
    const id = a.name.split("/")[1];
    const locs = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${id}/locations?readMask=name,title&pageSize=20`,
      { headers: auth },
    ).then((r) => r.json()).catch(() => ({}));
    if (locs.locations?.length) { chosen = { id, locs: locs.locations, a }; break; }
  }
  if (!chosen) return done(server, "\n✗ None of those accounts has a location attached.", 1);

  const locationId = chosen.locs[0].name.split("/").pop();
  console.log(`\n✅ account:  ${chosen.a.accountName || chosen.a.name} (${chosen.id})`);
  console.log(`✅ location: ${chosen.locs[0].title} (${locationId})`);

  for (const [k, v] of [
    ["GBP_REFRESH_TOKEN", tok.refresh_token],
    ["GBP_ACCOUNT_ID", chosen.id],
    ["GBP_LOCATION_ID", locationId],
  ]) {
    try {
      execFileSync("gh", ["secret", "set", k, "--body", v], { stdio: "pipe" });
      console.log(`  set ${k}`);
    } catch (e) { console.error(`  FAILED ${k}: ${e.message.split("\n")[0]}`); }
  }
  done(server, "\n🎉 Business Profile is wired up.", 0);
});

server.listen(PORT, () => {
  console.log(`Listening on ${REDIRECT}`);
  console.log("Opening the consent page in your browser — approve there.\n");
  execFile("open", [authUrl], () => {});
  console.log("If it doesn't open, paste this:\n" + authUrl + "\n");
});
setTimeout(() => done(server, "\n✗ Timed out after 5 minutes.", 1), 300000);
