#!/usr/bin/env node
/**
 * Render a LinkedIn DOCUMENT carousel (multi-page PDF) from a slide brief.
 *
 * WHY a carousel, not a single card: LinkedIn document posts average ~6.6%
 * engagement vs ~2% for text and well above a single image. 4:5 portrait
 * (1080x1350) takes maximum mobile screen space, and 71% of LinkedIn traffic
 * is mobile — so type is sized to be legible at thumb distance.
 *
 * Design rules (from what actually performs, not decoration):
 *   - One idea per slide, very few words, very large type.
 *   - High contrast, same palette every time → instantly recognisable.
 *   - A progress dot row: it signals "there's more", which lifts dwell time
 *     (the #1 LinkedIn algorithm signal).
 *   - Brand mark stays small and consistent; the message is the hero.
 *
 * Brief format (markdown):
 *   Eyebrow: LuliDigital · New article
 *   Slide 1: Getting paid on time should not require courage.
 *   Slide 2: Most founders treat late payment as admin. It's cash flow.
 *   ...
 *   CTA: Full article in the comments.
 *
 * Usage:
 *   node scripts/render-linkedin-carousel.mjs --brief <brief.md> --out <carousel.pdf>
 */

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const args = process.argv.slice(2);
const value = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};

const briefPath = value("--brief");
const outPath = value("--out");
if (!briefPath || !outPath) {
  throw new Error("Usage: render-linkedin-carousel.mjs --brief <brief.md> --out <carousel.pdf>");
}

const W = 1080, H = 1350;
const INK = "#FBF3E4";        // cream text
const INK_SOFT = "#B9A98F";
const BG = "#141010";          // near-black ground
const BG_ALT = "#1C1512";
const HONEY = "#E9A93A";

const brief = await readFile(briefPath, "utf8");
const field = (name) =>
  brief.match(new RegExp(`^${name}:\\s*(.+)$`, "mi"))?.[1]?.trim() ?? "";

const eyebrow = field("Eyebrow") || "LULIDIGITAL · NEW ARTICLE";
const cta = field("CTA") || "Full article in the comments.";

// Collect "Slide N: ..." lines in order.
const slides = [...brief.matchAll(/^Slide\s*(\d+)\s*(?:\([^)]*\))?\s*:\s*(.+)$/gim)]
  .sort((a, b) => Number(a[1]) - Number(b[1]))
  .map((m) => m[2].trim());

if (slides.length < 2) {
  throw new Error("Brief must contain at least 2 `Slide N:` lines");
}

const escape = (t) =>
  t.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** Greedy wrap by character budget — bigger type = fewer chars per line. */
const wrap = (text, max) => {
  const out = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) { out.push(line); line = word; }
    else line = next;
  }
  if (line) out.push(line);
  return out;
};

/** Progress dots so the reader knows there's more (dwell-time lever). */
const dots = (index, total) => {
  const gap = 26, r = 6;
  const width = (total - 1) * gap;
  const startX = W / 2 - width / 2;
  return Array.from({ length: total }, (_, i) => {
    const fill = i === index ? HONEY : "rgba(251,243,228,0.25)";
    return `<circle cx="${startX + i * gap}" cy="${H - 96}" r="${i === index ? r + 1 : r}" fill="${fill}"/>`;
  }).join("");
};

function slideSvg(text, index, total, kind) {
  const isHook = kind === "hook";
  const isCta = kind === "cta";
  const ground = isHook ? BG : BG_ALT;

  // Hook gets the largest type; body slides slightly smaller. Both stay huge
  // for mobile legibility — this is the most common carousel mistake.
  const size = isHook ? 104 : isCta ? 82 : 88;
  const max = isHook ? 17 : isCta ? 20 : 19;
  const lines = wrap(text, max);
  const lineHeight = size * 1.12;
  const blockH = lines.length * lineHeight;
  const startY = H / 2 - blockH / 2 + size * 0.82;

  const body = lines
    .map((l, i) =>
      `<text x="88" y="${startY + i * lineHeight}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${size}" font-weight="700" fill="${INK}" letter-spacing="-2.5">${escape(l)}</text>`)
    .join("");

  return `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${ground}"/>
  ${isHook ? `<circle cx="${W - 90}" cy="130" r="230" fill="${HONEY}" opacity="0.10"/>` : ""}
  ${isCta ? `<circle cx="120" cy="${H - 180}" r="260" fill="${HONEY}" opacity="0.09"/>` : ""}

  <!-- eyebrow -->
  <text x="88" y="132" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="26" font-weight="700" fill="${HONEY}" letter-spacing="4">${escape(eyebrow.toUpperCase())}</text>
  <rect x="88" y="160" width="86" height="7" rx="3.5" fill="${HONEY}"/>

  ${body}

  <!-- footer -->
  <line x1="88" y1="${H - 158}" x2="${W - 88}" y2="${H - 158}" stroke="${INK_SOFT}" stroke-opacity="0.28" stroke-width="1.5"/>
  <text x="88" y="${H - 112}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="30" font-weight="700" fill="${INK}">LuliDigital</text>
  <text x="${W - 88}" y="${H - 112}" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="24" fill="${INK_SOFT}">${index + 1} / ${total}</text>
  ${dots(index, total)}
</svg>`;
}

// Build the slide list: hook, body slides, CTA.
const all = [
  { text: slides[0], kind: "hook" },
  ...slides.slice(1).map((t) => ({ text: t, kind: "body" })),
  { text: cta, kind: "cta" },
];

const pdf = await PDFDocument.create();
for (const [i, s] of all.entries()) {
  const png = await sharp(Buffer.from(slideSvg(s.text, i, all.length, s.kind)))
    .png({ compressionLevel: 9 })
    .toBuffer();
  const img = await pdf.embedPng(png);
  const page = pdf.addPage([W, H]);
  page.drawImage(img, { x: 0, y: 0, width: W, height: H });
}

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, await pdf.save());
console.log(`Wrote ${outPath} — ${all.length} slides, ${W}x${H}`);
