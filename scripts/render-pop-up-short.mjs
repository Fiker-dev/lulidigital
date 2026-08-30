#!/usr/bin/env node

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const args = process.argv.slice(2);
const value = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const planPath = value("--plan");
const portraitPath = value("--portrait");
const outPath = value("--out");
if (!planPath || !portraitPath || !outPath) {
  throw new Error("Usage: render-pop-up-short.mjs --plan plan.json --portrait photo.jpg --out video.mp4");
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plan = JSON.parse(await readFile(planPath, "utf8"));
const width = 1080;
const height = 1920;
const fps = 30;
const sceneDuration = Number(plan.sceneDuration ?? 3.7);
const workDir = path.join(root, ".video-render", path.basename(outPath, ".mp4"));
await mkdir(workDir, { recursive: true });
await mkdir(path.dirname(outPath), { recursive: true });

const escape = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const wrap = (text, max = 26) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > max) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
};
const tspans = (lines, x, y, gap) => lines.map((line, i) => `<tspan x="${x}" y="${y + i * gap}">${escape(line)}</tspan>`).join("");

const portrait = await sharp(portraitPath)
  .resize(width, height, { fit: "cover", position: "attention" })
  .modulate({ brightness: 0.72, saturation: 0.9 })
  .blur(0.35)
  .jpeg({ quality: 92 })
  .toBuffer();

for (let i = 0; i < plan.scenes.length; i += 1) {
  const scene = plan.scenes[i];
  const headline = wrap(scene.headline, 25);
  const accent = wrap(scene.accent, 28);
  const progress = plan.scenes.map((_, p) => `<rect x="${92 + p * 150}" y="148" width="125" height="8" rx="4" fill="${p <= i ? "#f2b84b" : "#ffffff"}" opacity="${p <= i ? "1" : "0.3"}"/>`).join("");
  const svg = Buffer.from(`<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1920" fill="#000" fill-opacity="0.12"/>
    ${progress}
    <rect x="62" y="1010" width="956" height="660" rx="54" fill="#f8f5ef" fill-opacity="0.93" stroke="#ffffff" stroke-opacity="0.72" stroke-width="3"/>
    <circle cx="145" cy="1100" r="42" fill="#11100f"/>
    <text x="145" y="1113" text-anchor="middle" fill="#f2b84b" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="800">F</text>
    <text x="210" y="1090" fill="#11100f" font-family="Arial,Helvetica,sans-serif" font-size="38" font-weight="700">Fiker@lulidigital</text>
    <text x="210" y="1140" fill="#5e5a55" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="600">${escape(scene.label)}</text>
    <text fill="#11100f" font-family="Arial,Helvetica,sans-serif" font-size="67" font-weight="750" letter-spacing="-1">${tspans(headline, 110, 1270, 82)}</text>
    <text fill="#b47b05" font-family="Arial,Helvetica,sans-serif" font-size="46" font-weight="800">${tspans(accent, 110, 1270 + headline.length * 82 + 70, 60)}</text>
    <text x="110" y="1600" fill="#6d6861" font-family="Arial,Helvetica,sans-serif" font-size="25">tap into a simpler way of working</text>
  </svg>`);
  await sharp(portrait).composite([{ input: svg }]).png().toFile(path.join(workDir, `scene-${i}.png`));
}

const ffmpegArgs = ["-y"];
for (let i = 0; i < plan.scenes.length; i += 1) {
  ffmpegArgs.push("-loop", "1", "-t", String(sceneDuration), "-i", path.join(workDir, `scene-${i}.png`));
}
const filters = [];
for (let i = 0; i < plan.scenes.length; i += 1) {
  const frames = Math.round(sceneDuration * fps);
  filters.push(`[${i}:v]zoompan=z='min(zoom+0.00025,1.025)':d=${frames}:s=${width}x${height}:fps=${fps},format=yuv420p,setpts=PTS-STARTPTS[v${i}]`);
}
let current = "v0";
for (let i = 1; i < plan.scenes.length; i += 1) {
  const next = `x${i}`;
  const offset = (sceneDuration - 0.12) * i;
  filters.push(`[${current}][v${i}]xfade=transition=fade:duration=0.12:offset=${offset.toFixed(2)}[${next}]`);
  current = next;
}
const duration = sceneDuration * plan.scenes.length - 0.12 * (plan.scenes.length - 1);
ffmpegArgs.push("-filter_complex", filters.join(";"), "-map", `[${current}]`, "-t", String(duration), "-r", String(fps), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outPath);
const rendered = spawnSync("ffmpeg", ffmpegArgs, { encoding: "utf8", maxBuffer: 30 * 1024 * 1024 });
if (rendered.status !== 0) throw new Error(rendered.stderr || "ffmpeg render failed");
await writeFile(path.join(workDir, "render.log"), rendered.stderr ?? "");
console.log(`Rendered pop-up short: ${outPath}`);
