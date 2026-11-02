export function watchMotion(update: (reduced: boolean) => void) {
  const system = matchMedia("(prefers-reduced-motion: reduce)");
  const sync = () => update(system.matches || document.documentElement.dataset.motion === "reduce");
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  system.addEventListener("change", sync);
  sync();
  return () => {
    observer.disconnect();
    system.removeEventListener("change", sync);
  };
}
