# Brief contract (shared folder between Cowork routine and Claude Code)

The Cowork routine writes one JSON file per post into `routines/briefs/`.
Claude Code (the executor GitHub Action) reads the newest one, builds the page,
then moves it to `routines/briefs/done/` with a completion record appended.

**Filename:** `routines/briefs/<YYYY-MM-DD>-<slug>.json`

## Schema

```json
{
  "id": "2026-07-02-automate-uk-founder-workflows",
  "type": "blog_post",
  "status": "pending",
  "created_by": "cowork-routine",
  "created_at": "2026-07-02T08:17:00Z",

  "strategy": {
    "topic": "How UK founders automate the busywork without losing the human touch",
    "slug": "automate-uk-founder-workflows",
    "title": "Automate the Busywork: A UK Founder's Guide to Keeping the Human Touch",
    "description": "≤155 chars, includes the primary keyword naturally",
    "primary_keyword": "business automation for founders uk",
    "category": "AI Automation",
    "angle": "problem-solution, grounded, no hype",
    "pain_point": "founders drowning in repetitive ops work",
    "tone_notes": "grounded, hook-led, practical, dignified",
    "target_market": "UK",
    "reading_time": "6 min read",
    "outline": [
      "## Why the busywork keeps winning",
      "## What to audit before you automate",
      "## The three systems worth automating first",
      "## Where a human still has to decide"
    ],
    "cta_text": "See how LuliDigital automates it for you",
    "cta_link": "/ai"
  },

  "avatar": {
    "intro_pose": "welcoming",
    "cta_pose": "thumbsup",
    "notes": "Use the FikerAvatar pack; intro pose chosen to fit the topic mood"
  },

  "research": {
    "gemini_summary": "2-4 sentences of grounded trend context from Gemini",
    "scraped_sources": [
      { "url": "https://…", "insight": "one specific, non-fabricated takeaway" }
    ],
    "keyword_signals": ["business automation uk", "ai for small business"]
  },

  "constraints": [
    "no fabrication",
    "draft: true",
    "engagement breaks (bullets, dividers, one animation break with data-anim rotated t0/t1/t2)",
    "end with CTA linking to cta_link",
    "abort rather than overwrite an existing slug"
  ],

  "target_file": "src/content/blog/automate-uk-founder-workflows.md"
}
```

## Field notes
- `type`: `blog_post` today. Reserve `page_update` for later (updating a service page — same brief, different `target_file`).
- `status`: always `pending` when written by the routine. The executor flips it to `done` in the moved copy.
- `avatar`: the executor uses this to place the FikerAvatar poses on the post. All avatar decisions come from the routine.
- `research`: the executor writes the body from this evidence — it does not re-research.
