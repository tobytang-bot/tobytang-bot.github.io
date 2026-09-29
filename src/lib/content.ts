import { getCollection, type CollectionEntry } from "astro:content";

export type Worklog = CollectionEntry<"worklog">;
export type Knowledge = CollectionEntry<"knowledge">;
export type Article = Worklog | Knowledge;

const WORKLOG_FILE = /^(\d{4})\/(\d{4})-(\d{2})-(\d{2})-([a-z0-9-]+)$/;

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** worklog id "2026/2026-09-29-foo" → route param "2026/09/29-foo". */
export function worklogSlug(entry: Worklog): string {
  const m = WORKLOG_FILE.exec(entry.id);
  if (!m) {
    throw new Error(
      `worklog "${entry.id}": file must be worklog/<yyyy>/<yyyy-mm-dd>-<slug>.md`,
    );
  }
  const [, dir, y, mo, d, slug] = m;
  const fileDate = `${y}-${mo}-${d}`;
  if (dir !== y || fileDate !== isoDate(entry.data.date)) {
    throw new Error(
      `worklog "${entry.id}": filename date ${fileDate} (dir ${dir}) does not match frontmatter date ${isoDate(entry.data.date)}`,
    );
  }
  return `${y}/${mo}/${d}-${slug}`;
}

export function articleUrl(entry: Article): string {
  return entry.collection === "worklog"
    ? `/worklog/${worklogSlug(entry)}/`
    : `/knowledge/${entry.id}/`;
}

const published = ({ data }: Article) => import.meta.env.DEV || !data.draft;

export const lastModified = (a: Article): Date => a.data.updated ?? a.data.date;

const byDateDesc = (a: Article, b: Article) => b.data.date.getTime() - a.data.date.getTime();
const byModifiedDesc = (a: Article, b: Article) =>
  lastModified(b).getTime() - lastModified(a).getTime();

/** Worklogs are about a day's work, so they sort by `date`. */
export async function getWorklogs(): Promise<Worklog[]> {
  return (await getCollection("worklog", published)).sort(byDateDesc);
}

/** Knowledge is kept current, so it sorts by last update. */
export async function getKnowledge(): Promise<Knowledge[]> {
  return (await getCollection("knowledge", published)).sort(byModifiedDesc);
}

/** Every published article, most recently modified first. */
export async function getArticles(): Promise<Article[]> {
  return [...(await getWorklogs()), ...(await getKnowledge())].sort(byModifiedDesc);
}

/** Older / newer neighbour within the same collection, by `date`. */
export function neighbours(entry: Article, all: Article[]) {
  const list = all
    .filter((a) => a.collection === entry.collection)
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime() || a.id.localeCompare(b.id));
  const i = list.findIndex((a) => a.collection === entry.collection && a.id === entry.id);
  return { older: list[i - 1], newer: list[i + 1] };
}

/**
 * Articles sharing topics or the project with `entry`, best match first.
 * Shared topic: 2 points; shared project: 3 points.
 */
export function related(entry: Article, all: Article[], limit = 3): Article[] {
  const topics = new Set(entry.data.topics.map((t) => t.id));
  const project = entry.data.project?.id;
  return all
    .filter((a) => !(a.collection === entry.collection && a.id === entry.id))
    .map((a) => ({
      a,
      score:
        2 * a.data.topics.filter((t) => topics.has(t.id)).length +
        (project && a.data.project?.id === project ? 3 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((x, y) => y.score - x.score || byModifiedDesc(x.a, y.a))
    .slice(0, limit)
    .map(({ a }) => a);
}
