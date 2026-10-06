/**
 * Read blog frontmatter correctly. Use this — do not hand-roll a regex.
 *
 * YAML allows three quoting styles, and titles routinely contain quote marks:
 *   title: "Swiss SMBs Are Being Sold \"AI Marketing.\" Here's How..."
 * The pattern copied around this repo — /^title:\s*["']?(.+?)["']?\s*$/ — kept
 * the backslashes or matched nothing. Before this module existed, that one bug
 * turned up in four separate places in a single day: the draft preview showed
 * the slug as its headline, the duplicate checker matched a draft against
 * itself at 0.999 (and nearly deleted it), the queue view showed backslashes
 * to the routine, and the LinkedIn caption would have published them.
 */

/** One scalar from a frontmatter block, unquoted and unescaped. "" if absent. */
export function field(frontmatter, name) {
  const raw = frontmatter.match(new RegExp(`^${name}:[ \\t]*(.*)$`, "m"))?.[1]?.trim() ?? "";
  if (!raw) return "";
  if (raw.startsWith('"')) {
    const m = raw.match(/^"((?:[^"\\]|\\.)*)"/);
    return m ? m[1].replace(/\\(["\\])/g, "$1") : raw.replace(/^"|"$/g, "");
  }
  if (raw.startsWith("'")) {
    const m = raw.match(/^'((?:[^']|'')*)'/);
    return m ? m[1].replace(/''/g, "'") : raw.replace(/^'|'$/g, "");
  }
  return raw;
}

/** The frontmatter block of a markdown file, or "" if it has none. */
export function frontmatterOf(markdown) {
  return markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
}
