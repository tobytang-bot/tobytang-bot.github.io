---
title: Liquid Glass SVG 图标包
description: 16 个黑色 Liquid Glass 风格的箭头图标，蓝紫霓虹描边，SVG 格式，可直接用于前端。
date: 2026-09-28
kind: icon-pack
topics:
  - frontend
  - design
tags:
  - svg
  - icon
  - liquid-glass
  - arrow
license: MIT
source: ChatGPT 生成
version: "1.0"
assets: liquid-glass-icons
groups:
  - id: arrow
    title: 箭头
    prefix: arrow-
  - id: circle
    title: 圆形按钮
    prefix: circle-arrow-
  - id: square
    title: 方形按钮
    prefix: square-chevron-
---

## 包含内容

- **箭头**（8 个）：`arrow-up` / `down` / `left` / `right` 以及四个斜向 `up-left`、`up-right`、`down-left`、`down-right`。只有箭头本身，没有背景。
- **圆形按钮**（4 个）：`circle-arrow-up` / `down` / `left` / `right`，玻璃质感的圆形底座。
- **方形按钮**（4 个）：`square-chevron-up` / `down` / `left` / `right`，圆角方形底座，配 chevron 箭头。

所有图标都是 `128 × 128` 的 `viewBox`，可以无损缩放，单个文件约 2–2.5 KB。

## 使用方法

### 1. 用 `<img>` 引用（推荐）

最简单，也不会和页面里其他 SVG 冲突：

```html
<img src="https://tobytang-bot.github.io/downloads/liquid-glass-icons/circle-arrow-right.svg"
     width="48" height="48" alt="下一步">
```

建议把文件下载到自己的项目里再引用，不要依赖本站的地址。

### 2. 作为 CSS 背景

```css
.next-button {
  width: 48px;
  height: 48px;
  background: url("/icons/circle-arrow-right.svg") center / contain no-repeat;
}
```

### 3. 内联 SVG

内联后可以用 CSS 控制尺寸、加 hover 动画。但要注意：**每个文件都使用了相同的 `id`**（`glassFill`、`rim`、`arrowFill`、`outerGlow`、`softShadow`、`arrowGlow`）。同一个页面里内联多个图标时，这些 id 会互相冲突，被隐藏的图标还可能让其他图标的渐变失效。

解决办法是给每个图标的 id 加上唯一前缀，例如用 [SVGO](https://github.com/svg/svgo) 的 `prefixIds` 插件，它默认会用文件名作为前缀：

```js
// svgo.config.mjs
export default {
  plugins: ["preset-default", "prefixIds"],
};
```

```sh
npx svgo --config svgo.config.mjs -f ./icons -o ./icons-inline
```

或者手动替换，把 `id="rim"` 和 `url(#rim)` 一起改成 `id="up-rim"` 和 `url(#up-rim)`。

### 4. 背景颜色

图标是为**深色背景**设计的。尤其是纯箭头，它是接近白色的渐变加发光效果，放在浅色背景上几乎看不见。浅色页面建议使用圆形或方形按钮版本，因为它们自带深色底座。

## 授权

以 **MIT** 授权分享，可以免费用于个人和商业项目，也可以修改和再分发。图标由 ChatGPT 生成，本站整理并发布。

## 更新记录

- **1.0**（2026-09-28）：首个版本，16 个图标。
