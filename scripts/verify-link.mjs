/**
 * One place that answers "does this link actually work?"
 *
 * Every link sent to Fiker goes through this first. Enough dead links have
 * reached her — /draft/ previews gated on a token that doesn't match on
 * Vercel, approval endpoints returning a 9-byte "Not found", blog URLs sent
 * before the deploy finished — that no sender should be trusted to check for
 * itself, or to remember to.
 *
 * Retries, because a just-published page is legitimately 404 for a minute
 * while Vercel builds. A 404 that never resolves is a broken link; a 404 for
 * thirty seconds is a deploy in progress.
 *
 *   import { verifyLink, verifyAll } from "./verify-link.mjs";
 *   const { ok, status } = await verifyLink(url);
 *
 * CLI:  node scripts/verify-link.mjs <url> [url...]
 */

export async function verifyLink(url, { attempts = 6, waitMs = 10000, expect = 200 } = {}) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { url, ok: false, status: 0, reason: "not a URL" };
  }
  let status = 0;
  for (let i = 0; i < attempts; i++) {
    try {
      // HEAD first (cheap); some hosts don't implement it, so fall back to GET.
      let res = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, { method: "GET", redirect: "follow" });
      }
      status = res.status;
      if (status === expect) return { url, ok: true, status, attempts: i + 1 };
    } catch (err) {
      status = 0;
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, waitMs));
  }
  return { url, ok: false, status, reason: `still ${status || "unreachable"} after ${attempts} tries` };
}

/** Verify several links; resolves to { ok, results } where ok means ALL passed. */
export async function verifyAll(urls, opts) {
  const results = await Promise.all(urls.filter(Boolean).map((u) => verifyLink(u, opts)));
  return { ok: results.every((r) => r.ok), results };
}

/** Pull every http(s) URL out of a message body. */
export function extractLinks(text = "") {
  return [...new Set((text.match(/https?:\/\/[^\s<>"')\]]+/g) || []))];
}

// Compare resolved paths, not a hand-built file:// string — the repo path has
// a space in it, which import.meta.url percent-encodes and the naive compare
// silently fails, making the CLI a no-op.
import { fileURLToPath } from "node:url";
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const urls = process.argv.slice(2);
  if (!urls.length) { console.error("Usage: node scripts/verify-link.mjs <url> [url...]"); process.exit(2); }
  const { ok, results } = await verifyAll(urls, { attempts: 2, waitMs: 2000 });
  for (const r of results) console.log(`${r.ok ? "OK  " : "DEAD"} ${r.status || "-"}  ${r.url}${r.reason ? "  (" + r.reason + ")" : ""}`);
  process.exit(ok ? 0 : 1);
}
