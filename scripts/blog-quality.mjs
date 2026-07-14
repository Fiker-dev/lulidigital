const normalizeText = (value) => String(value || "")
  .toLowerCase()
  .replace(/https?:\/\/\S+/g, " ")
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

/**
 * Returns a human-readable reason when a multi-word SEO phrase is repeated
 * enough to make the article read like search-engine copy instead of prose.
 * Single-word topics are intentionally ignored because words such as "AI" or
 * "automation" can recur naturally throughout a focused article.
 */
export function findKeywordStuffing(content, keyword, maxExactMatches = 2) {
  const normalizedKeyword = normalizeText(keyword);
  const keywordWords = normalizedKeyword.split(" ").filter(Boolean);
  if (keywordWords.length < 2 || normalizedKeyword.length < 8) return "";

  const normalizedContent = normalizeText(content);
  if (!normalizedContent) return "";

  const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = normalizedContent.match(new RegExp(`\\b${escapedKeyword}\\b`, "g")) ?? [];

  return matches.length > maxExactMatches
    ? `exact phrase "${keyword}" appears ${matches.length} times (maximum ${maxExactMatches})`
    : "";
}

/**
 * Market/location names LuliDigital targets. A single one of these repeated
 * many times through an article body is the classic "local SEO" stuffing tell
 * that the exact-keyword guard misses (because it ignores single words). Two-word
 * entries such as "united kingdom" are matched as phrases on normalised text.
 */
export const MARKET_TERMS = [
  "amsterdam",
  "netherlands",
  "munich",
  "germany",
  "stockholm",
  "sweden",
  "copenhagen",
  "denmark",
  "oslo",
  "norway",
  "dublin",
  "ireland",
  "zurich",
  "switzerland",
  "brussels",
  "belgium",
  "london",
  "united kingdom",
  "united states",
];

/**
 * Returns a human-readable reason when a single market/location name is repeated
 * so often that the article reads like local-SEO bait instead of prose. This is
 * the gap the exact-keyword guard leaves open: "Amsterdam" is one word, so it is
 * ignored there, yet an article can still say "Amsterdam" two dozen times.
 *
 * `extraTerms` lets a caller add the specific target city/label for a draft.
 */
export function findLocationStuffing(content, maxMentions = 6, extraTerms = []) {
  const normalizedContent = normalizeText(content);
  if (!normalizedContent) return "";

  const terms = [...new Set([...MARKET_TERMS, ...extraTerms.map(normalizeText)])].filter(Boolean);

  let worst = null;
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const count = (normalizedContent.match(new RegExp(`\\b${escaped}\\b`, "g")) ?? []).length;
    if (count > maxMentions && (!worst || count > worst.count)) {
      worst = { term, count };
    }
  }

  return worst
    ? `location "${worst.term}" appears ${worst.count} times (maximum ${maxMentions}) — reads like local-SEO stuffing`
    : "";
}

/**
 * Catches SEO-looking packaging before a draft reaches Telegram. The article
 * body can mention a market naturally, but title + description + slug should
 * not all repeat the same market/search phrase because that reads like keyword
 * stuffing before the reader opens the post.
 */
export function findSeoPackagingIssue({ title, description, slug, keyword, localLabel } = {}) {
  const normalizedKeyword = normalizeText(keyword);
  const keywordWords = normalizedKeyword.split(" ").filter(Boolean);
  const titleText = normalizeText(title);
  const descriptionText = normalizeText(description);
  const slugText = normalizeText(slug);

  if (keywordWords.length >= 2 && normalizedKeyword.length >= 8) {
    if (titleText.includes(normalizedKeyword)) {
      return `title contains the exact SEO phrase "${keyword}"`;
    }

    if (descriptionText.includes(normalizedKeyword)) {
      return `description contains the exact SEO phrase "${keyword}"`;
    }
  }

  const normalizedLocal = normalizeText(localLabel);
  if (normalizedLocal && normalizedLocal.length >= 4) {
    const localHits = [
      titleText.includes(normalizedLocal),
      descriptionText.includes(normalizedLocal),
      slugText.includes(normalizedLocal),
    ].filter(Boolean).length;

    if (localHits >= 2) {
      return `market "${localLabel}" appears in ${localHits} of title, description, and slug`;
    }
  }

  return "";
}
