# Blog Editorial Control

The scheduled blog workflow still runs every Monday, Wednesday, and Friday.

When you want to steer Lana manually, run the `Auto Blog Post` workflow from GitHub Actions and fill any of these optional inputs:

- `topic`
- `keyword`
- `category`
- `pain_point`
- `angle`
- `tone_notes`

If `topic` is filled, the workflow writes a custom article and does not advance the scheduled topic queue.

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
