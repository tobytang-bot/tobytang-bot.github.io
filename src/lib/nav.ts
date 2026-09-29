import { getCollection } from "astro:content";
import { articleUrl, getKnowledge, getWorklogs, type Article } from "./content";
import type { Status } from "./status";

export interface NavItem {
  title: string;
  url: string;
  status: Status;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface NavSection {
  title: string;
  groups: NavGroup[];
}

const toItem = (entry: Article): NavItem => ({
  title: entry.data.title,
  url: articleUrl(entry),
  status: entry.data.status,
});

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return groups;
}

let cached: Promise<NavSection[]> | undefined;

/** Sidebar tree: Worklog by year, Knowledge by top-level topic folder. */
export function getNav(): Promise<NavSection[]> {
  // Cache only for static builds; in dev, content edits must show up immediately.
  if (import.meta.env.DEV) return build();
  cached ??= build();
  return cached;
}

async function build(): Promise<NavSection[]> {
  const [worklogs, knowledge, topics] = await Promise.all([
    getWorklogs(),
    getKnowledge(),
    getCollection("topics"),
  ]);
  const topicTitle = new Map(topics.map((t) => [t.id, t.data.title]));

  const byYear = groupBy(worklogs, (e) => String(e.data.date.getUTCFullYear()));
  const byTopic = groupBy(knowledge, (e) => e.id.split("/")[0]);

  return [
    {
      title: "Worklog",
      groups: [...byYear]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([year, entries]) => ({ title: year, items: entries.map(toItem) })),
    },
    {
      title: "Knowledge",
      groups: [...byTopic]
        .map(([topic, entries]) => ({
          title: topicTitle.get(topic) ?? topic,
          items: entries
            .map(toItem)
            .sort((a, b) => a.title.localeCompare(b.title, "zh-CN")),
        }))
        .sort((a, b) => a.title.localeCompare(b.title, "zh-CN")),
    },
  ].filter((section) => section.groups.length > 0);
}
