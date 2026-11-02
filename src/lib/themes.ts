// Theme = mode → palette. The mode decides light or dark, and each scheme has
// exactly one palette (light: sand, dark: deepsea). Palettes are in
// src/styles/themes.css; `bg` must match each theme's --bg (used for
// <meta theme-color>).
export const THEMES = [
  { id: "sand", label: "暖沙", scheme: "light", bg: "#f4f0e8" },
  { id: "deepsea", label: "深海", scheme: "dark", bg: "#1a1f26" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type Scheme = (typeof THEMES)[number]["scheme"];

export const DEFAULT_THEME = { light: "sand", dark: "deepsea" } as const satisfies Record<
  Scheme,
  ThemeId
>;

export const MODES = [
  { id: "system", label: "跟随系统" },
  { id: "light", label: "浅色" },
  { id: "dark", label: "深色" },
] as const;

export const GLASS_LEVELS = [
  { id: "low", label: "低" },
  { id: "medium", label: "中" },
  { id: "high", label: "高" },
] as const;

export const DEFAULT_GLASS: GlassLevel = "medium";

export type ThemeMode = (typeof MODES)[number]["id"];
export type GlassLevel = (typeof GLASS_LEVELS)[number]["id"];

export const STORAGE_KEYS = {
  mode: "blog.theme.mode",
  /** Light palette (the key predates dark palettes). */
  light: "blog.theme.color",
  /** Dark palette. */
  dark: "blog.theme.dark",
  /** "reduce" when the reader turned on Reduce Motion. */
  motion: "blog.motion",
  /** Liquid Glass intensity: low | medium | high. */
  glass: "blog.glass",
} as const;

/** Values of the previous single `theme` key, as [mode, light palette?]. */
export const LEGACY_KEY = "theme";
export const LEGACY_THEME: Record<string, [ThemeMode, ThemeId?]> = {
  dark: ["dark"],
  midnight: ["dark"],
  graphite: ["dark"],
  light: ["light", "sand"],
  paper: ["light", "sand"],
  mist: ["light", "sand"],
};
