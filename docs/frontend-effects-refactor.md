# 前端图谱与动效重构记录

日期：2026-11-02。基线：`astro-site` 分支，`320cea4`。

依据《Toby Worklog 前端技术架构与视觉特效重构实施计划 v1.0》，完成 M0 基线检查、M1 首页图谱、M2 滚动与内容揭示、M3 主题与可访问性，以及 M5 的本地构建与回归验证。M4 实验、Git 提交、PR、合并与发布未执行。

## 实现范围

- 首页保留头像、Engineering Worklog、领域链接、搜索、真实统计、最近更新、Knowledge 和 Projects。
- 新增 Canvas 2D 图谱；节点由实际含文章或资源的顶级分类生成，按内容数量和名称排序，最多六个。数量包含文章和资源，不伪造统计。
- Canvas 仅绘制装饰连线和节点，分类文字与链接使用原生 DOM。没有 JavaScript 或 Canvas 上下文不可用时仍可阅读、导航。
- 图谱布局、控制与渲染独立；布局使用 Float32Array，DPR 上限为 2。指针与焦点触发高亮，滚动使连线淡出，插值结束停止 RAF。
- 图谱在移动端和粗指针环境静态显示；减少动画偏好关闭图谱视差与滚动淡出。离屏、后台和 pagehide 时停止绘制或清理，pageshow 恢复时重新初始化。
- 标题/副标题错峰入场，首页章节及全站 ArticleList 在进入视区时一次性 reveal。内容默认可见，不依赖脚本解除隐藏。
- 直接观察主题属性变化，兼容现有 View Transition 更新时序。系统和站点减少动画开关均即时生效。
- 搜索仅增加 CSS 打开/关闭过渡；支持离散过渡的浏览器可淡出，其他浏览器立即关闭。

## 变更文件

| 文件 | 改动 |
| --- | --- |
| `src/pages/index.astro` | 接入 Hero 与真实分类数据，增加章节 reveal 标记；从 376 行减至 270 行 |
| `src/components/home/HeroIntro.astro` | 提取头像、标题、领域和原搜索入口 |
| `src/components/home/HeroGraph.astro` | Canvas 与可访问的分类链接、页面生命周期接入 |
| `src/lib/motion/graph-data.ts` | 复用分类路由的内容筛选逻辑 |
| `src/lib/motion/graph-layout.ts` | 测量 DOM 标签并生成图谱坐标 |
| `src/lib/motion/graph-controller.ts` | 指针、焦点、滚动、可见性、尺寸、主题及资源清理 |
| `src/lib/motion/canvas-renderer.ts` | DPR 限制、读取主题颜色、绘制连线节点 |
| `src/lib/motion/motion-preferences.ts` | 合并系统和站点减少动画偏好 |
| `src/lib/motion/reveal.ts` | 一次性视区动画、减少动画与页面生命周期处理 |
| `src/styles/home-hero.css` | Hero 布局、图谱、响应式及错峰入场 |
| `src/styles/content-motion.css` | 搜索面板渐进增强过渡 |
| `src/components/ArticleList.astro` | 增加列表项 reveal 标记 |
| `src/layouts/BaseLayout.astro` | 接入轻量 reveal 和搜索过渡样式 |

所有新增、修改的源码文件均不超过 300 行。初版没有修改依赖、内容文件、主题管理、搜索业务逻辑、公开 URL、SEO 配置或工作流。

## 构建与静态回归

基线和实施后均运行并通过：

```sh
npm run build
git diff --check
```

- 对比度检查：ivory、sage、sand、cocoa、deepsea、pine 全部通过（主题精简后仅剩 sand、deepsea，见下文）。
- 实施后 Astro 检查 50 个文件，0 errors / 0 warnings / 0 hints。
- Astro 构建 26 个页面；输出合计 30 个 HTML 文件，包括四个旧 URL 重定向。
- Pagefind 保持 5 个索引页面、1046 个词、4 个筛选器。
- 30 个页面的路径、Canonical、描述、Open Graph、RSS 链接和 JSON-LD 与基线逐项一致。
- RSS、Sitemap、四个旧 URL 重定向输出与基线逐字节相同。
- 对 `src/content`、`public`、`.github` 共 34 个文件进行 SHA-256 对照，无变化。
- 复用了已安装的依赖；没有重新执行 `npm ci`，也没有修改锁文件。
- Pagefind 原有提示仍存在：四个 Astro 重定向页不含完整 HTML；中文不支持词干匹配。这些提示不影响构建通过。

## 浏览器验证

本地 Astro preview，Chromium 自动化：

- `/`、`/knowledge/`、`/projects/`、`/archive/`、`/resources/`、`/topics/` 和 Docker 文章均返回 200，标题及正文正常。
- 六个图谱分类链接全部返回 200；前进到分类页后返回首页正常。
- 320、390、768、1024、1440px 视口没有横向溢出。
- 无 JavaScript、模拟 Canvas 不可用、触摸移动端三种环境均保留四篇文章和六个分类链接。
- 六套主题通过现有界面切换；Canvas 像素随每套配色重新绘制。
- 键盘聚焦分类链接会改变图谱高亮；滚动会改变 Canvas 透明度。
- 系统 reduced-motion、站点减少动画开关分别测试，开启后滚动不改变图谱。
- `Cmd+K` 搜索 Docker 返回一篇；关闭搜索后可使用移动导航和 Escape 关闭菜单。
- Chromium 的搜索框含文字时，第一次 Escape 清空关键词，第二次关闭对话框；原搜索业务保持不变。
- 页面脚本无运行时错误。Canvas 像素回读产生的性能提示来自验证代码，产品代码不执行像素回读。
- 独立 Astra 审核仅依据原始 diff，未发现可证实的待修复缺陷。

## 性能记录与限制

| 指标 | 本地结果 |
| --- | --- |
| 新增 HeroGraph 脚本 | 1466 字节 gzip |
| 新增 BaseLayout reveal 脚本 | 484 字节 gzip |
| 共享 motion-preferences 脚本 | 239 字节 gzip |
| 新增脚本合计 | 2189 字节，约 2.14 KiB gzip |
| 桌面 1440px LCP / CLS | 84ms / 0 |
| 移动视口 390px LCP / CLS | 92ms / 0 |
| 图谱稳定后的连续三次采样 | 绘制计数维持 2，无新增绘制 |
| 图谱完全离屏后的 400ms | 0 次新增绘制 |
| 移动粗指针移动后的采样 | 0 次新增绘制 |
| 模拟 document.hidden 后触发滚动及主题变化 | 0 次新增绘制 |

LCP/CLS 为本地未限制网络和 CPU 的单次实验采样，移动视口并非真实手机。没有测量真实用户 INP、真实设备帧率、电池消耗、Safari/Firefox 或线上 Core Web Vitals。后台检测采用合成可见性状态；浏览器历史返回已检查，但没有证明浏览器一定采用 bfcache。

## 代码审查后的修复

同日对工作区改动做了代码审查，修复以下问题（`astro check` 0 errors，`npm run build` 通过；尚未做浏览器回归）：

- **嵌套 reveal 叠加**：`reveal.ts` 跳过祖先已带 `data-reveal` 的元素，首页"最近更新"不再整块与列表项双重动画。
- **首屏闪烁**：元素在观察器首次回调时已在视区内则视为已显示，不再从 0.4 透明度回放。
- **视差累加饱和**：`graph-controller.ts` 改为按指针相对容器中心位置映射到 ±8，不再累加 `movementX`。
- **失焦清除悬停高亮**：记录悬停节点，blur 时恢复为悬停节点而非 -1。
- **画布坐标偏 1px**：`graph-layout.ts` 以内边距盒（`clientLeft/Top`、`clientWidth/Height`）为原点和尺寸，与 `inset:0` 的 canvas 一致。
- **滚动淡出使用陈旧偏移**：去掉缓存的 `layout.top`，滚动时实时读取 `getBoundingClientRect().top`。
- **重复 resize**：移除 `window` resize 监听，仅保留 ResizeObserver。
- **搜索框单栏铺满**：恢复 `width: min(100%, 36rem)`。
- **分类链接口径不一致**：首页领域链接与统计卡片改为按"文章 + 资源"判断分类页是否存在，与路由一致；图谱计数文案改为"条内容"。

## 主题精简

外观面板去掉配色滑块，每种模式只保留一套配色：浅色 = 暖沙（`sand`，新默认），深色 = 深海（`deepsea`）。删除 ivory、sage、cocoa、pine；旧 localStorage 中的已删配色自动回落到默认值，无 JS 时浅色基线改为暖沙，`theme-color` 改为 `#f4f0e8`。

## 查看与后续

```sh
npm run build
npm run preview
```

截图与静态验证摘要保存在当前 Codex 会话的 `worklog-refactor` 可视化目录中。基线、桌面、移动端和暗色截图均已保存。

当前改动保留在工作区，未新建分支、commit、push、创建 PR、合并或部署。发布仍需单独执行相应 Git/PR 流程并核查 GitHub Pages 结果。
