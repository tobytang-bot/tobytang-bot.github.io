import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { getCollection, type CollectionEntry } from "astro:content";

export type Resource = CollectionEntry<"resources">;

export interface ResourceFile {
  name: string; // filename without extension
  file: string; // filename
  url: string; // stable public URL
  bytes: number;
  group?: string; // group id
  svg?: string; // raw source, for SVG files
}

export const KIND_LABEL: Record<Resource["data"]["kind"], string> = {
  "icon-pack": "图标包",
  tool: "工具",
  template: "模板",
  snippet: "代码片段",
};

export const resourceUrl = (r: Resource) => `/resources/${r.id}/`;

/** Built by src/integrations/resource-zips.mjs for every public/downloads/<dir>/. */
export const zipUrl = (assets: string) => `/downloads/${assets}.zip`;

export async function getResources(): Promise<Resource[]> {
  return (await getCollection("resources", (r) => import.meta.env.DEV || !r.data.draft)).sort(
    (a, b) => (b.data.updated ?? b.data.date).getTime() - (a.data.updated ?? a.data.date).getTime(),
  );
}

/**
 * Files in public/downloads/<assets>/ (README excluded), grouped by filename prefix.
 * Downloads are kept apart from /resources/<id>/ pages so zips never pick up page HTML.
 */
export function resourceFiles(r: Resource): ResourceFile[] {
  const { assets, groups } = r.data;
  if (!assets) return [];
  const dir = join(process.cwd(), "public", "downloads", assets);
  // Longest prefix first, so "circle-arrow-" wins over "arrow-" style overlaps.
  const byPrefix = [...groups].sort((a, b) => b.prefix.length - a.prefix.length);

  return readdirSync(dir)
    .filter((f) => !f.startsWith(".") && f.toLowerCase() !== "readme.md")
    .sort()
    .map((file) => {
      const path = join(dir, file);
      const isSvg = file.endsWith(".svg");
      return {
        name: file.replace(/\.[^.]+$/, ""),
        file,
        url: `/downloads/${assets}/${file}`,
        bytes: statSync(path).size,
        group: byPrefix.find((g) => file.startsWith(g.prefix))?.id,
        svg: isSvg ? readFileSync(path, "utf8") : undefined,
      };
    });
}
