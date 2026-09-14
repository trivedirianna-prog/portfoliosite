/*
  Shared journal geometry (§8.1) — the exact same path data used by both
  the small desktop icon (About.tsx) and the full-size window body
  (AboutWindow.tsx), so the window genuinely reuses "the real journal
  shape already built" rather than approximating it at a different
  scale. Both consumers render this in a 0-100 viewBox; only the
  containing element's own width/height differ.
*/

export const JOURNAL_COVER = { width: 44, height: 62, rx: 3 };

export const JOURNAL_PAGES_PATH =
  "M30,26 C46,18 68,21 83,33 L79,84 C64,74 43,72 27,80 Z";

export const JOURNAL_GUTTER_PATH = "M56,24 Q53,55 51,82";

export const JOURNAL_RIBBON_PATH =
  "M60,34 L67,32 L86,88 L78,94 L74,84 L70,94 L62,88 Z";
