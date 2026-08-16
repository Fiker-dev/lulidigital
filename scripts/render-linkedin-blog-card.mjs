#!/usr/bin/env node

import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const value = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};

const briefPath = value("--brief");
const outPath = value("--out");
if (!briefPath || !outPath) {
  throw new Error("Usage: render-linkedin-blog-card.mjs --brief <brief.md> --out <card.png>");
}

const brief = await readFile(briefPath, "utf8");
const field = (name) => brief.match(new RegExp(`^${name}:\\s*(.+)$`, "mi"))?.[1]?.trim() ?? "";
const title = field("Headline") || field("Title");
const pullLine = field("Pull-line") || field("Pull line");
const eyebrow = field("Eyebrow") || "LULIDIGITAL · NEW ARTICLE";
if (!title || !pullLine) {
  throw new Error("Asset brief must contain `Headline:` and `Pull-line:` fields");
}

const escape = (text) => text
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const wrap = (text, max = 28) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 6);
};

const titleLines = wrap(title, 22);
const pullLines = wrap(pullLine, 46);
const tspans = (lines, x, startY, gap) => lines
  .map((line, i) => `<tspan x="${x}" y="${startY + i * gap}">${escape(line)}</tspan>`)
  .join("");
const pullY = 305 + titleLines.length * 98 + 70;

const svg = `
<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1350" fill="#11100f"/>
  <circle cx="940" cy="150" r="270" fill="#f2b84b" opacity="0.16"/>
  <circle cx="90" cy="1240" r="330" fill="#cc6f4a" opacity="0.12"/>
  <rect x="72" y="72" width="936" height="1206" rx="42" fill="none" stroke="#f2b84b" stroke-width="2" opacity="0.55"/>
  <text x="112" y="160" fill="#f2b84b" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700" letter-spacing="4">${escape(eyebrow.toUpperCase())}</text>
  <rect x="112" y="205" width="96" height="10" rx="5" fill="#f2b84b"/>
  <text fill="#fffaf0" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="700" letter-spacing="-2">${tspans(titleLines, 112, 305, 98)}</text>
  <text fill="#d7cfc2" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="400">${tspans(pullLines, 112, pullY, 54)}</text>
  <line x1="112" y1="1160" x2="968" y2="1160" stroke="#f2b84b" stroke-width="2" opacity="0.45"/>
  <text x="112" y="1228" fill="#fffaf0" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">LuliDigital</text>
  <text x="968" y="1228" text-anchor="end" fill="#d7cfc2" font-family="Arial, Helvetica, sans-serif" font-size="27">AI · MARKETING · OPERATIONS</text>
</svg>`;

await mkdir(path.dirname(outPath), { recursive: true });
await sharp(Buffer.from(svg)).png({ quality: 94, compressionLevel: 9 }).toFile(outPath);
console.log(`Rendered LinkedIn company asset: ${outPath}`);
