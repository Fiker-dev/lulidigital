/**
 * The memory every offer must pass before it reaches Fiker.
 *
 * The routine kept offering social packs she had already posted by hand —
 * LinkedIn is manual, so nothing told the system they went out — and drafts
 * that repeated live blog posts. This answers one question: has this, or
 * something effectively the same, already gone out?
 *
 * Checks, in order:
 *   1. its status is posted or discarded
 *   2. it is in social/posted-ledger.json
 *   3. its text means the same as something already posted (the ledger)
 *   4. its text means the same as a LIVE blog post
 * 3 and 4 compare meaning with Gemini embeddings, not words — two posts can
 * share an idea while sharing almost no vocabulary.
 *
 *   node scripts/content-memory.mjs --pack <slug>      social pack
 *   node scripts/content-memory.mjs --draft <slug>     blog draft
 *
 * Exit 0 = new, offer it. Exit 1 = already out, do NOT offer it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLOG = path.join(ROOT, "src", "content", "blog");
const QUEUE = path.join(ROOT, "social", "queue");
const LEDGER = path.join(ROOT, "social", "posted-ledger.json");
const TOO_CLOSE = 0.88;   // same threshold as the blog duplicate check
const KEY = process.env.GEMINI_API_KEY;

const args = process.argv.slice(2);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const packSlug = val("--pack"), draftSlug = val("--draft");
if (!packSlug && !draftSlug) { console.error("Usage: --pack <slug> | --draft <slug>"); process.exit(2); }

const field = (fm, name) => {
  const raw = fm.match(new RegExp(`^${name}:[ \\t]*(.*)$`, "m"))?.[1]?.trim() ?? "";
  if (raw.startsWith('"')) { const m = raw.match(/^"((?:[^"\\]|\\.)*)"/); return m ? m[1].replace(/\\(["\\])/g, "$1") : raw; }
  if (raw.startsWith("'")) { const m = raw.match(/^'((?:[^']|'')*)'/); return m ? m[1].replace(/''/g, "'") : raw; }
  return raw;
};
const caption = (dir) => ["linkedin-personal.md", "linkedin-company.md", "bluesky.md"]
  .map((f) => path.join(dir, f)).filter(fs.existsSync)
  .map((f) => fs.readFileSync(f, "utf8").replace(/<!--[\s\S]*?-->/g, "").split(/^---\s*$/m)[0].trim())
  .find(Boolean) || "";

const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")).posted : [];
const verdict = (ok, why) => { console.log(`${ok ? "NEW" : "ALREADY OUT"} — ${why}`); process.exit(ok ? 0 : 1); };

let text = "", selfSlug = packSlug || draftSlug;

if (packSlug) {
  const dir = path.join(QUEUE, packSlug);
  const status = fs.existsSync(path.join(dir, "STATUS.md")) ? fs.readFileSync(path.join(dir, "STATUS.md"), "utf8") : "";
  const state = (status.split("\n")[0].match(/^\s*([a-z_]+)/) || [])[1] || "";
  if (state === "posted" || state === "discarded") verdict(false, `status is ${state}`);
  if (/\b[a-z-]+ POSTED https?:\/\//.test(status)) verdict(false, "status file records a posted URL");
  if (ledger.some((e) => e.slug === packSlug)) verdict(false, "in the posted ledger");
  text = caption(dir);
} else {
  const raw = fs.readFileSync(path.join(BLOG, `${draftSlug}.md`), "utf8");
  const fm = (raw.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
  if (!/^draft:\s*true\s*$/m.test(fm)) verdict(false, "already live");
  text = `${field(fm, "title")}\n${field(fm, "description")}`;
}

if (!text) verdict(true, "no text to compare (nothing in memory matches by status)");
if (!KEY) verdict(true, "status checks passed; GEMINI_API_KEY missing so meaning was not compared");

const embed = async (t) => {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${KEY}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: "models/gemini-embedding-001", content: { parts: [{ text: t.slice(0, 6000) }] }, taskType: "SEMANTIC_SIMILARITY" }),
  });
  if (!r.ok) throw new Error(`embed ${r.status}`);
  return (await r.json()).embedding.values;
};
const cos = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return d / Math.sqrt(x * y); };

// Everything that has gone out: hand-posted social captions + every live blog.
const out = [
  ...ledger.filter((e) => e.slug !== selfSlug && e.caption).map((e) => ({ what: `posted pack "${e.slug}"`, text: e.caption })),
  ...fs.readdirSync(BLOG).filter((f) => f.endsWith(".md")).map((f) => {
    const raw = fs.readFileSync(path.join(BLOG, f), "utf8");
    const fm = (raw.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
    if (/^draft:\s*true\s*$/m.test(fm) || f.replace(/\.md$/, "") === selfSlug) return null;
    return { what: `live blog "${field(fm, "title")}"`, text: `${field(fm, "title")}\n${field(fm, "description")}` };
  }).filter(Boolean),
];

try {
  const me = await embed(text);
  let best = { s: 0, what: "" };
  for (const o of out) { const s = cos(me, await embed(o.text)); if (s > best.s) best = { s, what: o.what }; }
  if (best.s >= TOO_CLOSE) verdict(false, `means the same as ${best.what} (${best.s.toFixed(3)})`);
  verdict(true, `closest is ${best.what} (${best.s.toFixed(3)})`);
} catch (e) {
  verdict(true, `status checks passed; meaning comparison failed (${e.message})`);
}
