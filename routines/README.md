# LuliDigital blog automation — Cowork routine, approval in Claude

One brain (the "LuliDigital Auto-Blog (LANa)" cloud routine, Mon/Wed/Fri
08:17 UTC) researches, writes, and pushes a hidden draft, then ends its run
with a review summary. You get the Claude notification, open the run, and
**reply in the session** — approve, publish now, or request edits. Nothing
publishes until you reply.

```
COWORK ROUTINE (M/W/F 08:17 UTC)        YOU (Claude app)         GITHUB (deterministic)
────────────────────────────────       ─────────────────        ──────────────────────
• WebSearch research                    open the run
• writes draft .md (draft:true)         and reply:
• blog-quality tests must pass
• pushes (Vercel deploys preview)
• final message = review summary ────▶  "approve" ──────────▶   publish-scheduled.yml
                                                                 → live + indexed that morning
                                        "publish it now" ───▶   agent flips draft:false, pushes
                                                                 → index-on-publish.yml indexes
                                        "change X" ─────────▶   agent revises in-session, re-sends
                                        (silence) ──────────▶   draft holds forever
```

## Why no Telegram
The old flow (Telegram Approve button → webhook → workflow dispatch) died
whenever anything else polled the same bot — and OpenClaw (conversational
LANa) does exactly that, clearing the webhook on every restart. Moving
approval into the routine's own session removes the webhook, the health
workflow, and the bot contention entirely. **The Telegram bot now belongs to
OpenClaw alone.** The webhook endpoint (`src/pages/api/lana-telegram.ts`)
remains in the codebase but nothing routes to it.

## Files
| File | What it is |
|---|---|
| `auto-blog-routine.md` | Canonical routine spec: research → draft → review summary → in-session approval |

## Secrets
The routine embeds `BLOG_PREVIEW_TOKEN` (for the preview URL) in its prompt.
No Telegram secrets, no Anthropic API key, no Gemini key — research is the
routine's own web search. The publish/indexing side keeps its existing
GitHub Actions secrets (`GOOGLE_INDEXING_SA_KEY`, etc.).

## Setup checklist
1. Connect GitHub for cloud agents (`/web-setup` in Claude Code, or install
   the Claude GitHub App on `Fiker-dev/lulidigital`). Routine creation is
   blocked until this is done.
2. Create the routine (Claude Code `/schedule` does this): cron
   `17 8 * * 1,3,5`, model `claude-opus-4-8`, repo connected, prompt from
   `auto-blog-routine.md` (with the preview token filled in).
3. Run it once → confirm the draft lands + the review summary reads right →
   reply "approve" and confirm the scheduled publish + indexing fire.

## Cutover state (2026-07-14)
The old pipeline's crons are DISABLED (commented out, workflow_dispatch kept):
- `auto-blog.yml` — replaced by the Cowork routine
- `blog-catchup.yml` — safety net for the old cron; retired with it
- `telegram-webhook-health.yml` — kept the Approve button alive; retired with
  the button (and it was fighting OpenClaw for the bot every 6 hours)

Reversible: uncomment the `schedule:` blocks to restore the old pipeline.

## What stays on GitHub Actions (unchanged)
- `publish-scheduled.yml` (daily) — publishes + indexes scheduled drafts; this
  is what "approve" hands off to
- `index-on-publish.yml` (new) — indexes posts flipped live by a direct push
  ("publish it now")
- weekly-seo, monthly-seo-audit, recrawl — SEO suite, untouched
- The 8 on-demand LANa workflow APIs (publish-draft-blog, revise-draft, …) —
  still callable via workflow_dispatch; nothing depends on them for the new
  flow, but they're kept for manual use
