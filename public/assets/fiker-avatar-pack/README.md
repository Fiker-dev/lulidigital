# Fiker Avatar Pack

Canonical transparent Anime Fiker poses for the LuliDigital website, blog, social content, and Claude-assisted content workflows.

## Pose Guide

| Asset | Recommended use |
| --- | --- |
| `coffee.png` | Intro and story sections |
| `thinking.png` | Problem and challenge sections |
| `explaining.png` | Pull quotes and key ideas |
| `thumbsup.png` | CTA sections |
| `pointing-left.png` | Side notes and callouts |
| `pointing-right.png` | Buttons and lead magnets |
| `laptop.png` | AI workflow and tutorial sections |
| `notebook.png` | Planning and summary sections |
| `lightbulb.png` | Ideas and tips |
| `excited.png` | Wins and success stories |
| `phone.png` | Social media sections |
| `listening.png` | FAQ and community sections |
| `waving.png` | Welcome and about pages |
| `confidence.png` | Authority and testimonial sections |

## React/Astro Usage

```tsx
import FikerAvatar from '../components/FikerAvatar';

<FikerAvatar pose="thinking" />
<FikerAvatar pose="explaining" size={420} className="article-avatar" />
<FikerAvatar pose="thumbsup" size="min(36rem, 100%)" alt="Fiker approves this next step" />
```

The supported props are:

- `pose`: required typed pose name from the table above.
- `size`: optional CSS width as a number in pixels or any CSS length string. Defaults to `320`.
- `className`: optional CSS class names.
- `alt`: optional accessible alternative text. A pose-based default is provided.

In an Astro file, import the component normally. It renders static HTML and does not require a client hydration directive:

```astro
---
import FikerAvatar from '../components/FikerAvatar';
---

<FikerAvatar pose="coffee" size={360} />
```

## Claude Selection Rule

Claude should select an existing pose by semantic purpose before requesting a new image. Reference files by their stable public path:

```text
/assets/fiker-avatar-pack/thinking.png
```

Do not rename files, change the character identity, or overwrite a pose with a different outfit or hairstyle. Add a new consistently named pose when the existing pack does not cover the required expression.

## Identity Standard

All poses use the same Anime Fiker identity: warm medium-brown skin, almond-shaped brown eyes, defined brows, short voluminous copper-brown ringlets, fitted black turtleneck, dark wide-leg jeans, black belt, pointed black shoes, and delicate gold jewelry.
