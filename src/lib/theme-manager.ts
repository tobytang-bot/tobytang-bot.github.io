// Client-side appearance state: mode (system | light | dark) × one palette
// per scheme, plus Reduce Motion and Liquid Glass intensity.
// The head script in BaseLayout resolves the initial state before first paint
// and records it on <html> (data-theme-mode, data-theme-light,
// data-theme-dark); this module takes over from there. UI components only
// call these functions.
import {
  DEFAULT_GLASS,
  DEFAULT_THEME,
  GLASS_LEVELS,
  MODES,
  STORAGE_KEYS,
  THEMES,
  type GlassLevel,
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
  /** Palette shown in place of the saved one while previewing. */
  preview: ThemeId | null;
  /** Reduce Motion turned on in the panel. */
  reduceMotion: boolean;
  /** Reduced motion requested by the operating system. */
  systemReducedMotion: boolean;
  glass: GlassLevel;
}

const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");
const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const listeners = new Set<(state: ThemeState) => void>();

const isMode = (v: unknown): v is ThemeMode => MODES.some((m) => m.id === v);
const isGlass = (v: unknown): v is GlassLevel => GLASS_LEVELS.some((g) => g.id === v);
const themeOf = (id: unknown) => THEMES.find((t) => t.id === id);
const paletteFor = (scheme: Scheme, v: unknown): ThemeId =>
  themeOf(v)?.scheme === scheme ? (v as ThemeId) : DEFAULT_THEME[scheme];

let mode: ThemeMode = isMode(root.dataset.themeMode) ? root.dataset.themeMode : "system";
const palettes: Record<Scheme, ThemeId> = {
  light: paletteFor("light", root.dataset.themeLight),
  dark: paletteFor("dark", root.dataset.themeDark),
};
let preview: ThemeId | null = null;
let reduceMotion = root.dataset.motion === "reduce";
let glass: GlassLevel = isGlass(root.dataset.glass) ? root.dataset.glass : DEFAULT_GLASS;

const scheme = (): Scheme =>
  mode === "dark" || (mode === "system" && media.matches) ? "dark" : "light";

export const getState = (): ThemeState => ({
  mode,
  scheme: scheme(),
  palettes: { ...palettes },
  preview,
  reduceMotion,
  systemReducedMotion: motionMedia.matches,
  glass,
});

function save() {
  try {
    localStorage.setItem(STORAGE_KEYS.mode, mode);
    localStorage.setItem(STORAGE_KEYS.light, palettes.light);
    localStorage.setItem(STORAGE_KEYS.dark, palettes.dark);
    if (reduceMotion) localStorage.setItem(STORAGE_KEYS.motion, "reduce");
    else localStorage.removeItem(STORAGE_KEYS.motion);
    localStorage.setItem(STORAGE_KEYS.glass, glass);
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
  const current = scheme();
  const theme = themeOf(preview ?? palettes[current])!;
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
  preview = null;
  save();
  apply(true);
}

/** Saves a palette for its own scheme; it shows if that scheme is in use. */
export function setPalette(next: ThemeId) {
  const theme = themeOf(next);
  if (!theme) return;
  palettes[theme.scheme] = next;
  preview = null;
  save();
  apply(true);
}

/** Shows a palette of the current scheme without saving it; `null` restores the saved one. */
export function previewPalette(next: ThemeId | null) {
  if (next === preview) return;
  if (next && themeOf(next)?.scheme !== scheme()) return;
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

export function setGlass(next: GlassLevel) {
  glass = next;
  // medium is the base look in tokens.css, so it needs no attribute.
  if (next === DEFAULT_GLASS) delete root.dataset.glass;
  else root.dataset.glass = next;
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
