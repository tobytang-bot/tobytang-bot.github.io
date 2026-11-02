import { watchMotion } from "./motion-preferences";

export function initReveals() {
  if (!("IntersectionObserver" in window)) return;
  const seen = new WeakSet<Element>();
  // 记录已收到过首次回调的元素，用来识别“加载时已在视区内”的元素。
  const reported = new WeakSet<Element>();
  const animations = new Set<Animation>();
  let observer: IntersectionObserver | undefined;
  let unsubscribe: (() => void) | undefined;
  function stop() {
    observer?.disconnect();
    unsubscribe?.();
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  }
  function start() {
    unsubscribe = watchMotion((reduced) => {
      observer?.disconnect();
      if (reduced) {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
        return;
      }
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const first = !reported.has(entry.target);
          reported.add(entry.target);
          if (!entry.isIntersecting) return;
          observer?.unobserve(entry.target);
          if (seen.has(entry.target)) return;
          seen.add(entry.target);
          // 首屏已绘制为不透明的元素不再回退播放，避免加载时闪烁。
          if (first) return;
          // 只在进入视区时添加动画，无脚本或观察器失败时内容始终可见。
          const animation = entry.target.animate([
            { opacity: 0.4, transform: "translateY(10px)" },
            { opacity: 1, transform: "translateY(0)" },
          ], { duration: 360, easing: "cubic-bezier(.2,.7,.3,1)" });
          animations.add(animation);
          animation.addEventListener("finish", () => animations.delete(animation), { once: true });
        });
      }, { threshold: 0.08 });
      document.querySelectorAll("[data-reveal]").forEach((element) => {
        // 祖先已带 data-reveal 时跳过，避免嵌套动画叠加。
        if (element.parentElement?.closest("[data-reveal]")) return;
        if (!seen.has(element)) observer!.observe(element);
      });
    });
  }
  start();
  window.addEventListener("pagehide", stop);
  window.addEventListener("pageshow", (event) => { if (event.persisted) start(); });
}
