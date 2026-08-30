#!/usr/bin/env node

import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const args = process.argv.slice(2);
const value = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const planPath = value("--plan");
const portraitPath = value("--portrait");
const outPath = value("--out");
if (!planPath || !portraitPath || !outPath) throw new Error("Missing --plan, --portrait or --out");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plan = JSON.parse(await readFile(planPath, "utf8"));
const width = 1080;
const height = 1920;
const workDir = path.join(root, ".video-render", path.basename(outPath, ".mp4"));
await mkdir(workDir, { recursive: true });
await mkdir(path.dirname(outPath), { recursive: true });

const esc = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const wrap = (text, max = 30) => {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > max) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
};
const tspans = (lines, x, y, gap) => lines.map((line, i) => `<tspan x="${x}" y="${y + i * gap}">${esc(line)}</tspan>`).join("");

const bgPath = path.join(workDir, "background.jpg");
await sharp(portraitPath)
  .resize(width, height, { fit: "cover", position: "attention" })
  .modulate({ brightness: 0.82, saturation: 0.92 })
  .jpeg({ quality: 94 })
  .toFile(bgPath);

for (let i = 0; i < plan.popups.length; i += 1) {
  const popup = plan.popups[i];
  const lines = wrap(popup.text, 29);
  const accentY = Math.min(445, 230 + lines.length * 58 + 54);
  const svg = Buffer.from(`<svg width="920" height="500" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="s"><feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#000" flood-opacity="0.32"/></filter></defs>
    <rect x="20" y="20" width="880" height="450" rx="50" fill="#fffaf2" fill-opacity="0.96" stroke="#fff" stroke-width="3" filter="url(#s)"/>
    <circle cx="100" cy="100" r="36" fill="#11100f"/>
    <text x="100" y="112" text-anchor="middle" fill="#f2b84b" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="800">F</text>
    <text x="158" y="88" fill="#11100f" font-family="Arial,Helvetica,sans-serif" font-size="31" font-weight="750">Fiker@lulidigital</text>
    <text x="158" y="128" fill="#6f6962" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700">${esc(popup.label)}</text>
    <text fill="#11100f" font-family="Arial,Helvetica,sans-serif" font-size="49" font-weight="760">${tspans(lines, 72, 225, 59)}</text>
    <text x="72" y="${accentY}" fill="#b47b05" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="800">${esc(popup.accent)}</text>
  </svg>`);
  await sharp(svg).png().toFile(path.join(workDir, `popup-${i}.png`));
}

const ff = ["-y", "-loop", "1", "-t", String(plan.duration), "-i", bgPath];
for (let i = 0; i < plan.popups.length; i += 1) ff.push("-loop", "1", "-t", String(plan.popups[i].duration), "-i", path.join(workDir, `popup-${i}.png`));

const filters = [`[0:v]zoompan=z='min(zoom+0.00012,1.018)':d=${Math.round(plan.duration * 30)}:s=${width}x${height}:fps=30,format=rgba[bg]`];
let current = "bg";
for (let i = 0; i < plan.popups.length; i += 1) {
  const p = plan.popups[i];
  const input = i + 1;
  const card = `card${i}`;
  const out = `v${i}`;
  // Fast ease-out overshoot: 72% -> 106% -> 100%, then a soft fade away.
  const factor = `if(lt(t,0.12),0.72+2.83*t,if(lt(t,0.22),1.06-0.6*(t-0.12),1))`;
  filters.push(`[${input}:v]format=rgba,scale=w='trunc(iw*(${factor})/2)*2':h='trunc(ih*(${factor})/2)*2':eval=frame,fade=t=in:st=0:d=0.08:alpha=1,fade=t=out:st=${(p.duration - 0.22).toFixed(2)}:d=0.22:alpha=1,setpts=PTS+${p.start}/TB[${card}]`);
  filters.push(`[${current}][${card}]overlay=x='(W-w)/2':y='${p.y}+(500-h)/2':eof_action=pass[${out}]`);
  current = out;
}
ff.push("-filter_complex", filters.join(";"), "-map", `[${current}]`, "-t", String(plan.duration), "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outPath);
const result = spawnSync("ffmpeg", ff, { encoding: "utf8", maxBuffer: 40 * 1024 * 1024 });
if (result.status !== 0) throw new Error(result.stderr || "render failed");
console.log(`Rendered screen-pop animation: ${outPath}`);
