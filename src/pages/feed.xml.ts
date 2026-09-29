import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { articleUrl, getArticles } from "../lib/content";
import { COLLECTION_LABEL } from "../lib/status";
import { getResources, KIND_LABEL, resourceUrl } from "../lib/resources";
import { getTopics } from "../lib/topics";
import { SITE } from "../site";

export async function GET(context: APIContext) {
  const [articles, resources, topics] = await Promise.all([
    getArticles(),
    getResources(),
    getTopics(),
  ]);
  const topicTitles = (refs: { id: string }[]) => refs.map((t) => topics.get(t.id)?.data.title ?? t.id);

  const items = [
    ...articles.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      link: articleUrl(entry),
      pubDate: entry.data.date,
      categories: [COLLECTION_LABEL[entry.collection], ...topicTitles(entry.data.topics)],
    })),
    ...resources.map((r) => ({
      title: r.data.title,
      description: r.data.description,
      link: resourceUrl(r),
      pubDate: r.data.date,
      categories: ["Resource", KIND_LABEL[r.data.kind], ...topicTitles(r.data.topics)],
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    trailingSlash: true,
    customData: `<language>${SITE.lang.toLowerCase()}</language>`,
    items,
  });
}
