// Checks every color pair used in src/styles.css against WCAG.
// Run: node scripts/contrast.mjs   (exits 1 if any pair fails)
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const root = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
const vars = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum, what]
const pairs = [
  ["text", "bg", 4.5, "body text"],
  ["text", "surface", 4.5, "card text"],
  ["text", "surface-alt", 4.5, "hover / hash block text"],
  ["text-muted", "bg", 4.5, "muted text on page"],
  ["text-muted", "surface", 4.5, "muted text in cards and footer"],
  ["text-muted", "surface-alt", 4.5, "disabled button text"],
  ["primary", "bg", 4.5, "links on page"],
  ["primary", "surface", 4.5, "links in cards"],
  ["primary-hover", "surface-alt", 4.5, "link hover"],
  ["on-primary", "primary", 4.5, "primary button"],
  ["on-primary", "primary-hover", 4.5, "primary button hover"],
  ["hazard-text", "hazard-bg", 4.5, "hazard banner"],
  ["hazard-text", "surface", 4.5, "danger button, field errors"],
  ["hazard-text", "bg", 4.5, "danger button on page"],
  ["text-muted", "info-bg", 4.5, "muted text in info notices"],
  ["warn-text", "bg", 4.5, "mock flag"],
  ["warn-text", "warn-bg", 4.5, "warning panel"],
  ["ok-text", "ok-bg", 4.5, "ok notice"],
  ["info-text", "info-bg", 4.5, "info notice"],
  ["border-strong", "surface", 3, "input borders (non-text)"],
  ["border-strong", "bg", 3, "input borders on page (non-text)"],
  ["focus", "bg", 3, "focus ring on page (non-text)"],
  ["focus", "surface", 3, "focus ring in cards (non-text)"],
  ["hazard-border", "surface", 3, "invalid field border (non-text)"],
  ["primary", "surface", 3, "selected choice border (non-text)"],
];

let failed = 0;
for (const [fg, bg, min, what] of pairs) {
  const r = ratio(vars[fg], vars[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (need ${min})  ${fg} on ${bg}  ${what}`);
}
process.exit(failed ? 1 : 0);
