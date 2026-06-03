# Blog Editorial Control

The scheduled blog workflow still runs every Monday, Wednesday, and Friday.

When you want to steer Lana manually, run the `Auto Blog Post` workflow from GitHub Actions and fill any of these optional inputs:

- `topic`
- `keyword`
- `category`
- `pain_point`
- `angle`
- `tone_notes`
- `publish_status`

If `topic` is filled, the workflow writes a custom article and does not advance the scheduled topic queue.

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

## Recommended Tone Formula

Use this style for LuliDigital posts:

```text
Funny, relatable, solution-based, and pain-relief focused. Make it feel like the founder's inbox, calendar, team handoffs, and marketing dashboard are the real problem. Keep it practical and useful, not motivational.
```

## Example Manual Brief

```text
topic: Why founders keep hiring help and still feel overwhelmed
keyword: founder delegation mistakes
category: Virtual Assistant
pain_point: They hired someone, but still explain everything twice and chase every task.
angle: The problem is not the assistant, it is the missing operating system around the assistant.
tone_notes: Funny, relatable, a little sharp, but useful and calm.
```
