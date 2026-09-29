import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

// Single source of truth for article frontmatter.
// `type` is implied by the collection (worklog | knowledge), so it is not a field.

const status = z.enum(["investigating", "solved", "reference", "deprecated"]);

const article = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  topics: z.array(reference("topics")).min(1),
  tags: z.array(z.string()).default([]),
  project: reference("projects").optional(),
  status,
  draft: z.boolean().default(false),
});

// Hierarchical topic tree, e.g. magento-cloud → magento.
const topics = defineCollection({
  loader: file("src/content/topics.yaml"),
  schema: z.object({
    title: z.string(),
    parent: reference("topics").optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    topics: z.array(reference("topics")).default([]),
  }),
});

const worklog = defineCollection({
  // Files: worklog/<yyyy>/<yyyy-mm-dd>-<slug>.md
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/worklog" }),
  schema: article,
});

const knowledge = defineCollection({
  // Files: knowledge/<topic>/<slug>.md
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/knowledge" }),
  schema: article,
});

// Shared resources: icon packs, tools, templates, snippets.
// Files: resources/<id>.md; downloadable files live in public/downloads/<assets>/.
const resources = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/resources" }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    kind: z.enum(["icon-pack", "tool", "template", "snippet"]),
    topics: z.array(reference("topics")).default([]),
    tags: z.array(z.string()).default([]),
    license: z.string().min(1),
    /** Who made it, e.g. "ChatGPT 生成" or an author name. */
    source: z.string().min(1),
    version: z.string().optional(),
    /** Folder under public/downloads/ with the downloadable files. */
    assets: z.string().regex(/^[a-z0-9-]+$/).optional(),
    /** Groups files by filename prefix, e.g. arrow-*, circle-arrow-*. */
    groups: z
      .array(z.object({ id: z.string(), title: z.string(), prefix: z.string() }))
      .default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { topics, projects, worklog, knowledge, resources };
