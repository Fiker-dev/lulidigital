import { join } from "node:path";

export function normalizeBlogSlug(raw, label = "slug") {
  const cleaned = String(raw || "")
    .trim()
    .replace(/^https?:\/\/[^/]+\/blog\//i, "")
    .replace(/^\/?blog\//i, "")
    .replace(/\.md$/i, "")
    .toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleaned)) {
    throw new Error(`Invalid ${label}: use a blog slug like my-post-title`);
  }

  return cleaned;
}

export function blogFilePath(root, slug) {
  return join(root, "src", "content", "blog", `${normalizeBlogSlug(slug)}.md`);
}

export function normalizePublishDate(raw) {
  const value = String(raw || "").trim();
  if (!value) return new Date().toISOString().split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Invalid publish_date: use YYYY-MM-DD");
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("Invalid publish_date: use a real calendar date");
  }

  return value;
}
