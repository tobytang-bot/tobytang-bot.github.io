# tobytang-bot.github.io

基于 [Astro](https://astro.build) 的技术笔记、知识库与实用资源网站。工作记录仅保留在 GitHub 代码库中，不在公开网站展示。
Target: `https://tobytang-bot.github.io/`. Architecture: [docs/architecture-assessment.md](docs/architecture-assessment.md).

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # contrast check + astro check + static build to dist/ + Pagefind search index
npm run check:contrast  # WCAG AA check for every theme in src/styles/themes.css
npm run preview  # serve dist/ (search works here, not in `npm run dev`)
```

## Content

| Path | Purpose |
|---|---|
| `src/content/worklog/<yyyy>/<yyyy-mm-dd>-<slug>.md` | 仓库专用工作记录；旧网站地址跳转到 GitHub 对应文件 |
| `src/content/knowledge/<topic>/<slug>.md` | Long-lived, structured knowledge → `/knowledge/<topic>/<slug>/` |
| `src/content/topics.yaml` | Topic tree (`parent` for hierarchy) |
| `src/content/projects/<id>.yaml` | Projects referenced by `project:` |
| `templates/worklog.md` | 仓库专用工作记录模板（人工或 AI 编写） |
| `src/content/resources/<id>.md` | Shared resource (icon pack, tool, template, snippet) → `/resources/<id>/` |
| `public/downloads/<assets>/` | Files of a resource, served as-is at `/downloads/<assets>/…`; zipped at build to `/downloads/<assets>.zip` |

Frontmatter is validated by `src/content.config.ts`; an unknown topic/project, an invalid `status`,
or a worklog filename date that differs from `date` fails the build.

The previous Jekyll site is preserved at tag `legacy-jekyll`.

## 仓库工作记录

通过 GitHub 查看 [工作记录](src/content/worklog/)。这些 Markdown 文件继续保留内容校验，但不参与公开网站的导航、文章列表、统计、项目关联、Pagefind 搜索或 RSS。旧 `/worklog/` 地址跳转到 GitHub，并从 Sitemap 排除。

## 界面

网站采用“清爽编辑”布局，保留暖沙与深海两套配色。顶部导航为文章、项目、资源；主题与时间归档位于文章页及页脚。首页主题入口支持本地筛选，关闭 JavaScript 时仍可进入对应分类页。

文章页在宽屏使用正文与右侧目录布局，窄屏改为正文上方的折叠目录。搜索保留 Pagefind 与 `Ctrl/Cmd+K` 快捷键。
