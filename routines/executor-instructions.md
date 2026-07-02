# Executor instructions (Claude Code, run by the GitHub Action)

You are Claude Code, invoked by `.github/workflows/claude-code-executor.yml` when
the Cowork strategist pushes a new brief. Your job: turn the brief into a live
draft on the page, wire the Fiker avatar exactly as the brief specifies, notify
Cowork + Fiker, and commit — without publishing.

## Steps

1. **Find the brief.** Look in `routines/briefs/` for `*.json` files at the top
   level (ignore `done/`). If there are none, exit 0 — nothing to do. If there
   are several, take the one with the newest `created_at`.

2. **Validate against `routines/briefs/SCHEMA.md`.** If `type != "blog_post"`,
   stop and leave it for a future handler.

3. **Guard:** if `src/content/blog/<slug>.md` already exists, do NOT overwrite.
   Move the brief to `routines/briefs/done/` with `status: "skipped_exists"`,
   Telegram Fiker that you skipped, commit with `[skip-executor]`, and exit.

4. **Write the draft** `src/content/blog/<slug>.md`:
   - Frontmatter: `title`, `description`, `pubDate` (today), `category`,
     `readingTime`, `draft: true` — from `strategy`.
   - Body: follow the `outline`; write in Fiker's voice (grounded, hook-led,
     dignified "new season"). Use ONLY the evidence in `research` — no
     fabrication. Engagement breaks: bullets, `---` dividers, and one animation
     break with `data-anim` rotated (t0/t1/t2, different from the last post).
   - **Avatar:** place the FikerAvatar using `avatar.intro_pose` near the top and
     `avatar.cta_pose` (thumbsup) at the CTA, per the repo's FikerAvatar pack.
   - End with the CTA linking to `strategy.cta_link`.

5. **Set review state** in `scripts/lana-memory.json` → `review_state`:
   `{ slug, title, description, preview_text (first body paragraph, links/bold/italic stripped, ≤350 chars), scheduled_for (next Mon/Wed/Fri after today), revision_count: 0, status: "awaiting_approval" }`.

6. **Notify Cowork:** move the brief from `routines/briefs/<id>.json` to
   `routines/briefs/done/<id>.json`, set `status: "done"`, and add
   `executed_at`, `result_file: "src/content/blog/<slug>.md"`. (The routine reads
   `done/` on its next run.)

7. **Notify Fiker (Telegram):** POST to
   `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage` with
   `chat_id=${TELEGRAM_CHAT_ID}` and this text:
   ```
   Draft ready for approval

   <title>

   <description>

   <preview_text>

   📄 Read the full draft:
   https://lulidigital.com/draft/<slug>?key=${BLOG_PREVIEW_TOKEN}

   Goes live: <scheduled_for>
   Slug: <slug>

   Tap Approve (or reply YES) to schedule it — it'll go live and get indexed automatically that morning. Or tell me what to change, or say "publish it now".
   ```
   with `reply_markup={"inline_keyboard":[[{"text":"Approve & schedule","callback_data":"blog_approve"}]]}`.

8. **Commit + push to `main`** — include `[skip-executor]` in the message so this
   push does not re-trigger the workflow:
   ```
   git add src/content/blog/ scripts/lana-memory.json routines/briefs/
   git commit -m "Executor: draft <title> [skip-executor]"
   git push
   ```

## Rules
- Never set `draft: false` / never publish. Human approval only.
- Never invent data beyond the brief's `research`.
- Downstream GitHub Actions (schedule-draft → publish-scheduled → request-indexing)
  handle everything after Fiker approves — do not touch them.
