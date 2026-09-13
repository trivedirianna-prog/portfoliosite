// Reads the live value of a design token from :root. Centralizes token
// lookups so the CSS files stay the single source of truth for color
// values, instead of duplicating hex strings anywhere that needs one as
// a plain JS value (e.g. GSAP tweening a CSS custom property).
export function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
