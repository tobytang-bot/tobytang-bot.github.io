// DOM 标签提供布局坐标，图形不参与排版，因此缩放与长标题不会相互遮挡。
export function measureGraph(root: HTMLElement, links: HTMLElement[]) {
  // 画布以 inset:0 铺满内边距盒，坐标原点与尺寸需排除边框。
  const rect = root.getBoundingClientRect();
  const left = rect.left + root.clientLeft;
  const top = rect.top + root.clientTop;
  const heading = root.querySelector<HTMLElement>(".graph-heading")!.getBoundingClientRect();
  const points = new Float32Array((links.length + 1) * 2);
  points[0] = heading.left + heading.width / 2 - left;
  points[1] = heading.bottom - top + 10;
  links.forEach((link, i) => {
    const box = link.getBoundingClientRect();
    points[(i + 1) * 2] = box.left + box.width / 2 - left;
    points[(i + 1) * 2 + 1] = box.top - top - 9;
  });
  return { points, width: root.clientWidth, height: root.clientHeight };
}
