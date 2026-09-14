import type { CSSProperties } from "react";

/*
  Shared "arranged editorial cluster" positioning (§8.1) for sections
  that spawn more than one window at once. Deliberately asymmetric and
  overlapping — a real shared edge, a confident chunk of the screen —
  same art-directed-scatter principle already used for the desktop
  object placement, not a plain offset or a random scatter. Lives here
  (not inside any one section's window) so a future multi-window
  section can reuse the same feel rather than re-deriving its own
  offsets.

  Windows stay upright — a prior version also rotated each window a few
  degrees in opposite directions; reverted per direction, so the
  "editorial spread" feeling now comes from offset position and overlap
  alone, not tilt.

  Two roles: PRIMARY (the plainer/lighter window, tucked behind/beside)
  and EMPHASIS (the visually heavier one, layered on top — pair with
  Window's own `emphasis` prop). Whichever window opens second lands on
  top of the DOM stack (see WindowManager), so open PRIMARY first.
*/
export const CLUSTER_PRIMARY: { style: CSSProperties } = {
  style: { left: "38%", top: "42%" },
};

export const CLUSTER_EMPHASIS: { style: CSSProperties } = {
  style: { left: "58%", top: "53%", width: "min(90vw, 490px)" },
};
