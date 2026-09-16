import type { APIRoute } from "astro";
import { timingSafeEqual } from "../../lib/security";

/**
 * Tap-link approval for social packs — the sibling of /api/approve-blog.
 *
 * post-approved-packs.mjs only publishes packs whose STATUS.md state is
 * `approved`, but nothing could set that: the routine writes packs as
 * awaiting_approval and there was no approval channel at all. 24 packs piled
 * up unpostable. This endpoint dispatches approve-pack.yml so a tap in
 * Telegram flips the status.
 *
 *   /api/approve-pack?slug=…&key=…              → approve, due today
 *   /api/approve-pack?slug=…&date=…&key=…       → approve, due that date
 *   /api/approve-pack?slug=…&action=discard&key=…
 */

export const prerender = false;

const REPO_OWNER = "Fiker-dev";
const REPO_NAME = "lulidigital";
const REF = "main";

function getEnv(name: string) {
  return import.meta.env[name] ?? process.env[name];
}

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;min-height:100vh;display:grid;place-items:center;
       font:16px/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif;
       background:#faf7f2;color:#1c1a17;padding:24px}
  @media (prefers-color-scheme:dark){body{background:#14120f;color:#f0ece5}}
  .card{max-width:32rem;text-align:center}
  h1{font:600 1.5rem/1.3 ui-serif,Georgia,serif;margin:0 0 .5rem}
  p{margin:.5rem 0;opacity:.8}
  code{background:rgba(128,128,128,.18);padding:.15em .4em;border-radius:4px}
</style>
<div class="card"><h1>${title}</h1>${body}</div>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get("slug") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const discard = url.searchParams.get("action") === "discard";
  const key = url.searchParams.get("key") ?? "";
  const expectedKey = getEnv("BLOG_PREVIEW_TOKEN");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new Response("Not found", { status: 404 });
  if (!expectedKey || !key || !timingSafeEqual(key, String(expectedKey))) {
    return new Response("Not found", { status: 404 });
  }
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return page("Bad date", "<p>The due date was not in YYYY-MM-DD form.</p>", 400);
  }

  const token = getEnv("GITHUB_WORKFLOW_TOKEN");
  if (!token) return page("Not configured", "<p>GITHUB_WORKFLOW_TOKEN is missing.</p>", 500);

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/approve-pack.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: REF,
          inputs: { slug, date, discard: discard ? "true" : "false" },
        }),
      },
    );
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

    return discard
      ? page("Discarded", `<p><code>${slug}</code> won't be posted.</p>`)
      : page(
          "Approved",
          `<p><code>${slug}</code> is approved${date ? ` for <strong>${date}</strong>` : " for today"}.</p>
           <p>It goes out on the next Post Approved Social Packs run — weekdays at 11:23 UTC.</p>`,
        );
  } catch (err) {
    return page("Something went wrong", `<p>${String(err instanceof Error ? err.message : err)}</p>`, 500);
  }
};
