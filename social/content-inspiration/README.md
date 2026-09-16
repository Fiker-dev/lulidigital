# Content Inspiration Library

This library gives the social routine visual references for LinkedIn and
YouTube assets. It is a direction library, not a copy library: reuse the
format, composition, texture, pacing, or hook pattern while replacing the
creator's identity, wording, claims, and branding with original LuliDigital
content.

## Add an inspiration

1. Put the screenshot, image, or short reference clip in `assets/`.
2. Add one entry to `catalog.json` using `entry-template.json` as a guide.
3. Describe what is reusable in `borrow` and what must not be copied in
   `avoid`.
4. Use specific tags. Good tags include platform, media type, content pillar,
   tone, texture, composition, hook style, and audience.

The original source URL should be recorded when known. References are for
internal creative direction only and must never be published as-is.

## Automatic selection

Run:

```sh
node scripts/select-content-inspiration.mjs \
  --platform linkedin \
  --format static \
  --tags "founder-lesson,personal,clarity,handwritten"
```

The selector returns the highest-scoring active reference. A post pack must
record the result in `inspiration-selection.json`. If the score is below 4,
the routine should use the brand system instead of forcing a weak match.

