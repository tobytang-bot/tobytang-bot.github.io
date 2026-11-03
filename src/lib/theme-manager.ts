// Client-side appearance state: mode (system | light | dark), which picks the
// single palette of that scheme.
// The head script in BaseLayout resolves the initial state before first paint
// and records it on <html> (data-theme-mode, data-theme-light,
// data-theme-dark); this module takes over from there. UI components only
// call these functions.
import {
  DEFAULT_THEME,
  MODES,
  STORAGE_KEYS,
  THEMES,
  type Scheme,
  type ThemeId,
  type ThemeMode,
} from "./themes";

export interface ThemeState {
  mode: ThemeMode;
  /** Scheme in use: from the mode, or the system setting when following it. */
  scheme: Scheme;
  /** Saved palette for each scheme. */
  palettes: Record<Scheme, ThemeId>;
}

const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");
const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const listeners = new Set<(state: ThemeState) => void>();

const isMode = (v: unknown): v is ThemeMode => MODES.some((m) => m.id === v);
const themeOf = (id: unknown) => THEMES.find((t) => t.id === id);
const paletteFor = (scheme: Scheme, v: unknown): ThemeId =>
  themeOf(v)?.scheme === scheme ? (v as ThemeId) : DEFAULT_THEME[scheme];

let mode: ThemeMode = isMode(root.dataset.themeMode) ? root.dataset.themeMode : "system";
const palettes: Record<Scheme, ThemeId> = {
  light: paletteFor("light", root.dataset.themeLight),
  dark: paletteFor("dark", root.dataset.themeDark),
};

const scheme = (): Scheme =>
  mode === "dark" || (mode === "system" && media.matches) ? "dark" : "light";

export const getState = (): ThemeState => ({
  mode,
  scheme: scheme(),
  palettes: { ...palettes },
});

function save() {
  try {
    localStorage.setItem(STORAGE_KEYS.mode, mode);
    localStorage.setItem(STORAGE_KEYS.light, palettes.light);
    localStorage.setItem(STORAGE_KEYS.dark, palettes.dark);
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
  if (motionMedia.matches || !document.startViewTransition) update();
  else document.startViewTransition(update);
}

/** `animate`: crossfade if the palette changes. */
function apply(animate = false) {
  const theme = themeOf(palettes[scheme()])!;
  const update = () => {
    root.dataset.theme = theme.id;
    root.dataset.scheme = theme.scheme;
    root.dataset.themeMode = mode;
    root.dataset.themeLight = palettes.light;
    root.dataset.themeDark = palettes.dark;
    meta?.setAttribute("content", theme.bg);
  };
  if (animate && theme.id !== root.dataset.theme) transition(update);
  else update();
  notify();
}

export function setMode(next: ThemeMode) {
  mode = next;
  save();
  apply(true);
}

export function subscribe(fn: (state: ThemeState) => void) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

media.addEventListener("change", () => {
  if (mode === "system") apply(true);
});
