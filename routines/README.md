# LuliDigital — Migrating `auto-blog` to a Claude Cowork routine

This folder holds everything to move the **blog draft generator** from GitHub
Actions to a **Claude Cowork routine** (an always-on, cron-scheduled cloud
agent). It is a **hybrid** migration: only the judgment-heavy front of the
pipeline moves; the rest of the automation stays on GitHub Actions.

---

## Why we're doing this

The old `auto-blog.yml` called `generate-post.mjs`, which depended on Gemini
topic research (`research-topic.mjs`). Gemini kept returning "no usable topic",
so scheduled runs fell back to junk keywords and once clobbered a published
post — which is why the schedule was paused.

A Cowork routine **is Claude**, so it researches and writes the topic natively.
That **removes the Gemini dependency entirely** and removes the need for the
`blog-catchup` safety net (cloud routines don't silently drop like GitHub cron).

---

## What moves vs. what stays

| Job | Trigger | Action |
|---|---|---|
| **auto-blog** (generate → draft → Telegram preview) | Mon/Wed/Fri cron | ➡️ **Move to Cowork routine** |
| **blog-catchup** | cron safety net | 🗑️ **Retire** (not needed with cloud reliability) |
| publish-draft-blog, revise-draft, schedule-draft, delete-draft, unpublish-post, save-blog-plan, save-lana-instructions, request-indexing | on-demand (LANa/Telegram calls them) | ✅ **Stay on GitHub Actions** — they're a callable API, not a schedule |
| publish-scheduled, weekly-seo, monthly-seo-audit, recrawl | cron, deterministic scripts | ✅ **Stay on GitHub Actions** — pure Google-API scripts, gain nothing as an agent |

**Integration guarantee:** the routine writes the *exact same output contract*
the old workflow did (draft `.md` + `review_state` in `lana-memory.json` +
Telegram approval message with the `blog_approve` button). So the entire
downstream approval loop keeps working unchanged.

---

## Secrets the routine needs (only 3)

As a native agent it needs far fewer secrets than the workflow. Add these in the
Cowork routine settings:

| Secret | Purpose |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Send the approval preview |
| `TELEGRAM_CHAT_ID` | Where to send it |
| `BLOG_PREVIEW_TOKEN` | Build the `/draft/{slug}?key=…` preview URL |

**Not needed:** `ANTHROPIC_API_KEY` (the routine *is* Claude), `GEMINI_API_KEY`
(Claude researches natively — the whole point), and all Google OAuth /
service-account keys (indexing happens downstream on GitHub).

GitHub write access comes from **connecting the repo** to the routine in Cowork,
not from a secret you paste.

Copy the current values from your GitHub repo secrets:
`Settings → Secrets and variables → Actions`.

---

## Setup checklist (do this in Claude Cowork — ~5 minutes)

1. **Create a new routine / scheduled agent** in Claude Cowork.
2. **Connect the GitHub repo** `Fiker-dev/lulidigital` with **write access**
   (so it can commit drafts and push to `main`).
3. **Paste the prompt** from [`auto-blog-routine.md`](./auto-blog-routine.md)
   (everything below the `---` line) as the routine's instructions.
4. **Set the schedule** to Mon/Wed/Fri morning. The old cron was `17 8 * * 1,3,5`
   in **UTC**; set the equivalent in your Cowork timezone (08:17 UTC ≈ 10:17
   South Africa). Keep the minute off :00.
5. **Add the 3 secrets** from the table above.
6. **Run it once manually** and verify:
   - a new `src/content/blog/{slug}.md` (with `draft: true`) is committed to `main`,
   - `scripts/lana-memory.json` → `review_state.status` is `awaiting_approval`,
   - a Telegram message with the **Approve & schedule** button arrived,
   - the draft preview URL opens.

---

## Cutover (only AFTER the routine is verified working)

Once you've confirmed a good draft came through Telegram from the routine,
disable the two GitHub jobs it replaces. Both are reversible — nothing is deleted.

**`.github/workflows/auto-blog.yml`** — comment out the schedule so only manual
runs remain (keep the file as a manual fallback):

```yaml
on:
  # Moved to Claude Cowork routine (see routines/). Manual dispatch kept as fallback.
  # schedule:
  #   - cron: '17 8 * * 1,3,5'
  workflow_dispatch:
    inputs:
      # …unchanged…
```

**`.github/workflows/blog-catchup.yml`** — comment out the schedule (the routine
doesn't need a catch-up net):

```yaml
on:
  # Retired: Cowork routine replaces the auto-blog schedule and doesn't drop runs.
  # schedule:
  #   - cron: '17 14 * * 1,3,5'
  workflow_dispatch:
```

> Ask Claude Code to "apply the auto-blog cutover" and it will make both edits.

---

## Rollback

If the routine misbehaves:
1. Pause / disable the routine in Cowork.
2. Uncomment the two `schedule:` blocks above.

You're back to the exact previous GitHub Actions behaviour. No data migration,
no deleted files.

---

## What did NOT change

Your Telegram approval loop, editing, scheduling, publishing, SEO refresh,
audits, recrawl, and indexing all still run on GitHub Actions exactly as before.
LANa still dispatches those workflows the same way. This migration only swaps how
the *first* draft gets written.
