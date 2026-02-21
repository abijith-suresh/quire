import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    label: z.string(),
    description: z.string(),
  }),
});

const changelog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/changelog" }),
  schema: z.object({
    version: z.string(),
    date: z.string(),
    changes: z.array(z.string()),
  }),
});

export const collections = { blog, changelog };
