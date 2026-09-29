import { getCollection, type CollectionEntry } from "astro:content";
import type { Article } from "./content";

export type Topic = CollectionEntry<"topics">;

export interface TopicNode {
  topic: Topic;
  children: TopicNode[];
  /** Articles tagged with this topic or any descendant. */
  count: number;
}

export const topicUrl = (id: string) => `/topics/${id}/`;

export async function getTopics(): Promise<Map<string, Topic>> {
  return new Map((await getCollection("topics")).map((t) => [t.id, t]));
}

/** Root-first chain of ancestors, including the topic itself. */
export function ancestry(id: string, topics: Map<string, Topic>): Topic[] {
  const chain: Topic[] = [];
  for (let t = topics.get(id); t; t = t.data.parent && topics.get(t.data.parent.id)) {
    if (chain.includes(t)) throw new Error(`topics.yaml: parent cycle at "${t.id}"`);
    chain.unshift(t);
  }
  return chain;
}

/** The topic id plus every descendant id. */
export function descendants(id: string, topics: Map<string, Topic>): Set<string> {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const t of topics.values()) {
      if (t.data.parent && ids.has(t.data.parent.id) && !ids.has(t.id)) {
        ids.add(t.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function articlesInTopic(
  id: string,
  articles: Article[],
  topics: Map<string, Topic>,
): Article[] {
  const ids = descendants(id, topics);
  return articles.filter((a) => a.data.topics.some((t) => ids.has(t.id)));
}

export function findNode(nodes: TopicNode[], id: string): TopicNode | undefined {
  for (const node of nodes) {
    const found = node.topic.id === id ? node : findNode(node.children, id);
    if (found) return found;
  }
}

export function topicTree(articles: Article[], topics: Map<string, Topic>): TopicNode[] {
  const build = (parent: string | undefined): TopicNode[] =>
    [...topics.values()]
      .filter((t) => t.data.parent?.id === parent)
      .map((topic) => ({
        topic,
        children: build(topic.id),
        count: articlesInTopic(topic.id, articles, topics).length,
      }))
      .sort((a, b) => b.count - a.count || a.topic.data.title.localeCompare(b.topic.data.title));
  return build(undefined);
}
