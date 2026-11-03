// 仅跟随系统的减少动态效果设置。
export function watchMotion(update: (reduced: boolean) => void) {
  const system = matchMedia("(prefers-reduced-motion: reduce)");
  const sync = () => update(system.matches);
  system.addEventListener("change", sync);
  sync();
  return () => system.removeEventListener("change", sync);
}
