import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),
    readingTime: z.string().optional(),
    draft: z.boolean().optional(),
    // Approved-but-queued date (YYYY-MM-DD). The post stays draft:true until the
    // daily Publish Scheduled Posts workflow flips it live on this date.
    scheduledFor: z.string().optional(),
    // Set false to hide the Fiker host avatar on this post (default: shown).
    avatar: z.boolean().optional(),
  }),
});

export const collections = { blog };
