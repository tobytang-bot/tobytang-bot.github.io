import { createRenderer } from "./canvas-renderer";
import { measureGraph } from "./graph-layout";
import { watchMotion } from "./motion-preferences";

export function mountGraph(root: HTMLElement): () => void {
  const candidate = createRenderer(root.querySelector<HTMLCanvasElement>("canvas")!);
  if (!candidate) return () => {};
  const renderer = candidate;
  const links = [...root.querySelectorAll<HTMLElement>("[data-graph-node]")];
  const mobile = matchMedia("(max-width: 860px), (pointer: coarse)");
  const events = new AbortController();
  let layout = measureGraph(root, links);
  let reduced = false;
  let visible = true;
  let frame = 0;
  let active = -1;
  let hovered = -1;
  let offset = 0;
  let targetOffset = 0;
  let progress = 0;
  let targetProgress = 0;
  let disposed = false;
  const staticMode = () => reduced || mobile.matches;
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const draw = () => renderer.draw(layout.points, active, progress, offset);
  function tick() {
    frame = 0;
    offset += (targetOffset - offset) * 0.16;
    progress += (targetProgress - progress) * 0.16;
    const moving = Math.abs(targetOffset - offset) > 0.02 || Math.abs(targetProgress - progress) > 0.001;
    if (!moving) {
      offset = targetOffset;
      progress = targetProgress;
    }
    draw();
    if (moving) frame = requestAnimationFrame(tick);
  }
  function requestDraw() {
    if (disposed || !visible || document.hidden) return;
    if (staticMode()) {
      stop();
      offset = progress = targetOffset = targetProgress = 0;
      draw();
    } else if (!frame) {
      frame = requestAnimationFrame(tick);
    }
  }
  function scroll() {
    // 每次滚动实时读取位置，避免上方内容高度变化后缓存的偏移失效。
    const top = staticMode() || !visible ? 0 : root.getBoundingClientRect().top;
    targetProgress = staticMode() ? 0 : Math.max(0, Math.min(1, -top / layout.height));
    requestDraw();
  }
  function resize() {
    layout = measureGraph(root, links);
    renderer.resize(layout.width, layout.height);
    scroll();
  }
  const motionCleanup = watchMotion((value) => {
    reduced = value;
    stop();
    scroll();
  });
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) scroll();
    else stop();
  });
  visibility.observe(root);
  const sizes = new ResizeObserver(resize);
  sizes.observe(root);
  links.forEach((link) => sizes.observe(link));
  // 主题订阅发生在 View Transition 更新 DOM 之前，直接观察实际主题属性。
  const theme = new MutationObserver(() => {
    renderer.palette();
    requestDraw();
  });
  theme.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-scheme"],
  });
  links.forEach((link, index) => {
    const highlight = () => { active = index; requestDraw(); };
    const enter = () => { hovered = index; highlight(); };
    const reset = () => {
      hovered = -1;
      active = links.indexOf(document.activeElement as HTMLElement);
      targetOffset = 0;
      requestDraw();
    };
    link.addEventListener("pointerenter", enter, { signal: events.signal });
    link.addEventListener("focus", highlight, { signal: events.signal });
    link.addEventListener("pointerleave", reset, { signal: events.signal });
    // 失焦时若指针仍悬停在某节点上，保留该节点的高亮。
    link.addEventListener("blur", () => { active = hovered; requestDraw(); }, { signal: events.signal });
  });
  root.addEventListener("pointermove", (event) => {
    if (staticMode()) return;
    // 按指针相对容器中心的位置映射到 [-8, 8]，而不是累加 movementX。
    const box = root.getBoundingClientRect();
    const ratio = box.width > 0 ? (event.clientX - box.left) / box.width - 0.5 : 0;
    targetOffset = Math.max(-8, Math.min(8, ratio * 16));
    requestDraw();
  }, { signal: events.signal, passive: true });
  root.addEventListener("pointerleave", () => { targetOffset = 0; requestDraw(); }, { signal: events.signal });
  window.addEventListener("scroll", scroll, { signal: events.signal, passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else scroll();
  }, { signal: events.signal });
  mobile.addEventListener("change", scroll, { signal: events.signal });
  resize();
  return () => {
    disposed = true;
    stop();
    events.abort();
    motionCleanup();
    visibility.disconnect();
    sizes.disconnect();
    theme.disconnect();
  };
}
