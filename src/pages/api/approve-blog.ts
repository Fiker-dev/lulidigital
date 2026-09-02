import type { APIRoute } from "astro";
import { timingSafeEqual } from "../../lib/security";

/**
 * Webhook-free blog approval.
 *
 * The old "Approve & schedule" inline button posted a callback to
 * /api/lana-telegram, but that bot's webhook now belongs to OpenClaw
 * (long-polling), so nothing ever reaches this site and approvals silently
 * died — which is how drafts kept getting orphaned.
 *
 * This endpoint is the replacement: a plain tap-link in the Telegram draft
 * message. It authenticates with the same BLOG_PREVIEW_TOKEN the draft preview
 * uses and dispatches the same workflows the Telegram handler used to.
 *
 *   /api/approve-blog?slug=…&date=YYYY-MM-DD&key=…       → schedule for that date
 *   /api/approve-blog?slug=…&action=now&key=…            → publish immediately
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

async function dispatchWorkflow(workflow: string, inputs: Record<string, string>) {
  const token = getEnv("GITHUB_WORKFLOW_TOKEN");
  if (!token) throw new Error("Missing GITHUB_WORKFLOW_TOKEN.");
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: REF, inputs }),
    },
  );
  if (!res.ok) throw new Error(`${workflow} dispatch failed: ${res.status} ${await res.text()}`);
}

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get("slug") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const action = url.searchParams.get("action") ?? "schedule";
  const key = url.searchParams.get("key") ?? "";
  const expectedKey = getEnv("BLOG_PREVIEW_TOKEN");

  // Same guard as the draft preview: bad token reveals nothing.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new Response("Not found", { status: 404 });
  if (!expectedKey || !key || !timingSafeEqual(key, String(expectedKey))) {
    return new Response("Not found", { status: 404 });
  }

  try {
    if (action === "now") {
      await dispatchWorkflow("publish-draft-blog.yml", { slug, publish_date: "" });
      return page(
        "Publishing now",
        `<p><code>${slug}</code> is going live. It'll be indexed within a few minutes, and the LinkedIn announcement lands on Telegram as soon as the page is confirmed live.</p>`,
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return page("Missing date", "<p>No go-live date was supplied for this approval.</p>", 400);
    }
    await dispatchWorkflow("schedule-draft.yml", { slug, date });
    return page(
      "Approved",
      `<p><code>${slug}</code> is scheduled for <strong>${date}</strong>.</p>
       <p>It stays hidden until that morning, then goes live, gets indexed, and the LinkedIn company announcement (video + caption) arrives on Telegram right after.</p>`,
    );
  } catch (err) {
    return page("Something went wrong", `<p>${String(err instanceof Error ? err.message : err)}</p>`, 500);
  }
};
