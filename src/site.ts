// Site-wide identity used by <head>, the feed and structured data.
export const SITE = {
  title: "Toby Worklog",
  description: "Magento、Cloud、PHP、DevOps 与 AI 工作流的工作日志、知识库和问题解决记录。",
  lang: "zh-CN",
  locale: "zh_CN",
  /** Tagline under the home page wordmark; each entry links to its topic. */
  focus: ["magento", "magento-cloud", "php", "devops", "ai"],
  /** Topics with a count on the home page dashboard. */
  featuredTopics: ["magento", "devops", "ai"],
  author: {
    name: "Toby Tang",
    url: "https://github.com/tobytang-ebrook",
  },
} as const;
