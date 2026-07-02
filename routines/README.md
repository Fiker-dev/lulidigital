# LuliDigital blog automation — Cowork routine + existing GitHub publish

One brain (a Claude Cowork routine on your subscription) writes and sends the
draft. You tap **Approve** once. Your existing GitHub automation publishes it
live, indexes it, and notifies you. **You never touch GitHub.**

```
COWORK ROUTINE (subscription)          YOU              GITHUB (already automated)
────────────────────────────         ───────           ──────────────────────────
• Gemini API → research
• open-source scraper → signals
• writes draft .md (draft:true)
• picks Fiker avatar poses
• sets review_state, pushes
• sends Telegram draft ───────────▶  tap Approve ────▶  lana-telegram webhook
                                                         → publish workflow
                                                         → live + Google indexing
                                     "it's live" ◀────────  → Telegram notification
```

## Why there's no separate "Claude Code publisher"
Publishing is deterministic — flip `draft:false`, push, run the indexing script —
and your GitHub workflows (`publish-draft-blog.yml` / `publish-scheduled.yml` +
`request-indexing.mjs`) already do it reliably, triggered by the Approve tap at
`src/pages/api/lana-telegram.ts`. Wrapping that in a Claude Code agent would add a
model + OAuth token + non-determinism for zero benefit. All the *judgment*
(research, writing, avatar choice) lives in the Cowork routine; the *mechanics*
stay in the scripts that already work.

## Files
| File | What it is |
|---|---|
| `auto-blog-routine.md` | Paste-into-Cowork prompt: research → write draft → send for approval |

## Secrets — where each lives
**Cowork routine settings:**
| Secret | Purpose |
|---|---|
| `GEMINI_API_KEY` | Trend research |
| (scraper creds, if any) | Whatever your open-source scraper needs |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Send the draft for approval |
| `BLOG_PREVIEW_TOKEN` | Build the `/draft/<slug>?key=…` preview URL |
| GitHub write access | Connect the repo so the routine can push the draft |

*No Anthropic API key — the routine is Claude.* The publish side reuses the
GitHub Actions secrets that already exist (`GOOGLE_INDEXING_SA_KEY`, etc.).

## Setup checklist
1. In Cowork: create the routine, connect repo `Fiker-dev/lulidigital` (write access).
2. Paste the prompt from `auto-blog-routine.md`.
3. Add the secrets above; install/point to the open-source scraper.
4. Schedule it (old cadence Mon/Wed/Fri 08:17 UTC — set the local equivalent, minute off :00).
5. Run once → confirm the draft arrives on Telegram with an Approve button, then tap Approve and confirm it goes live + you get the "it's live" notification.

## Cutover (only AFTER the routine is verified)
Disable the old generator so nothing double-posts (reversible, nothing deleted):
- `.github/workflows/auto-blog.yml` → comment out the `schedule:` cron (keep `workflow_dispatch`).
- `.github/workflows/blog-catchup.yml` → comment out the `schedule:` cron (retired).

> Ask Claude Code to "apply the auto-blog cutover" and it will make both edits.

## Two things to decide / verify
1. **Approve = schedule vs publish-now.** Today the Approve button *schedules* the
   post for its next Mon/Wed/Fri slot (a steady drip); it still goes live and gets
   indexed automatically that morning — hands-free, just not instant. If you want
   Approve to publish *immediately*, it's a one-line change in
   `src/pages/api/lana-telegram.ts` (dispatch `publish-draft-blog.yml` instead of
   `schedule-draft.yml`). Tell Claude Code which you want.
2. **Telegram webhook health.** The whole hands-free chain depends on the Approve
   button reaching GitHub. This was previously flagged as blocked on
   `TELEGRAM_WEBHOOK_SECRET` on Vercel — confirm a live Approve tap actually
   dispatches the workflow before trusting it end-to-end.

## What stays on GitHub Actions (unchanged)
The 8 on-demand LANa APIs (publish-draft-blog, revise-draft, schedule-draft,
delete-draft, unpublish-post, save-blog-plan, save-lana-instructions,
request-indexing) and the Google-auth scripts (publish-scheduled, weekly-seo,
monthly-seo-audit, recrawl). Cowork can trigger these too, so it stays the single
brain — but they keep their secrets and run where they already work.
