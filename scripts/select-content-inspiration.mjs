#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const value = (flag, fallback = "") => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};
const normalize = (value) => String(value).trim().toLowerCase();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "social", "content-inspiration", "catalog.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

const platform = normalize(value("--platform"));
const format = normalize(value("--format"));
const requestedTags = new Set(value("--tags").split(",").map(normalize).filter(Boolean));

const ranked = catalog.entries
  .filter((entry) => entry.active !== false)
  .map((entry) => {
    const platforms = new Set((entry.platforms ?? []).map(normalize));
    const formats = new Set((entry.formats ?? []).map(normalize));
    const tags = new Set((entry.tags ?? []).map(normalize));
    const matchedTags = [...requestedTags].filter((tag) => tags.has(tag));
    const score = (platforms.has(platform) ? 4 : 0)
      + (formats.has(format) ? 3 : 0)
      + matchedTags.length;
    return { ...entry, score, matchedTags };
  })
  .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

const selected = ranked[0] ?? null;
const usable = Boolean(selected && selected.score >= Number(catalog.minimumScore ?? 4));
console.log(JSON.stringify({
  query: { platform, format, tags: [...requestedTags] },
  usable,
  minimumScore: Number(catalog.minimumScore ?? 4),
  selected: usable ? selected : null,
  reason: usable ? "highest matching active inspiration" : "no strong match; use the brand system",
}, null, 2));
