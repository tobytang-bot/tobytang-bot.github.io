// Theme = mode × color. The mode decides light or dark; in light, the reader's
// color theme is used, in dark always slate. Palettes are in
// src/styles/themes.css; `bg` must match each theme's --bg (used for
// <meta theme-color>), `swatch` is the more saturated dot shown in the picker.
export const COLOR_THEMES = [
  { id: "ivory", label: "纸张白", bg: "#f7f6f2", swatch: "#f7f6f2" },
  { id: "sage", label: "鼠尾草", bg: "#eef2ec", swatch: "#dde8dd" },
  { id: "mist", label: "雾霭蓝", bg: "#eef2f5", swatch: "#dce6ec" },
  { id: "lavender", label: "淡紫", bg: "#f3f0f5", swatch: "#e7dfea" },
  { id: "sand", label: "暖沙", bg: "#f4f0e8", swatch: "#e8dfcf" },
] as const;

export const DARK_THEME = { id: "slate", label: "深夜", bg: "#202326" } as const;

export const DEFAULT_COLOR: ColorThemeId = "mist";

export const MODES = [
  { id: "system", label: "跟随系统" },
  { id: "light", label: "浅色" },
  { id: "dark", label: "深色" },
] as const;

export type ColorThemeId = (typeof COLOR_THEMES)[number]["id"];
export type ThemeMode = (typeof MODES)[number]["id"];

export const STORAGE_KEYS = { mode: "blog.theme.mode", color: "blog.theme.color" } as const;

/** Values of the previous single `theme` key, as [mode, color?]. */
export const LEGACY_KEY = "theme";
export const LEGACY_THEME: Record<string, [ThemeMode, ColorThemeId?]> = {
  dark: ["dark"],
  midnight: ["dark"],
  graphite: ["dark"],
  light: ["light", "ivory"],
  paper: ["light", "ivory"],
  mist: ["light", "mist"],
};
