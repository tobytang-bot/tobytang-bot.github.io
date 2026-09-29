// Color themes, darkest to lightest. Palettes are in src/styles/themes.css;
// `bg` must match each theme's --bg (used for swatches and <meta theme-color>).
export const THEMES = [
  { id: "midnight", label: "深夜", scheme: "dark", bg: "#0e1116" },
  { id: "graphite", label: "石墨", scheme: "dark", bg: "#161a21" },
  { id: "mist", label: "雾灰", scheme: "light", bg: "#e8ebf0" },
  { id: "paper", label: "纸白", scheme: "light", bg: "#f7f8fa" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

/** Theme used when following the system setting. */
export const SYSTEM_THEME = { dark: "graphite", light: "paper" } as const;

/** Values stored by the previous two-state toggle. */
export const LEGACY_THEME = { dark: "graphite", light: "paper" } as const;
