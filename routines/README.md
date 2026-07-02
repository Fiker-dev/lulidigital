# LuliDigital marketing automation — Cowork routine + Claude Code

Everything marketing runs as **two Claude brains on your subscription** (no
metered Anthropic API), with the git repo as the shared folder between them.

```
┌─ COWORK ROUTINE — the strategist ──────────────────┐
│  scheduled · your Claude subscription               │
│  • Gemini API  → trend research                     │
│  • open-source scraper → competitor/industry signals│
│  • decides topic, angle, keyword, CTA, AVATAR pose  │
│  • writes a BRIEF → routines/briefs/<id>.json       │
│  • git commit + push                                │
└───────────────┬─────────────────────────────────────┘
                │  (shared folder = the git repo)
                ▼  push to routines/briefs/*.json triggers ↓
┌─ CLAUDE CODE — the executor (GitHub Action) ────────┐
│  triggered on brief push · subscription OAuth token │
│  • reads the brief                                  │
│  • writes the draft .md + wires the Fiker avatar    │
│  • sets review_state (awaiting_approval)            │
│  • moves brief → routines/briefs/done/  (notifies   │
│    Cowork) and Telegrams Fiker (notifies you)       │
│  • git commit + push → Vercel deploys hidden draft  │
└───────────────┬─────────────────────────────────────┘
                ▼  Fiker approves in Telegram → existing GitHub Actions
                   (schedule-draft → publish-scheduled → request-indexing)
```

**Why this shape:** research is Gemini + scraper (paid where you want it),
intelligence is the Cowork routine + Claude Code (both subscription, no
per-token API), and the human-approval loop you already have is untouched.

## Files in this folder
| File | What it is |
|---|---|
| `auto-blog-routine.md` | Paste-into-Cowork prompt for the **strategist** routine |
| `briefs/SCHEMA.md` | The brief contract both brains agree on (incl. avatar + research) |
| `briefs/` | Pending briefs the routine drops here |
| `briefs/done/` | Completed briefs the executor moves here (Cowork reads these) |
| `executor-instructions.md` | The prompt **Claude Code** follows to build the page |
| `../.github/workflows/claude-code-executor.yml` | The GitHub Action that runs Claude Code on OAuth |

## Secrets — where each lives

**In the Cowork routine settings:**
| Secret | Purpose |
|---|---|
| `GEMINI_API_KEY` | Trend research |
| (scraper creds, if any) | Whatever your open-source scraper needs |
| GitHub write access | Connect the repo so the routine can push briefs |

*The routine does NOT need an Anthropic API key — it is Claude.*

**In GitHub → Settings → Secrets and variables → Actions:**
| Secret | Purpose |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Runs Claude Code on your subscription (see below) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Notify Fiker |
| `BLOG_PREVIEW_TOKEN` | Build the `/draft/<slug>?key=…` preview URL |

Generate the OAuth token (Pro/Max) locally, once:
```
claude setup-token
```
Copy the value into the GitHub secret `CLAUDE_CODE_OAUTH_TOKEN`. This is what lets
the Action use your subscription instead of the metered API.

## Setup checklist

**Cowork (once):**
1. Create the strategist routine; connect repo `Fiker-dev/lulidigital` (write access).
2. Paste the prompt from `auto-blog-routine.md`.
3. Add `GEMINI_API_KEY` + scraper creds; install/point to the open-source scraper.
4. Schedule it (old cadence was Mon/Wed/Fri 08:17 UTC — set the local equivalent, minute off :00).

**GitHub (once):**
5. `claude setup-token` → add `CLAUDE_CODE_OAUTH_TOKEN` secret.
6. Confirm `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `BLOG_PREVIEW_TOKEN` exist (they already do for the current workflows).

**Verify end-to-end:**
7. Run the routine once → a brief appears in `routines/briefs/`.
8. The **Claude Code Executor** action fires → a draft `.md` (with the avatar) is
   committed, `review_state` is `awaiting_approval`, the brief moved to `done/`,
   and a Telegram approval message arrives.
9. Approve in Telegram → the existing pipeline schedules, publishes, and indexes.

## Loop-safety
The executor commits with `[skip-executor]`, and the workflow's `if:` guard skips
those commits — so its own push never re-triggers it. Completed briefs live in
`briefs/done/`, which is outside the `routines/briefs/*.json` trigger path.

## Cutover (only AFTER the new flow is verified)
Disable the old generator so nothing double-posts. Reversible — nothing deleted.
- `.github/workflows/auto-blog.yml` → comment out the `schedule:` cron (keep `workflow_dispatch` as fallback).
- `.github/workflows/blog-catchup.yml` → comment out the `schedule:` cron (retired).

> Ask Claude Code to "apply the auto-blog cutover" and it will make both edits.

## What stays on GitHub Actions (unchanged)
The 8 on-demand LANa APIs (publish-draft-blog, revise-draft, schedule-draft,
delete-draft, unpublish-post, save-blog-plan, save-lana-instructions,
request-indexing) and the Google-auth scripts (publish-scheduled, weekly-seo,
monthly-seo-audit, recrawl). Cowork can trigger these too, so it stays the single
brain — but they keep their secrets and run where they already work.

## Two things to verify on first run
1. **claude-code-action commit behavior** — the executor prompt tells Claude Code
   to `git commit && git push` itself (Bash is in `--allowedTools`). If the action
   is configured to open a PR instead in your setup, adjust the prompt accordingly.
2. **Model availability** — `--model claude-sonnet-4-6` must be enabled on your
   subscription/token; change it in the workflow if needed.
