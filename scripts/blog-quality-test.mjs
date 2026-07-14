import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findKeywordStuffing, findSeoPackagingIssue, findLocationStuffing } from "./blog-quality.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const LOCATION_MAX = 6;

assert(
  findKeywordStuffing(
    "SEO services Amsterdam can help with discovery. A practical local search system is more useful than repeating the same phrase.",
    "SEO services Amsterdam",
  ) === "",
  "one natural exact-match mention should pass",
);

assert(
  findKeywordStuffing(
    "SEO services Amsterdam matter. SEO services Amsterdam improve reach. Choose SEO services Amsterdam today.",
    "SEO services Amsterdam",
  ).includes("appears 3 times"),
  "three exact-match mentions should be rejected",
);

assert(
  findKeywordStuffing("AI can help. Build AI carefully. Keep AI accountable.", "AI") === "",
  "single-word topics should not trigger the exact-phrase guard",
);

assert(
  findKeywordStuffing("Virtual-assistant services work. Virtual assistant services need clear scope.", "virtual assistant services") === "",
  "punctuation variants at or below the limit should pass",
);

assert(
  findSeoPackagingIssue({
    title: "Delegate or Automate? Amsterdam Founders' Workflow Playbook",
    description: "Amsterdam founders: stop guessing what to delegate vs. automate.",
    slug: "delegate-or-automate-amsterdam-founders-workflow-playbook",
    keyword: "virtual assistant services Amsterdam",
    localLabel: "Amsterdam",
  }).includes('market "Amsterdam" appears'),
  "SEO-shaped title/description/slug packaging should be rejected",
);

assert(
  findSeoPackagingIssue({
    title: "What to Delegate, What to Automate",
    description: "A practical way to remove repeatable work without losing human judgment.",
    slug: "what-to-delegate-what-to-automate",
    keyword: "virtual assistant services Amsterdam",
    localLabel: "Amsterdam",
  }) === "",
  "human packaging can still target the search intent without repeating the market",
);

// ── Location stuffing (single-word market names the keyword guard ignores) ──────
assert(
  findLocationStuffing("Teams in Amsterdam and across Europe benefit from cleaner systems. A studio in the Netherlands can help.") === "",
  "a couple of natural market mentions should pass",
);

assert(
  findLocationStuffing(`${"Amsterdam is efficient. ".repeat(24)}`).includes('location "amsterdam" appears 24 times'),
  "a market name repeated two dozen times should be flagged",
);

assert(
  findLocationStuffing("This studio is great.", 6, ["Lisbon"]) === "",
  "extra target term with no repetition should pass",
);

assert(
  findLocationStuffing(`${"Lisbon wins. ".repeat(8)}`, 6, ["Lisbon"]).includes('location "lisbon" appears 8 times'),
  "extra target term repeated past the limit should be flagged",
);

// ── Repo-wide guard: no published or draft post body over-repeats a market ──────
const blogDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "content", "blog");
const offenders = [];
for (const file of readdirSync(blogDir).filter((name) => name.endsWith(".md"))) {
  const raw = readFileSync(join(blogDir, file), "utf8");
  const body = raw.replace(/^---[\s\S]*?---/, "");
  const reason = findLocationStuffing(body, LOCATION_MAX);
  if (reason) offenders.push(`${file}: ${reason}`);
}
assert(
  offenders.length === 0,
  `Blog posts read like local-SEO stuffing:\n  ${offenders.join("\n  ")}`,
);

console.log("Blog quality tests passed.");
