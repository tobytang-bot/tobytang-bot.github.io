import { inTopic, topicUrl, type Tagged, type Topic } from "../topics";

export interface GraphTopic {
  label: string;
  href: string;
  count: number;
}

// 与分类路由共用内容筛选，只有实际生成的分类页才成为节点。
export function graphTopics(topics: Map<string, Topic>, items: Tagged[]): GraphTopic[] {
  return [...topics.values()]
    .filter((topic) => !topic.data.parent)
    .map((topic) => ({
      label: topic.data.title,
      href: topicUrl(topic.id),
      count: inTopic(topic.id, items, topics).length,
    }))
    .filter((topic) => topic.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
}
