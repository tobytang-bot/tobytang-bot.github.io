// Site-wide identity used by <head>, the feed and structured data.
export const SITE = {
  title: "tobytang-bot.github.io",
  description: "Magento、PHP、Docker 等技术笔记与实用资源。",
  repository: "https://github.com/tobytang-bot/tobytang-bot.github.io",
  lang: "zh-CN",
  locale: "zh_CN",
  /** Topic ribbon on the home page; topics without articles are skipped. */
  featuredTopics: ["linux", "magento", "docker", "php", "markdown", "mysql"],
  author: {
    name: "Toby Tang",
    url: "https://github.com/tobytang-ebrook",
  },
} as const;

/**
 * Primary navigation, shared by the header and the 404 page.
 * `sections` are path prefixes that mark the entry as current.
 */
export const NAV = [
  { title: "文章", url: "/knowledge/", note: "技术笔记、主题与归档", sections: ["/knowledge/", "/topics/", "/archive/"] },
  { title: "项目", url: "/projects/", note: "在做的项目与相关笔记", sections: ["/projects/"] },
  { title: "资源", url: "/resources/", note: "可下载的图标、工具与模板", sections: ["/resources/"] },
] as const;
