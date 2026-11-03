// 静态链接始终可用；仅普通点击增强为首页筛选，保留新标签页操作。
export function initHomeTopics(root: HTMLElement) {
  const links = [...root.querySelectorAll<HTMLAnchorElement>("[data-home-topic]")];
  const rows = [...root.querySelectorAll<HTMLElement>("[data-home-topics]")];
  const count = root.querySelector<HTMLElement>("[data-home-count]")!;
  const reset = root.querySelector<HTMLButtonElement>("[data-home-reset]")!;
  const empty = root.querySelector<HTMLElement>("[data-home-empty]")!;
  let active = "";
  const update = () => {
    let total = 0;
    rows.forEach((row) => {
      row.hidden = !!active && !row.dataset.homeTopics!.split(" ").includes(active);
      if (!row.hidden) total++;
    });
    links.forEach((link) => {
      if (link.dataset.homeTopic === active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    count.textContent = `${total} 篇笔记`;
    empty.hidden = total > 0;
    reset.hidden = !active;
  };
  root.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("[data-home-topic]");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    active = active === link.dataset.homeTopic ? "" : link.dataset.homeTopic!;
    update();
  });
  reset.addEventListener("click", () => {
    const previous = links.find((link) => link.dataset.homeTopic === active);
    active = "";
    update();
    previous?.focus();
  });
}
