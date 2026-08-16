#!/usr/bin/env node
/**
 * Post approved + due social packs from social/queue/.
 *
 * WHY THIS EXISTS: the Claude cloud routine writes packs correctly but its
 * sandbox blocks outbound egress to bsky.social / Composio (403 CONNECT), so
 * nothing ever published. GitHub Actions has full network access, so posting
 * lives here instead. See routines/README.md.
 *
 * Rules honoured (from routines/social-team-routine.md):
 *   - Only packs whose STATUS.md state is `approved` AND scheduledFor <= today.
 *   - LinkedIn: ONLY tracks declaring `<!-- asset: none -->`. Anything carrying
 *     an asset (honey-card/image/video) is paste-only — Fiker posts it manually.
 *   - Bluesky: mirrors the personal track; thread-aware.
 *   - Reddit: never automated.
 *   - Never invent a post URL. If a call fails, record the failure verbatim.
 *
 * Usage:
 *   node scripts/post-approved-packs.mjs            # dry run (default, safe)
 *   node scripts/post-approved-packs.mjs --live     # actually post
 *   node scripts/post-approved-packs.mjs --live --only <slug>
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath (not .pathname) — the repo path can contain spaces.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE = path.join(ROOT, "social", "queue");

const argv = process.argv.slice(2);
const LIVE = argv.includes("--live");
const ONLY = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const TODAY = new Date().toISOString().slice(0, 10);

const log = (...a) => console.log(...a);
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "").trim();

function readPack(slug) {
  const dir = path.join(QUEUE, slug);
  const statusPath = path.join(dir, "STATUS.md");
  if (!fs.existsSync(statusPath)) return null;
  const status = fs.readFileSync(statusPath, "utf8");
  const first = status.split("\n")[0];
  const state = first.split("|")[0].trim();
  const due = (first.match(/scheduledFor:\s*"?(\d{4}-\d{2}-\d{2})"?/) || [])[1] || null;
  // Company track is staggered to its own day (brand rule: never the same idea
  // on both pages the same day). It posts ONLY if STATUS names a company date.
  const companyDue = (first.match(/companyScheduledFor:\s*"?(\d{4}-\d{2}-\d{2})"?/) || [])[1] || null;

  const read = (f) => {
    const p = path.join(dir, f);
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
  };
  const assetOf = (raw) => {
    if (!raw) return null;
    const m = raw.match(/<!--\s*asset:\s*([^\s—-]+)/i);
    return m ? m[1].trim().toLowerCase() : null;
  };

  const personalRaw = read("linkedin-personal.md");
  const companyRaw = read("linkedin-company.md");
  const blueskyRaw = read("bluesky.md");

  return {
    slug, dir, statusPath, status, state, due, companyDue,
    personal: personalRaw && { asset: assetOf(personalRaw), body: stripComments(personalRaw) },
    company: companyRaw && { asset: assetOf(companyRaw), body: stripComments(companyRaw) },
    bluesky: blueskyRaw && { posts: parseBlueskyThread(stripComments(blueskyRaw)) },
  };
}

function parseBlueskyThread(body) {
  // Supports "**Post 1** ... **Post 2** ..." or a single plain body.
  const parts = body.split(/^\*\*Post\s*\d+\*\*\s*$/gim).map((s) => s.trim()).filter(Boolean);
  return (parts.length ? parts : [body]).map((t) => t.replace(/^\*\*Post\s*\d+\*\*\s*/i, "").trim());
}

/* ---------------------------------- Bluesky --------------------------------- */
// Raw atproto over fetch — no npm dependency needed in CI.

async function bskyLogin() {
  const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: process.env.BLUESKY_HANDLE,
      password: process.env.BLUESKY_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error(`Bluesky login failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// Make URLs clickable. Byte offsets, not character offsets (atproto requirement).
function urlFacets(text) {
  const enc = new TextEncoder();
  const facets = [];
  const re = /https?:\/\/[^\s)]+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const uri = m[0].replace(/[.,]$/, "");
    facets.push({
      index: {
        byteStart: enc.encode(text.slice(0, m.index)).length,
        byteEnd: enc.encode(text.slice(0, m.index) + uri).length,
      },
      features: [{ $type: "app.bsky.richtext.facet#link", uri }],
    });
  }
  return facets;
}

async function bskyPostThread(session, posts) {
  const out = [];
  let root = null, parent = null;
  for (const text of posts) {
    if (text.length > 300) throw new Error(`Bluesky post exceeds 300 chars (${text.length})`);
    const record = {
      $type: "app.bsky.feed.post",
      text,
      createdAt: new Date().toISOString(),
      ...(urlFacets(text).length ? { facets: urlFacets(text) } : {}),
      ...(root ? { reply: { root, parent } } : {}),
    };
    const res = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessJwt}` },
      body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.post", record }),
    });
    if (!res.ok) throw new Error(`Bluesky post failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const ref = { uri: data.uri, cid: data.cid };
    if (!root) root = ref;
    parent = ref;
    out.push(`https://bsky.app/profile/${session.handle}/post/${data.uri.split("/").pop()}`);
  }
  return out;
}

/* --------------------------------- LinkedIn --------------------------------- */
// Uses the same Composio action as the local pipeline (linkedin/post.js).

async function linkedinPost(body, profile) {
  const { Composio } = await import("@composio/client");
  const client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
  const author = profile === "company" ? process.env.LINKEDIN_ORG_URN : process.env.LINKEDIN_PERSON_URN;
  if (!author) throw new Error(`Missing URN for ${profile} profile`);

  const result = await client.tools.execute("LINKEDIN_CREATE_LINKED_IN_POST", {
    arguments: { author, commentary: body, visibility: "PUBLIC" },
    connected_account_id: process.env.LINKEDIN_CONNECTED_ACCOUNT_ID,
    user_id: process.env.LINKEDIN_USER_ID,
  });
  const id = result?.data?.x_restli_id ?? result?.data?.id;
  if (!id) throw new Error(`LinkedIn returned no post id: ${JSON.stringify(result).slice(0, 200)}`);
  return `https://www.linkedin.com/feed/update/${id}`;
}

/* ----------------------------------- main ----------------------------------- */

async function main() {
  if (!fs.existsSync(QUEUE)) { log("No social/queue directory."); return; }

  const slugs = ONLY ? [ONLY] : fs.readdirSync(QUEUE).filter((d) =>
    fs.statSync(path.join(QUEUE, d)).isDirectory());

  const packs = slugs.map(readPack).filter(Boolean);
  const due = packs.filter((p) => p.state === "approved" && p.due && p.due <= TODAY);

  log(`Today ${TODAY} · ${packs.length} pack(s) · ${due.length} approved + due`);
  if (!LIVE) log("DRY RUN — nothing will be posted. Pass --live to publish.\n");

  if (!due.length) {
    for (const p of packs.filter((x) => x.state === "approved")) {
      log(`  · ${p.slug}: approved but scheduledFor=${p.due ?? "unset"} (not due)`);
    }
    return;
  }

  let session = null;
  const results = [];

  for (const pack of due) {
    log(`\n=== ${pack.slug} (due ${pack.due}) ===`);
    const notes = [];

    // --- Bluesky (autonomous per spec) ---
    if (pack.bluesky?.posts?.length) {
      if (!LIVE) {
        log(`  [dry] Bluesky: would post ${pack.bluesky.posts.length} post(s)`);
      } else {
        try {
          session ??= await bskyLogin();
          const urls = await bskyPostThread(session, pack.bluesky.posts);
          log(`  ✅ Bluesky: ${urls.join(" , ")}`);
          notes.push(`bluesky POSTED ${urls.join(" , ")}`);
        } catch (e) {
          log(`  ❌ Bluesky FAILED: ${e.message}`);
          notes.push(`bluesky FAILED: ${e.message}`);
        }
      }
    }

    // --- LinkedIn (only asset:none) ---
    for (const [profile, track] of [["personal", pack.personal], ["company", pack.company]]) {
      if (!track) continue;
      // Cadence rule: the company track never goes out the same day as the
      // personal one. It waits for an explicit companyScheduledFor date.
      if (profile === "company") {
        if (!pack.companyDue) {
          log(`  ⏭  LinkedIn company: no companyScheduledFor — staggered, skipped`);
          notes.push("linkedin-company skipped (needs companyScheduledFor)");
          continue;
        }
        if (pack.companyDue > TODAY) {
          log(`  ⏭  LinkedIn company: scheduled ${pack.companyDue}, not due`);
          continue;
        }
      }
      if (track.asset !== "none") {
        log(`  ⏭  LinkedIn ${profile}: asset=${track.asset ?? "undeclared"} → paste-only, skipped`);
        notes.push(`linkedin-${profile} paste-only (asset=${track.asset ?? "undeclared"})`);
        continue;
      }
      if (!LIVE) { log(`  [dry] LinkedIn ${profile}: would post (asset:none)`); continue; }
      try {
        const url = await linkedinPost(track.body, profile);
        log(`  ✅ LinkedIn ${profile}: ${url}`);
        notes.push(`linkedin-${profile} POSTED ${url}`);
      } catch (e) {
        log(`  ❌ LinkedIn ${profile} FAILED: ${e.message}`);
        notes.push(`linkedin-${profile} FAILED: ${e.message}`);
      }
    }

    // --- record outcome in STATUS.md (never fabricate a URL) ---
    if (LIVE && notes.length) {
      const allPosted = notes.some((n) => n.includes("POSTED")) && !notes.some((n) => n.includes("FAILED"));
      const first = pack.status.split("\n")[0];
      const updated = (allPosted ? first.replace(/^approved/, "posted") : first)
        + ` | ${TODAY} auto-post: ${notes.join("; ")}`;
      fs.writeFileSync(pack.statusPath, [updated, ...pack.status.split("\n").slice(1)].join("\n"));
      results.push(pack.slug);
    }
  }

  if (LIVE && results.length) log(`\nUpdated STATUS.md for: ${results.join(", ")}`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
