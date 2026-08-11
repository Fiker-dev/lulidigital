# LuliDigital Content Guide — what I make, where it goes

> A running reference for what content lives on which channel, on which day,
> in which style. When a spontaneous idea shows up, find its bucket below and
> drop it in (add a line to `video-schedule.json` for videos, or a note in
> `social/queue/<slug>/` for posts). Reflects the brand system in
> `routines/brand/social-brand-system.md` and the current posting pattern —
> edit this file when the plan changes.

---

## 1. The weekly lineup (default rhythm)

| Day | LinkedIn — Personal | LinkedIn — Company | Video / YouTube | Theme |
|---|---|---|---|---|
| **Mon** | ✅ post (story/character) | — | optional | **Educational** — counter-intuitive framework, 200–400w, no pitch. CTA: *More at lulidigital.com* |
| **Tue** | ✅ post | ✅ post (work-led) | — | — |
| **Wed** | ✅ post | — | 🎬 **video day** | **Value Tip** — one actionable idea, 100–200w. CTA: *More at lulidigital.com* |
| **Thu** | ✅ post | ✅ post (work-led) | — | — |
| **Fri** | ✅ post | ✅ (when there's something to show) | 🎬 **video day** | **Soft Promo** — outcome-led, anonymised, 150–300w. CTA: *If this sounds familiar, lulidigital.com* |
| Sat/Sun | — | — | — | nothing runs |

**Cadence rules (from the brand system):**
- **Personal** posts **every weekday**. It carries the character and story.
- **Company** posts **2–3× a week** (Tue/Thu, + Fri when there's real proof to show). It proves competence — leads with the WORK.
- **Same idea can run on both pages, but NEVER the same text, never the same day.** Personal tells the *story*; company states the *insight*. Stagger the angle and the date.
- Blog link always goes in the **first comment**, never the post body.
- Video upload is **always manual** (you post it, you stay for the first hour). Bluesky auto-mirrors the personal post. Reddit is manual.

---

## 2. The channels

| Channel | Voice | Who runs it |
|---|---|---|
| **LinkedIn Personal** (Fiker) | Warm, first-person, friend-to-friend. Allowed to start with "I". Anime-Fiker energy in text. | Routine drafts → **you approve** |
| **LinkedIn Company** (LuliDigital) | The authority. Operator's take, service education, anonymised proof, blog announcements. Credible, never stiff. | Routine drafts → **you approve** |
| **YouTube (Shorts)** | The video itself + title/description. | **You upload manually** |
| **Bluesky** | Shorter, sharper mirror of the personal post. ≤300 chars. | **Auto-posts** every run |
| **Reddit** | Community-native draft, no promo. | Routine drafts → **you post manually** |
| **Google Business Profile** | Local updates, tips. | **Gemini app** (auto) — not this routine |

---

## 3. Content-type menu — pick a bucket for any idea

### 📝 Text posts
| Type | Channel | Day | Voice |
|---|---|---|---|
| **Educational** | Personal (+ company, different text) | Mon | Framework, no pitch |
| **Value Tip** | Personal | Wed | One copy-able idea |
| **Soft Promo** | Personal + Company | Fri | Outcome-led, anonymised |
| **Caption-only both pages** | Personal + Company | any post day | Same idea, two voices — story on personal, insight on company. Use when you have a strong thought but no visual yet. |

### 🖼️ Company visuals (the WORK — company page leads with these)
| Type | What it is |
|---|---|
| **Build receipt** | Screen recording of a real system (workflow / agent / dashboard) + one-line insight. No character needed. |
| **Honey story card** | Remotion honey-branded card: one stat, one quote, or one before/after. |
| **Blog announcement card** | Post title + one sharp pull-line + live URL. Auto-made when a new blog goes live. |

*(Mini Fiker may appear as a small presenter accent on company visuals — never the lead. Character-led content belongs on the personal page.)*

### 🎬 Video formats (declare one per video)
| Format | Look | Best for | Character |
|---|---|---|---|
| **Paper / CRT — "The System" series** | Vintage newspaper / typewriter / 90s handwritten-note look (LULIDIGITAL TIMES). $0 to make. | Sharp business reframes, Value Tips | none / text-led |
| **Billboard** | Big vintage billboard one-liner — a single punchy line as the whole frame | A spontaneous one-liner too good to bury in text | none / text-led |
| **Hedra bookstore** | Composited scene video (alternates with the paper format) | Warmer, atmospheric storytelling | Fiker |
| **full-size** | Fiker avatar talking direct-to-camera, lip-synced | Authority: AI Updates, education, buyer-facing | Mini or Anime Fiker |
| **mini-irl** | Small Fiker composited over real b-roll (walking, café, desk) | Relatability, humor, New Season story | Mini or Anime Fiker |

**B-roll rule:** no recognisable human faces in real footage — backs, hands, feet, screens, streets. Mini/Anime Fiker is the only face.

### 📺 Standalone series (rotate when there's no fresh blog to anchor)
| Series | What | Character | Format leaning |
|---|---|---|---|
| **AI Update** | One verified AI development this week + what it means operationally. Take a position. | Mini Fiker | full-size |
| **Who It's For** | One role + the before/after of one service (AI/Marketing/VA Desk). Anonymised, concrete. | Mini Fiker | full-size |
| **New Season** | Fiker's healthcare→AI transition, told with dignity | Anime Fiker | mini-irl |
| **The System** | Business reframes ("using AI like a jet engine as a fan") | text-led | paper / CRT |

### Characters at a glance
- **Mini Fiker** → business: automation, agency systems, client stories, LinkedIn-safe.
- **Anime Fiker** → relatable: day-in-the-life, founder humor, emotional moments, story.

---

## 4. "I've got a spontaneous idea — where does it go?"

Ask, in order:

1. **Is it a punchy one-liner / reframe?** → **Paper/CRT** ("The System") or a **Billboard** video. Add it to `video-schedule.json` → `upcoming` on the next free Wed or Fri.
2. **Is it a story or personal moment?** → **Personal** LinkedIn post, and/or a **mini-irl** video (Anime Fiker). Never the company page.
3. **Is it reacting to AI news?** → **AI Update** series, Mini Fiker, full-size video + a personal post with "here's how you'd actually use this."
4. **Is it proof / a client outcome / a real system?** → **Company** page: build receipt or honey story card. Anonymise, no fabrication.
5. **Is it a how-to / tip someone could copy?** → **Value Tip** (Wed), personal page or paper video.
6. **Just a strong thought, no visual?** → **caption-only on both pages** — story voice on personal, insight voice on company, staggered by a day.

**Where to drop it:**
- **Video idea** → add an entry to `social/video-schedule.json` → `upcoming` (`date`, `file`, `format`, `title`, `hook`, `idea`, `series`). The routine writes the caption on the run before that date.
- **Post idea** → make a folder `social/queue/<slug>/` with a one-line note, or just tell the Social Team routine in-session and it'll build the pack.

---

## 5. The quality gate (every post clears this before it ships)
1. Useful even without the CTA?
2. Screenshot-worthy without the brand name?
3. CTA feels earned, not bolted on?
4. Any word you could cut?
5. Sounds like your smartest friend — not a press release?

**Never:** invented stats/clients/testimonials, engagement bait, "Link in bio", "We're thrilled to announce", or the banned words (*game-changer, unlock, leverage, supercharge, journey*).
