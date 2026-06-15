# Blog Editorial Control

The scheduled blog workflow still runs every Monday, Wednesday, and Friday.

It can now use the SEO agent keyword research instead of the fixed topic queue. Set:

```text
BLOG_USE_SEO_AGENT=true
```

When that is enabled and no manual `topic` is supplied, `scripts/generate-post.mjs` researches the daily keyword across the configured region set, builds the post around that keyword, infers the category, and does not advance `scripts/blog-topics.json`.

The default region set is:

```text
BLOG_SEO_AGENT_GEOS=AFRICA,NL,DE,SE,ZA
```

SEO-agent posts also receive one natural internal link to the matching local landing page:

- `AFRICA` links to `/africa`
- `ZA` links to `/south-africa`
- `NL` links to `/amsterdam`
- `DE` links to `/munich`
- `SE` links to `/stockholm`

When you want to steer Lana manually, run the `Auto Blog Post` workflow from GitHub Actions and fill any of these optional inputs:

- `topic`
- `keyword`
- `category`
- `pain_point`
- `angle`
- `tone_notes`
- `source_notes`
- `source_url`
- `fiker_take`
- `publish_status`
- `use_seo_agent`

If `topic` is filled, the workflow writes a custom article and does not advance the scheduled topic queue. Manual topics take priority over the SEO agent.

Use `publish_status: draft` when you want to moderate the article first. Draft posts are committed to the repo but hidden from the blog index, direct blog URLs, Telegram notifications, and Google Business Profile posting.

To approve a draft, edit the generated markdown file in `src/content/blog/` and change:

```yaml
draft: true
```

to:

```yaml
draft: false
```

Then commit and push the change.

## Telegram Control

The `/api/lana-telegram` endpoint lets the Telegram bot control draft creation and approval.

Required Vercel environment variables:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET`
- `GITHUB_WORKFLOW_TOKEN`

`GITHUB_WORKFLOW_TOKEN` should be a GitHub token that can dispatch workflows for `Fiker-dev/lulidigital`.

Set the Telegram webhook:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://lulidigital.com/api/lana-telegram&secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

Telegram commands:

```text
/blog Why founders keep hiring help and still feel overwhelmed
```

```text
topic: Why founders keep hiring help and still feel overwhelmed
keyword: founder delegation mistakes
category: Virtual Assistant
pain point: They hired someone but still chase everything.
angle: The missing operating system is the real problem.
tone notes: Funny, relatable, pain relief, practical.
```

```text
/publish how-to-hire-virtual-assistant-guide-founders-ceos
```

```text
/schedule how-to-hire-virtual-assistant-guide-founders-ceos 2026-06-10
```

## Source-Led Posts

Use source-led inputs when a TikTok creator, AI update, newsletter, or founder story gives you the direction for a blog post.

The blog should not just report the update. It should educate through a strong hook, explain what changed, then show the practical solution path for business owners.

Rules:

- `source_notes` is the summary of the update or story. Use your own words.
- `source_url` is optional context.
- `fiker_take` is the LuliDigital point of view. This is where the post becomes yours.
- Do not copy a creator's wording closely.
- Do not invent client stories, fake quotes, fake metrics, or personal memories.
- If no real story is supplied, the post should use operational observations and generic examples only.
- Every blog should include a clear solution-based section: what to audit, what to automate or systemise, what humans should still approve, and where LuliDigital can help.
- Mention the relevant LuliDigital desk naturally, not as a forced pitch.

Example:

```text
topic: What the newest AI agent update means for small business owners
source_notes: A creator explained that the new AI agent can now complete multi-step browser tasks, but people in the comments were worried about trusting it with real work.
source_url: https://www.tiktok.com/...
fiker_take: AI should carry the tedious work, but humans should keep judgment, approvals, and brand taste.
angle: The opportunity is not replacing people. It is building a workflow where AI prepares the work and people make the decisions.
tone_notes: Grounded, sharp, useful. No fake stories.
```

Recommended blog shape:

```text
Hook: Name the AI update, business risk, or opportunity in one sharp opening.
What changed: Explain the update in plain English.
Why it matters: Translate it for founders and business owners.
The solution path: Show what to audit, automate, delegate, or approve.
LuliDigital fit: Mention the right desk only where it helps.
Close: Give one practical next step.
```

## Recommended Tone Formula

Use this style for LuliDigital posts:

```text
Grounded, sharp, solution-based, and pain-relief focused. Make it feel like the founder's inbox, calendar, team handoffs, and marketing dashboard are the real problem. Keep it practical and useful, not motivational. Do not fabricate relatability.
```

## Example Manual Brief

```text
topic: Why founders keep hiring help and still feel overwhelmed
keyword: founder delegation mistakes
category: Virtual Assistant
pain_point: They hired someone, but still explain everything twice and chase every task.
angle: The problem is not the assistant, it is the missing operating system around the assistant.
tone_notes: Grounded, a little sharp, useful, and calm. No fake client stories.
```
