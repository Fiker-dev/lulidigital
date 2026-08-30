#!/usr/bin/env node
/**
 * LinkedIn company announcement card — editorial layout with Mini Fiker on the
 * side, the way she appears alongside blog copy. Deliberately NOT the honeycomb
 * treatment: this is a clean poster, not brand wallpaper.
 *
 * Why this shape: the honey card was decoration-led. Current LinkedIn research
 * says analog/editorial texture and a single strong statement out-perform
 * ornament, and a character gives the eye a human anchor to land on. The
 * character sits to one side so the line, not the styling, is the hero.
 *
 * Usage:
 *   node scripts/render-linkedin-minime-card.mjs --brief <brief.md> --out <card.png>
 *   optional: --pose idea|laptop|coffee|celebrate|story-phone|story-relax
 *
 * Brief fields: Eyebrow, Headline, Pull-line (same shape as the other renderers).
 */
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const briefPath = val("--brief"), outPath = val("--out");
if (!briefPath || !outPath) throw new Error("Usage: --brief <brief.md> --out <card.png> [--pose <name>]");

const brief = await readFile(briefPath, "utf8");
const field = (n) => brief.match(new RegExp(`^${n}:\\s*(.+)$`, "mi"))?.[1]?.trim() ?? "";
const eyebrow  = (field("Eyebrow") || "LuliDigital · New article").toUpperCase();
const headline = field("Headline") || field("Title");
const pull     = field("Pull-line") || field("Pull line");
if (!headline) throw new Error("Brief needs a `Headline:`");

const pose = val("--pose") || field("Pose") || "idea";
const posePath = path.resolve(`public/assets/mini-fiker/${pose}.png`);
if (!existsSync(posePath)) throw new Error(`No such pose: ${posePath}`);

const W = 1080, H = 1350;
const PAPER = "#F4ECD9", INK = "#221C16", SOFT = "#6E6152", ACCENT = "#B4610D";
const esc = (t) => t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const wrap = (t, max) => {
  const out=[]; let line="";
  for (const w of t.split(/\s+/)) {
    const n = line ? `${line} ${w}` : w;
    if (n.length > max && line) { out.push(line); line = w; } else line = n;
  }
  if (line) out.push(line);
  return out;
};

// Character occupies the right third; copy gets the left two-thirds.
const COPY_W = 640;
const hLines = wrap(headline, 22);
const hSize  = hLines.length > 4 ? 62 : hLines.length > 3 ? 70 : 78;
const pLines = pull ? wrap(pull, 40) : [];
const hTop   = 300;

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <!-- paper fibre, so it reads as printed rather than a flat swatch -->
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3"/></filter>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.05"/>

  <text x="80" y="150" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="24" font-weight="700" letter-spacing="4" fill="${ACCENT}">${esc(eyebrow)}</text>
  <rect x="80" y="176" width="78" height="6" rx="3" fill="${ACCENT}"/>

  ${hLines.map((l,i)=>`<text x="80" y="${hTop + i*(hSize*1.12)}" font-family="Georgia, 'Iowan Old Style', serif"
      font-size="${hSize}" font-weight="700" fill="${INK}" letter-spacing="-1.5">${esc(l)}</text>`).join("")}

  ${pLines.length ? `<line x1="80" y1="${hTop + hLines.length*(hSize*1.12) + 26}" x2="${80+COPY_W-40}"
      y2="${hTop + hLines.length*(hSize*1.12) + 26}" stroke="${SOFT}" stroke-opacity=".3" stroke-width="1.5"/>` : ""}
  ${pLines.map((l,i)=>`<text x="80" y="${hTop + hLines.length*(hSize*1.12) + 84 + i*40}"
      font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="29" fill="${SOFT}">${esc(l)}</text>`).join("")}

  <line x1="80" y1="${H-150}" x2="${W-80}" y2="${H-150}" stroke="${SOFT}" stroke-opacity=".28" stroke-width="1.5"/>
  <text x="80" y="${H-100}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="30" font-weight="700" fill="${INK}">LuliDigital</text>
  <text x="${W-80}" y="${H-100}" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="23" fill="${SOFT}">Full article in the comments</text>
</svg>`;

const base = await sharp(Buffer.from(svg)).png().toBuffer();
// Mini Fiker on the right, standing on the footer rule.
const figure = await sharp(posePath).resize({ height: 700 }).png().toBuffer();
const fw = (await sharp(figure).metadata()).width ?? 400;

await mkdir(path.dirname(outPath), { recursive: true });
await sharp(base)
  .composite([{ input: figure, top: H - 150 - 700, left: Math.max(COPY_W + 40, W - fw - 60) }])
  .png({ compressionLevel: 9 })
  .toFile(outPath);
console.log(`Wrote ${outPath} — ${W}x${H}, pose "${pose}"`);
