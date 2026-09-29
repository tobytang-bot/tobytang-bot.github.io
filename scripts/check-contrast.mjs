// Checks WCAG AA contrast (4.5:1) for every text/background pair used by
// each theme in src/styles/themes.css, and that the no-JS fallback matches
// slate. Exits non-zero on failure so `npm run build` stops.
import { readFileSync } from "node:fs";

const MIN = 4.5;
const css = readFileSync(new URL("../src/styles/themes.css", import.meta.url), "utf8");

// Shiki comment colors, drawn on --code-bg (see markdown.shikiConfig.themes).
const COMMENT = { light: "#6a737d", dark: "#8b949e" }; // github-light, github-dark-default

// [text token, background tokens] as used by the components.
const PAIRS = [
  ["ink", ["bg", "surface", "surface-2", "accent-soft", "code-bg"]],
  ["ink-2", ["bg", "surface", "surface-2"]],
  ["ink-3", ["bg", "surface", "surface-2"]],
  ["accent", ["bg", "surface"]],
  ["on-accent", ["accent"]],
  ["status-investigating", ["bg", "surface"]],
  ["status-solved", ["bg", "surface"]],
  ["status-reference", ["bg", "surface"]],
  ["status-deprecated", ["bg", "surface"]],
];

function parseThemes(source) {
  const themes = new Map();
  const block = /([^{}]+)\{([^{}]*)\}/g;
  for (const [, selector, body] of source.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(block)) {
    const name = selector.includes(":not([data-theme])")
      ? "fallback"
      : (selector.match(/data-theme="([a-z]+)"/)?.[1] ?? null);
    if (!name) continue;
    const vars = Object.fromEntries(
      [...body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
    );
    vars.scheme = body.match(/color-scheme:\s*(dark|light)/)?.[1];
    themes.set(name, vars);
  }
  return themes;
}

const luminance = (hex) => {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const themes = parseThemes(css);
const failures = [];

for (const [name, vars] of themes) {
  if (name === "fallback") continue;
  const checks = PAIRS.flatMap(([fg, bgs]) => bgs.map((bg) => [fg, bg, vars[fg], vars[bg]]));
  checks.push(["shiki comment", "code-bg", COMMENT[vars.scheme], vars["code-bg"]]);
  for (const [fg, bg, a, b] of checks) {
    if (!a || !b) {
      failures.push(`${name}: missing --${!a ? fg : bg}`);
      continue;
    }
    const r = ratio(a, b);
    if (r < MIN) failures.push(`${name}: ${fg} ${a} on ${bg} ${b} = ${r.toFixed(2)}:1`);
  }
}

const fallback = themes.get("fallback");
const slate = themes.get("slate");
if (fallback && slate && JSON.stringify(fallback) !== JSON.stringify(slate)) {
  failures.push("fallback (no-JS dark) differs from slate; keep them in sync");
}

if (failures.length) {
  console.error(`Contrast check failed (minimum ${MIN}:1):\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`Contrast check passed: ${[...themes.keys()].filter((n) => n !== "fallback").join(", ")}`);
