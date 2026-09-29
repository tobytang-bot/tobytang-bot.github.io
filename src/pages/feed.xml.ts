import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { articleUrl, getArticles } from "../lib/content";
import { COLLECTION_LABEL } from "../lib/status";
import { getTopics } from "../lib/topics";
import { SITE } from "../site";

export async function GET(context: APIContext) {
  const [articles, topics] = await Promise.all([getArticles(), getTopics()]);
  const items = [...articles].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    trailingSlash: true,
    customData: `<language>${SITE.lang.toLowerCase()}</language>`,
    items: items.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      link: articleUrl(entry),
      pubDate: entry.data.date,
      categories: [
        COLLECTION_LABEL[entry.collection],
        ...entry.data.topics.map((t) => topics.get(t.id)?.data.title ?? t.id),
      ],
    })),
  });
}
