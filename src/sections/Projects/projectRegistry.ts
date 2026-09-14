/*
  The list of real projects behind the CD-R (§8.3) — kept as one ordered
  array so the fan-out mechanic (Projects.tsx, projectFan.ts) and the
  WindowHost registration both derive from the same source instead of
  three hardcoded window kinds scattered across files. Adding/removing a
  project later means editing this one list; the fan-out math already
  adapts to whatever length it ends up being.
*/
export const PROJECT_KINDS = ["portfolio", "pandora", "agriverse"] as const;

export type ProjectKind = (typeof PROJECT_KINDS)[number];
