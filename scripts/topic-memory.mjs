/**
 * Memory of what has already been written, so the blog stops repeating itself.
 *
 * Telling the model "don't repeat these titles" is a request, not a guarantee —
 * the same lesson as the routine that kept forgetting to schedule its drafts.
 * Two posts can share an idea while sharing almost no words:
 *
 *   "Your Inbox Became Your To-Do List. That's Why You Never Feel Caught Up."
 *   "Your Operations Are Running You. Here's How to Flip That."
 *
 * Lexical overlap barely registers. The idea is the same. So this compares
 * MEANING, using Gemini embeddings, and keeps the vectors in
 * scripts/topic-memory.json so each run only embeds what is new.
 *
 *   node scripts/topic-memory.mjs --rebuild           refresh every post
 *   node scripts/topic-memory.mjs --check "<title>" "<description>"
 *   node scripts/topic-memory.mjs --report            most-similar pairs
 *
 * --check exits 1 when the topic is too close to something already published.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLOG = path.join(ROOT, "src", "content", "blog");
const STORE = path.join(ROOT, "scripts", "topic-memory.json");
const MODEL = "gemini-embedding-001";

// Tuned against the real corpus below, not guessed: published posts that are
// genuinely distinct sit under ~0.80, and the inbox/operations pair that Fiker
// spotted sits above it.
// This corpus is deliberately narrow — one agency, three services — so almost
// everything sits between 0.83 and 0.89 and there is no clean gap to split on.
// 0.88 flags the pairs that are genuinely the same piece without rejecting
// every post about automation. Treat the printed neighbours as the real signal.
const TOO_CLOSE = 0.88;

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error("Missing GEMINI_API_KEY"); process.exit(2); }

const embed = async (text) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent?key=${KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: `models/${MODEL}`,
        content: { parts: [{ text: text.slice(0, 8000) }] },
        taskType: "SEMANTIC_SIMILARITY",
      }),
    },
  );
  if (!res.ok) throw new Error(`embed failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).embedding.values;
};

const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

const readPosts = () =>
  fs.readdirSync(BLOG).filter((f) => f.endsWith(".md")).map((f) => {
    const raw = fs.readFileSync(path.join(BLOG, f), "utf8");
    const fm = (raw.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
    // Quote-aware: titles can contain escaped quotes (e.g. Sold \"AI Marketing.\"),
    // and the old pattern kept the backslashes. That made a draft's stored title
    // differ from its clean title, so the self-exclusion below failed and a new
    // draft matched ITSELF at 0.999 — clear-stale-drafts nearly deleted it.
    const g = (k) => {
      const raw = fm.match(new RegExp(`^${k}:[ \\t]*(.*)$`, "m"))?.[1]?.trim() ?? "";
      if (raw.startsWith('"')) { const m = raw.match(/^"((?:[^"\\]|\\.)*)"/); return m ? m[1].replace(/\\(["\\])/g, "$1") : raw; }
      if (raw.startsWith("'")) { const m = raw.match(/^'((?:[^']|'')*)'/); return m ? m[1].replace(/''/g, "'") : raw; }
      return raw;
    };
    return {
      slug: f.replace(/\.md$/, ""),
      title: g("title"),
      description: g("description"),
      live: !/^draft:\s*true\s*$/m.test(fm),
    };
  });

// The topic, not the prose: title plus description is what makes two posts
// "the same piece", and it keeps embeddings cheap and stable.
const topicText = (p) => `${p.title}\n${p.description}`;

const load = () => (fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, "utf8")) : { model: MODEL, topics: {} });
const save = (s) => fs.writeFileSync(STORE, JSON.stringify(s, null, 2));

async function sync({ rebuild = false } = {}) {
  const store = load();
  if (store.model !== MODEL || rebuild) { store.model = MODEL; store.topics = {}; }
  const posts = readPosts();
  let added = 0;
  for (const p of posts) {
    const sig = topicText(p);
    if (store.topics[p.slug]?.sig === sig) { store.topics[p.slug].live = p.live; continue; }
    store.topics[p.slug] = { sig, live: p.live, title: p.title, vec: await embed(sig) };
    added++;
  }
  for (const slug of Object.keys(store.topics)) {
    if (!posts.some((p) => p.slug === slug)) delete store.topics[slug];
  }
  save(store);
  return { store, added, total: posts.length };
}

const args = process.argv.slice(2);

if (args.includes("--rebuild") || args.includes("--sync")) {
  const { added, total } = await sync({ rebuild: args.includes("--rebuild") });
  console.log(`topic memory: ${total} posts, ${added} newly embedded`);
  process.exit(0);
}

if (args.includes("--report")) {
  const { store } = await sync();
  const e = Object.entries(store.topics);
  const pairs = [];
  for (let i = 0; i < e.length; i++)
    for (let j = i + 1; j < e.length; j++)
      pairs.push({ a: e[i][1].title, b: e[j][1].title, s: cosine(e[i][1].vec, e[j][1].vec) });
  pairs.sort((x, y) => y.s - x.s);
  console.log(`Closest topic pairs (flag threshold ${TOO_CLOSE}):\n`);
  for (const p of pairs.slice(0, 12)) {
    console.log(`${p.s.toFixed(3)} ${p.s >= TOO_CLOSE ? "⚠️ " : "   "} ${p.a}\n              ${p.b}\n`);
  }
  process.exit(0);
}

if (args.includes("--check")) {
  const i = args.indexOf("--check");
  const title = args[i + 1] || "";
  const description = args[i + 2] || "";
  if (!title) { console.error('Usage: --check "<title>" "<description>"'); process.exit(2); }
  const { store } = await sync();
  const vec = await embed(`${title}\n${description}`);
  // Exclude the post being checked: a draft already on disk matches itself at
  // 1.000, which would mask the neighbour that actually matters.
  const probe = `${title}\n${description}`;
  // --exclude <slug> is the reliable way to skip the post being checked; the
  // title comparison is a fallback that quoting differences can defeat.
  const excludeSlug = args.includes("--exclude") ? args[args.indexOf("--exclude") + 1] : null;
  const scored = Object.entries(store.topics)
    .filter(([slug, t]) => slug !== excludeSlug && t.sig !== probe && t.title !== title)
    .map(([slug, t]) => ({ slug, title: t.title, live: t.live, s: cosine(vec, t.vec) }))
    .sort((a, b) => b.s - a.s);
  const top = scored[0];
  console.log(`closest existing: ${top.s.toFixed(3)}  ${top.title} (${top.live ? "published" : "draft"})`);
  for (const r of scored.slice(1, 4)) console.log(`      next: ${r.s.toFixed(3)}  ${r.title} (${r.live ? "published" : "draft"})`);
  if (top.s >= TOO_CLOSE) {
    console.error(`\nTOO CLOSE to "${top.title}" — this topic has effectively been written already.`);
    process.exit(1);
  }
  console.log("\ndistinct enough");
  process.exit(0);
}

console.error("Usage: --rebuild | --sync | --report | --check \"<title>\" \"<description>\"");
process.exit(2);
