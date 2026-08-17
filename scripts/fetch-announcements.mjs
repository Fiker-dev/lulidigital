#!/usr/bin/env node
/**
 * Deliver pending LinkedIn company blog announcements to Fiker's Desktop.
 *
 * The cloud routine writes the announcement (caption + rendered card) into
 * social/queue/<slug>/. This pulls anything not yet posted onto the Desktop as
 * a friendly-named pair so it's a straight upload + paste:
 *
 *   ~/Desktop/LuliDigital Announcements/
 *       Tuesday-blog-announcement.png
 *       Tuesday-blog-announcement-caption.txt
 *
 * Usage:  node scripts/fetch-announcements.mjs
 *         node scripts/fetch-announcements.mjs --all   (include future-dated)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE = path.join(ROOT, "social", "queue");
const OUT = path.join(os.homedir(), "Desktop", "LuliDigital Announcements");
const ALL = process.argv.includes("--all");
// --report: list what's pending without copying to Desktop (used by CI/Telegram).
const REPORT = process.argv.includes("--report");
const TODAY = new Date().toISOString().slice(0, 10);

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdayOf = (iso) => WEEKDAY[new Date(`${iso}T12:00:00Z`).getUTCDay()];

if (!fs.existsSync(QUEUE)) { console.log("No social/queue directory."); process.exit(0); }

const found = [];

for (const slug of fs.readdirSync(QUEUE)) {
  const dir = path.join(QUEUE, slug);
  if (!fs.statSync(dir).isDirectory()) continue;

  const png = path.join(dir, "linkedin-company-asset.png");
  const capPath = path.join(dir, "linkedin-company.md");
  if (!fs.existsSync(png) || !fs.existsSync(capPath)) continue;

  const raw = fs.readFileSync(capPath, "utf8");
  const statusPath = path.join(dir, "STATUS.md");
  const status = fs.existsSync(statusPath) ? fs.readFileSync(statusPath, "utf8") : "";

  // Already posted? skip.
  if (/linkedin-company\s+POSTED/i.test(status)) continue;

  const date =
    (raw.match(/companyScheduledFor:\s*"?(\d{4}-\d{2}-\d{2})"?/) || [])[1] ||
    (status.match(/companyScheduledFor:\s*"?(\d{4}-\d{2}-\d{2})"?/) || [])[1] ||
    null;

  if (!ALL && date && date > TODAY) {
    found.push({ slug, date, future: true });
    continue;
  }

  // Caption body = strip HTML comments; split off the FIRST COMMENT block.
  const body = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
  const [caption, firstComment] = body.split(/^---\s*$/m).map((s) => (s || "").trim());

  const label = date ? `${weekdayOf(date)}-blog-announcement` : `${slug}-announcement`;
  if (REPORT) { found.push({ slug, date, label, ready: true }); continue; }
  fs.mkdirSync(OUT, { recursive: true });
  fs.copyFileSync(png, path.join(OUT, `${label}.png`));

  const txt = [
    `LINKEDIN COMPANY PAGE — ${date ? `${weekdayOf(date)} ${date}` : "no date set"}`,
    `Post: ${slug}`,
    `Image to attach: ${label}.png`,
    "",
    "--- CAPTION (copy from here) ---",
    caption,
    "",
    "--- FIRST COMMENT (post right after) ---",
    (firstComment || "").replace(/^FIRST COMMENT:\s*/i, "").trim(),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT, `${label}-caption.txt`), txt);

  found.push({ slug, date, label, ready: true });
}

const ready = found.filter((f) => f.ready);
const future = found.filter((f) => f.future);

if (!ready.length && !future.length) {
  console.log("No pending blog announcements.");
} else {
  if (ready.length && REPORT) {
    console.log(`📣 ${ready.length} blog announcement(s) ready to post on the LuliDigital company page:`);
    for (const f of ready) {
      console.log(`• ${f.label}${f.date ? ` — post ${f.date}` : ""} (${f.slug})`);
    }
    console.log(`\nOn your Mac run:  node scripts/fetch-announcements.mjs`);
    console.log(`→ drops the card + caption into ~/Desktop/LuliDigital Announcements/`);
  } else if (ready.length) {
    console.log(`\n📣 ${ready.length} blog announcement(s) on your Desktop:\n`);
    console.log(`   ~/Desktop/LuliDigital Announcements/\n`);
    for (const f of ready) {
      console.log(`   ${f.label}.png`);
      console.log(`   ${f.label}-caption.txt   ${f.date ? `→ post ${f.date}` : ""}`);
      console.log(`      (${f.slug})\n`);
    }
    console.log("   Upload the PNG to the LuliDigital company page, paste the caption,");
    console.log("   then post the blog link as the FIRST COMMENT.\n");
  }
  for (const f of future) {
    console.log(`   ⏳ ${f.slug} — scheduled ${f.date} (use --all to fetch early)`);
  }
}
