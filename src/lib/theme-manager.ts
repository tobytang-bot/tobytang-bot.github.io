// Client-side theme state: mode (system | light | dark) × color theme.
// The head script in BaseLayout resolves the initial state before first paint
// and records it on <html> (data-theme-mode, data-theme-color); this module
// takes over from there. UI components only call these functions.
import {
  COLOR_THEMES,
  DARK_THEME,
  DEFAULT_COLOR,
  MODES,
  STORAGE_KEYS,
  type ColorThemeId,
  type ThemeMode,
} from "./themes";

export interface ThemeState {
  mode: ThemeMode;
  color: ColorThemeId;
  /** Color shown in place of `color` while previewing. */
  preview: ColorThemeId | null;
  isDark: boolean;
}

const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");
const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const listeners = new Set<(state: ThemeState) => void>();

const isMode = (v: unknown): v is ThemeMode => MODES.some((m) => m.id === v);
const isColor = (v: unknown): v is ColorThemeId => COLOR_THEMES.some((t) => t.id === v);

let mode: ThemeMode = isMode(root.dataset.themeMode) ? root.dataset.themeMode : "system";
let color: ColorThemeId = isColor(root.dataset.themeColor) ? root.dataset.themeColor : DEFAULT_COLOR;
let preview: ColorThemeId | null = null;

const isDark = () => mode === "dark" || (mode === "system" && media.matches);

export const getState = (): ThemeState => ({ mode, color, preview, isDark: isDark() });

function save() {
  try {
    localStorage.setItem(STORAGE_KEYS.mode, mode);
    localStorage.setItem(STORAGE_KEYS.color, color);
  } catch {
    // Storage unavailable (private mode): the choice lasts for this page only.
  }
}

function apply() {
  const dark = isDark() && !preview;
  const id = dark ? DARK_THEME.id : (preview ?? color);
  root.dataset.theme = id;
  root.dataset.scheme = dark ? "dark" : "light";
  root.dataset.themeMode = mode;
  root.dataset.themeColor = color;
  meta?.setAttribute("content", dark ? DARK_THEME.bg : COLOR_THEMES.find((t) => t.id === id)!.bg);
  const state = getState();
  for (const fn of listeners) fn(state);
}

export function setMode(next: ThemeMode) {
  mode = next;
  preview = null;
  save();
  apply();
}

/** Color themes are light palettes: choosing one while dark switches to light. */
export function setColor(next: ColorThemeId) {
  color = next;
  preview = null;
  if (isDark()) mode = "light";
  save();
  apply();
}

/** Shows a color without saving it; `null` restores the saved theme. */
export function previewColor(next: ColorThemeId | null) {
  if (next === preview) return;
  preview = next;
  apply();
}

export function subscribe(fn: (state: ThemeState) => void) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

media.addEventListener("change", () => {
  if (mode === "system") apply();
});
