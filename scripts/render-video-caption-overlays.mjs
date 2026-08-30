#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const outDir = new URL("../.video-render/caption-overlays/", import.meta.url);
await mkdir(outDir, { recursive: true });

const captions = [
  ["Your buyers aren't", "CONFUSED."],
  ["They're afraid of making", "THE WRONG CHOICE."],
  ["More content won't", "FIX THAT FEAR."],
  ["Information is everywhere.", "CONFIDENCE ISN'T."],
  ["AI made comparison", "EASY."],
  ["Make the decision feel", "SAFE."],
  ["Show the process. Name the trade-offs.", "MAKE THE NEXT STEP CLEAR."],
];

for (let i = 0; i < captions.length; i += 1) {
  const [line, emphasis] = captions[i];
  const svg = Buffer.from(`<svg width="936" height="250" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="936" height="250" rx="30" fill="#090909" fill-opacity="0.88"/>
    <text x="468" y="94" text-anchor="middle" fill="#fff8ee" font-family="Arial,Helvetica,sans-serif" font-size="48" font-weight="700">${line.replaceAll("&", "&amp;")}</text>
    <text x="468" y="174" text-anchor="middle" fill="#f2b84b" font-family="Arial,Helvetica,sans-serif" font-size="56" font-weight="800">${emphasis}</text>
  </svg>`);
  await sharp(svg).png().toFile(fileURLToPath(new URL(`caption-${i}.png`, outDir)));
}

console.log(new URL(".", outDir).pathname);
