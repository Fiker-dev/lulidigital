#!/usr/bin/env node

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const args = process.argv.slice(2);
const value = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const planPath = value("--plan");
const outPath = value("--out");
if (!planPath || !outPath) throw new Error("Usage: render-avatar-expression-video.mjs --plan <plan.json> --out <video.mp4>");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plan = JSON.parse(await readFile(planPath, "utf8"));
const width = 1080;
const height = 1920;
const fps = 30;
const sceneDuration = Number(plan.sceneDuration ?? 3.75);
const workDir = path.join(root, ".video-render", path.basename(outPath, path.extname(outPath)));
await mkdir(workDir, { recursive: true });
await mkdir(path.dirname(outPath), { recursive: true });

const escape = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const wrap = (text, max) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > max) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
};
const tspans = (lines, x, y, gap) => lines.map((line, i) => `<tspan x="${x}" y="${y + i * gap}">${escape(line)}</tspan>`).join("");

for (let i = 0; i < plan.scenes.length; i++) {
  const scene = plan.scenes[i];
  const headline = wrap(scene.headline, 21);
  const subline = wrap(scene.subline ?? "", 35);
  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1920" fill="#11100f"/>
      <circle cx="930" cy="170" r="340" fill="#f2b84b" opacity="0.16"/>
      <circle cx="90" cy="1760" r="360" fill="#cc6f4a" opacity="0.13"/>
      <rect x="64" y="64" width="952" height="1792" rx="46" fill="none" stroke="#f2b84b" stroke-width="2" opacity="0.48"/>
      <text x="104" y="165" fill="#f2b84b" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700" letter-spacing="4">${escape((scene.eyebrow ?? "MINI FIKER · ONE USEFUL THING").toUpperCase())}</text>
      <rect x="104" y="205" width="90" height="10" rx="5" fill="#f2b84b"/>
      <text fill="#fffaf0" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="700" letter-spacing="-2">${tspans(headline, 104, 320, 96)}</text>
      <text fill="#d8d0c5" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="400">${tspans(subline, 104, 320 + headline.length * 96 + 70, 56)}</text>
      <rect x="104" y="1710" width="872" height="2" fill="#f2b84b" opacity="0.5"/>
      <text x="104" y="1780" fill="#fffaf0" font-family="Arial, Helvetica, sans-serif" font-size="33" font-weight="700">LuliDigital</text>
      <text x="976" y="1780" text-anchor="end" fill="#d8d0c5" font-family="Arial, Helvetica, sans-serif" font-size="27">${escape(scene.footer ?? "AI · MARKETING · OPERATIONS")}</text>
    </svg>`);
  const avatarPath = path.join(root, "public", "assets", "fiker-avatar-pack", `${scene.pose}.png`);
  const avatar = await sharp(avatarPath).resize({ height: 940, fit: "inside" }).png().toBuffer();
  await sharp(svg)
    .composite([{ input: avatar, gravity: "southeast", left: 500, top: 860 }])
    .png()
    .toFile(path.join(workDir, `scene-${i}.png`));
}

const ffmpegArgs = ["-y"];
for (let i = 0; i < plan.scenes.length; i++) {
  ffmpegArgs.push("-loop", "1", "-t", String(sceneDuration), "-i", path.join(workDir, `scene-${i}.png`));
}
const filters = [];
for (let i = 0; i < plan.scenes.length; i++) {
  const frames = Math.round(sceneDuration * fps);
  filters.push(`[${i}:v]zoompan=z='min(zoom+0.00035,1.035)':d=${frames}:s=${width}x${height}:fps=${fps},format=yuv420p,setpts=PTS-STARTPTS[v${i}]`);
}
let current = "v0";
for (let i = 1; i < plan.scenes.length; i++) {
  const next = `x${i}`;
  const offset = (sceneDuration - 0.3) * i;
  filters.push(`[${current}][v${i}]xfade=transition=fade:duration=0.3:offset=${offset.toFixed(2)}[${next}]`);
  current = next;
}
ffmpegArgs.push("-filter_complex", filters.join(";"), "-map", `[${current}]`, "-t", String(sceneDuration * plan.scenes.length - 0.3 * (plan.scenes.length - 1)), "-r", String(fps), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outPath);
const rendered = spawnSync("ffmpeg", ffmpegArgs, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
if (rendered.status !== 0) throw new Error(rendered.stderr || "ffmpeg render failed");
await writeFile(path.join(workDir, "render.log"), rendered.stderr ?? "");
console.log(`Rendered avatar expression video: ${outPath}`);
