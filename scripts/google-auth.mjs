/**
 * Shared Google API auth for the SEO + indexing pipeline.
 *
 * Prefers a service-account key (GOOGLE_SA_KEY, falling back to the existing
 * GOOGLE_INDEXING_SA_KEY secret) so the pipeline does NOT depend on an OAuth
 * refresh token that silently expires. Falls back to the OAuth refresh token
 * only if no service-account key is present — giving a zero-downtime switch.
 *
 * The service account must be added as an OWNER of the Search Console property
 * for the Search Console + URL Inspection endpoints to authorize.
 *
 * Default scope (webmasters, read-write) covers Search Analytics queries,
 * sitemap resubmission, and URL inspection.
 */

import crypto from "node:crypto";

const b64url = (input) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function loadServiceAccount() {
  const raw = process.env.GOOGLE_SA_KEY || process.env.GOOGLE_INDEXING_SA_KEY;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    if (sa.client_email && sa.private_key) return sa;
  } catch {
    /* not valid JSON — fall through to OAuth */
  }
  return null;
}

/** True when a usable service-account key is configured. */
export function hasServiceAccount() {
  return loadServiceAccount() !== null;
}

/** True when usable OAuth refresh-token credentials are configured. */
export function hasOAuth() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN
  );
}

async function tokenFromServiceAccount(sa, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claims}`;
  const signature = crypto.createSign("RSA-SHA256").update(signingInput).sign(sa.private_key);
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

async function tokenFromOAuth() {
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

/**
 * Returns a Google API access token for `scope`. Uses the service account when
 * available, otherwise the OAuth refresh token. Logs which identity was used.
 */
export async function getGoogleAccessToken(scope = "https://www.googleapis.com/auth/webmasters") {
  const sa = loadServiceAccount();
  if (sa) {
    const token = await tokenFromServiceAccount(sa, scope);
    console.log(`Auth: service account (${sa.client_email})`);
    return token;
  }
  const token = await tokenFromOAuth();
  console.log("Auth: OAuth refresh token (no service-account key found — consider migrating)");
  return token;
}
