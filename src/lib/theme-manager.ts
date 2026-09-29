// Client-side appearance state: mode (system | light | dark) × color theme,
// plus Reduce Motion.
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
  /** Reduce Motion turned on in the panel. */
  reduceMotion: boolean;
  /** Reduced motion requested by the operating system. */
  systemReducedMotion: boolean;
}

const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");
const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const listeners = new Set<(state: ThemeState) => void>();

const isMode = (v: unknown): v is ThemeMode => MODES.some((m) => m.id === v);
const isColor = (v: unknown): v is ColorThemeId => COLOR_THEMES.some((t) => t.id === v);

let mode: ThemeMode = isMode(root.dataset.themeMode) ? root.dataset.themeMode : "system";
let color: ColorThemeId = isColor(root.dataset.themeColor) ? root.dataset.themeColor : DEFAULT_COLOR;
let preview: ColorThemeId | null = null;
let reduceMotion = root.dataset.motion === "reduce";

const isDark = () => mode === "dark" || (mode === "system" && media.matches);

export const getState = (): ThemeState => ({
  mode,
  color,
  preview,
  isDark: isDark(),
  reduceMotion,
  systemReducedMotion: motionMedia.matches,
});

function save() {
  try {
    localStorage.setItem(STORAGE_KEYS.mode, mode);
    localStorage.setItem(STORAGE_KEYS.color, color);
    if (reduceMotion) localStorage.setItem(STORAGE_KEYS.motion, "reduce");
    else localStorage.removeItem(STORAGE_KEYS.motion);
  } catch {
    // Storage unavailable (private mode): the choice lasts for this page only.
  }
}

const notify = () => {
  const state = getState();
  for (const fn of listeners) fn(state);
};

/** Crossfades a change of palette, unless motion is reduced or unsupported. */
function transition(update: () => void) {
  if (reduceMotion || motionMedia.matches || !document.startViewTransition) update();
  else document.startViewTransition(update);
}

/** `animate`: crossfade if the palette changes (not while previewing a drag). */
function apply(animate = false) {
  const dark = isDark() && !preview;
  const id = dark ? DARK_THEME.id : (preview ?? color);
  if (animate && id !== root.dataset.theme) {
    transition(() => render(id, dark));
  } else {
    render(id, dark);
  }
  notify();
}

function render(id: string, dark: boolean) {
  root.dataset.theme = id;
  root.dataset.scheme = dark ? "dark" : "light";
  root.dataset.themeMode = mode;
  root.dataset.themeColor = color;
  meta?.setAttribute("content", dark ? DARK_THEME.bg : COLOR_THEMES.find((t) => t.id === id)!.bg);
}

export function setMode(next: ThemeMode) {
  mode = next;
  preview = null;
  save();
  apply(true);
}

/** Color themes are light palettes: choosing one while dark switches to light. */
export function setColor(next: ColorThemeId) {
  color = next;
  preview = null;
  if (isDark()) mode = "light";
  save();
  apply(true);
}

/** Shows a color without saving it; `null` restores the saved theme. */
export function previewColor(next: ColorThemeId | null) {
  if (next === preview) return;
  preview = next;
  apply();
}

export function setReduceMotion(next: boolean) {
  reduceMotion = next;
  if (next) root.dataset.motion = "reduce";
  else delete root.dataset.motion;
  save();
  notify();
}

export function subscribe(fn: (state: ThemeState) => void) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

media.addEventListener("change", () => {
  if (mode === "system") apply(true);
});
motionMedia.addEventListener("change", notify);
